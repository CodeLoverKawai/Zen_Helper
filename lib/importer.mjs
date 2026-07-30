import fs from 'fs';
import path from 'path';
import extract from 'extract-zip';
import os from 'os';

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
    await extract(backupPath, { dir: tempDir });

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

    // Restaurar Zen Mods
    if (options.mods !== false && fs.existsSync(path.join(tempDir, 'zen-themes.json'))) {
      copyRecursive(path.join(tempDir, 'zen-themes.json'), path.join(targetProfilePath, 'zen-themes.json'));
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

        // Si existe recovery.jsonlz4 en los backups pero no sessionstore.jsonlz4 en la raíz, duplicarlo para forzar a Zen a cargar las pestañas
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
