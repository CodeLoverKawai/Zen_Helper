import path from 'path';
import os from 'os';
import fs from 'fs';

/**
 * Retorna el directorio raíz de datos de Zen Browser según el Sistema Operativo.
 */
export function getZenBaseDir() {
  const platform = os.platform();
  const home = os.homedir();

  if (platform === 'linux') {
    // Buscar en ~/.config/zen (estándar/native/flatpak link) o ~/.mozilla/zen
    const configZen = path.join(home, '.config', 'zen');
    const mozillaZen = path.join(home, '.mozilla', 'zen');
    const flatpakZen = path.join(home, '.var', 'app', 'app.zen_browser.zen', '.config', 'zen');

    if (fs.existsSync(configZen)) return configZen;
    if (fs.existsSync(mozillaZen)) return mozillaZen;
    if (fs.existsSync(flatpakZen)) return flatpakZen;
    return configZen;
  } else if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'zen');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'zen');
  }

  return path.join(home, '.config', 'zen');
}

/**
 * Parsea profiles.ini para listar los perfiles existentes de Zen.
 */
export function getZenProfiles() {
  const baseDir = getZenBaseDir();
  const iniPath = path.join(baseDir, 'profiles.ini');

  if (!fs.existsSync(iniPath)) {
    return [];
  }

  const content = fs.readFileSync(iniPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const profiles = [];
  let currentProfile = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[Profile')) {
      if (currentProfile) profiles.push(currentProfile);
      currentProfile = {};
    } else if (currentProfile && trimmed.includes('=')) {
      const [key, ...valParts] = trimmed.split('=');
      const val = valParts.join('=');
      currentProfile[key.trim()] = val.trim();
    }
  }

  if (currentProfile) profiles.push(currentProfile);

  return profiles.map(p => {
    const isRelative = p.IsRelative === '1';
    const profilePath = isRelative ? path.join(baseDir, p.Path) : p.Path;
    return {
      name: p.Name || path.basename(profilePath),
      path: profilePath,
      isDefault: p.Default === '1' || p.Name === 'default-release'
    };
  });
}

/**
 * Obtiene la ruta del perfil por defecto o especificado.
 */
export function resolveProfilePath(targetNameOrPath) {
  const profiles = getZenProfiles();

  if (targetNameOrPath) {
    // Verificar si es una ruta explícita existente
    if (fs.existsSync(targetNameOrPath)) return targetNameOrPath;

    // Buscar por nombre o coincidencia en la ruta
    const found = profiles.find(p => 
      p.name.toLowerCase().includes(targetNameOrPath.toLowerCase()) ||
      p.path.toLowerCase().includes(targetNameOrPath.toLowerCase())
    );
    if (found) return found.path;
  }

  // Si hay un perfil con 'release' o archivos modificados recientemente, preferirlo si no hay default explícito
  const defaultProf = profiles.find(p => p.isDefault && fs.existsSync(path.join(p.path, 'extensions.json'))) ||
                      profiles.find(p => p.path.includes('Default (release)')) ||
                      profiles[0];

  if (!defaultProf) {
    throw new Error('No se encontró ningún perfil de Zen Browser instalado.');
  }

  return defaultProf.path;
}

