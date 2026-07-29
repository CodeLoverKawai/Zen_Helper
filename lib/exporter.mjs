import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Empaqueta datos de un perfil de Zen Browser en un archivo ZIP (.zenbackup)
 */
export async function exportZenBackup(profilePath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(profilePath)) {
      return reject(new Error(`La ruta del perfil no existe: ${profilePath}`));
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve({
        bytes: archive.pointer(),
        path: outputPath
      });
    });

    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    const manifest = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      contents: []
    };

    // 1. Zen Mods (zen-themes.json)
    if (options.mods !== false) {
      const zenThemesPath = path.join(profilePath, 'zen-themes.json');
      if (fs.existsSync(zenThemesPath)) {
        archive.file(zenThemesPath, { name: 'zen-themes.json' });
        manifest.contents.push('mods');
      }
    }

    // 2. Extensiones (.xpi + extensions.json)
    if (options.extensions !== false) {
      const extJson = path.join(profilePath, 'extensions.json');
      const extDir = path.join(profilePath, 'extensions');

      if (fs.existsSync(extJson)) {
        archive.file(extJson, { name: 'extensions.json' });
      }
      if (fs.existsSync(extDir)) {
        archive.directory(extDir, 'extensions');
      }
      manifest.contents.push('extensions');
    }

    // 3. Sesión y Pestañas Abiertas (sessionstore.jsonlz4, etc.)
    if (options.session !== false) {
      const sessionFiles = ['sessionstore.jsonlz4', 'sessionCheckpoints.json', 'recovery.jsonlz4'];
      const sessionDir = path.join(profilePath, 'sessionstore-backups');

      for (const file of sessionFiles) {
        const filePath = path.join(profilePath, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      }
      if (fs.existsSync(sessionDir)) {
        archive.directory(sessionDir, 'sessionstore-backups');
      }
      manifest.contents.push('session');
    }

    // 4. Historial y Marcadores (places.sqlite, favicons.sqlite)
    if (options.history !== false) {
      const historyFiles = ['places.sqlite', 'favicons.sqlite'];
      for (const file of historyFiles) {
        const filePath = path.join(profilePath, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      }
      manifest.contents.push('history');
    }

    // 5. Configuración y Estilos Personalizados (prefs.js, user.js, chrome/)
    if (options.config !== false) {
      const configFiles = ['prefs.js', 'user.js'];
      const chromeDir = path.join(profilePath, 'chrome');

      for (const file of configFiles) {
        const filePath = path.join(profilePath, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      }
      if (fs.existsSync(chromeDir)) {
        archive.directory(chromeDir, 'chrome');
      }
      manifest.contents.push('config');
    }

    // Adjuntar manifiesto
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    archive.finalize();
  });
}
