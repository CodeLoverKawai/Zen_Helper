import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

/**
 * Importa y restaura una copia de seguridad (.zenbackup ZIP) en un perfil de Zen Browser.
 */
export async function importZenBackup(backupPath, targetProfilePath, options = {}) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`El archivo de respaldo no existe: ${backupPath}`);
  }

  if (!fs.existsSync(targetProfilePath)) {
    fs.mkdirSync(targetProfilePath, { recursive: true });
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zen-restore-'));

  try {
    // 1. Extraer respaldo a directorio temporal
    execSync(`unzip -o -q "${backupPath}" -d "${tempDir}"`);

    const manifestPath = path.join(tempDir, 'manifest.json');
    let manifest = { contents: [] };

    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }

    if (options.dryRun) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      return {
        dryRun: true,
        manifest,
        targetProfilePath
      };
    }

    const copiedFiles = [];

    // Helper para copiar recursivamente
    const copyRecursive = (src, dest) => {
      if (!fs.existsSync(src)) return;
      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
          copyRecursive(path.join(src, child), path.join(dest, child));
        }
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        copiedFiles.push(path.basename(dest));
      }
    };

    // Restaurar Zen Mods (zen-themes.json + chrome/zen-themes)
    if (options.mods !== false) {
      if (fs.existsSync(path.join(tempDir, 'zen-themes.json'))) {
        copyRecursive(path.join(tempDir, 'zen-themes.json'), path.join(targetProfilePath, 'zen-themes.json'));
      }
      if (fs.existsSync(path.join(tempDir, 'chrome', 'zen-themes'))) {
        copyRecursive(path.join(tempDir, 'chrome', 'zen-themes'), path.join(targetProfilePath, 'chrome', 'zen-themes'));
      }
      if (fs.existsSync(path.join(tempDir, 'chrome', 'zen-themes.css'))) {
        copyRecursive(path.join(tempDir, 'chrome', 'zen-themes.css'), path.join(targetProfilePath, 'chrome', 'zen-themes.css'));
      }
    }

    // Restaurar Extensiones
    if (options.extensions !== false) {
      if (fs.existsSync(path.join(tempDir, 'extensions.json'))) {
        copyRecursive(path.join(tempDir, 'extensions.json'), path.join(targetProfilePath, 'extensions.json'));
      }
      if (fs.existsSync(path.join(tempDir, 'extensions'))) {
        copyRecursive(path.join(tempDir, 'extensions'), path.join(targetProfilePath, 'extensions'));
      }
    }

    // Restaurar Sesión y Pins
    if (options.session !== false) {
      const sessionFiles = ['sessionstore.jsonlz4', 'sessionCheckpoints.json', 'recovery.jsonlz4'];
      for (const file of sessionFiles) {
        if (fs.existsSync(path.join(tempDir, file))) {
          copyRecursive(path.join(tempDir, file), path.join(targetProfilePath, file));
        }
      }
      if (fs.existsSync(path.join(tempDir, 'sessionstore-backups'))) {
        copyRecursive(path.join(tempDir, 'sessionstore-backups'), path.join(targetProfilePath, 'sessionstore-backups'));

        const backupRecovery = path.join(tempDir, 'sessionstore-backups', 'recovery.jsonlz4');
        if (fs.existsSync(backupRecovery)) {
          copyRecursive(backupRecovery, path.join(targetProfilePath, 'sessionstore.jsonlz4'));
          copyRecursive(backupRecovery, path.join(targetProfilePath, 'recovery.jsonlz4'));
        }
      }
    }

    // Restaurar Historial
    if (options.history !== false) {
      const historyFiles = ['places.sqlite', 'favicons.sqlite'];
      for (const file of historyFiles) {
        if (fs.existsSync(path.join(tempDir, file))) {
          copyRecursive(path.join(tempDir, file), path.join(targetProfilePath, file));
        }
      }
    }

    // Restaurar Configuración y CSS
    if (options.config !== false) {
      const configFiles = ['prefs.js', 'user.js'];
      for (const file of configFiles) {
        if (fs.existsSync(path.join(tempDir, file))) {
          copyRecursive(path.join(tempDir, file), path.join(targetProfilePath, file));
        }
      }
      if (fs.existsSync(path.join(tempDir, 'chrome'))) {
        copyRecursive(path.join(tempDir, 'chrome'), path.join(targetProfilePath, 'chrome'));
      }
    }

    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      success: true,
      restoredFilesCount: copiedFiles.length,
      targetProfilePath
    };
  } catch (err) {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw err;
  }
}
