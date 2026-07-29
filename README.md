# 🚀 CLI de Respaldos y Sincronización para Zen Browser (`zen-sync`)

Herramienta CLI completa para exportar e importar todo el estado de **Zen Browser** entre diferentes instancias, incluyendo:
- 🎨 **Zen Mods** (`zen-themes.json`)
- 🧩 **Extensiones instaladas** (`.xpi` y `extensions.json`)
- 📌 **Pestañas abiertas y Pinned Tabs (Pins / Essentials)** (`sessionstore.jsonlz4`, `sessionCheckpoints.json`, etc.)
- 📜 **Historial de navegación, Marcadores y Favicons** (`places.sqlite`, `favicons.sqlite`)
- ⚙️ **Configuraciones y Estilos personalizados** (`prefs.js`, `user.js`, carpeta `chrome/`)

---

## 🛠️ Instalación y Requisitos

Requiere **Node.js v18+**.

Para enlazar el comando `zen-sync` globalmente o ejecutarlo directamente:

```bash
# Opción 1: Enlazar ejecutable CLI
npm link

# Opción 2: Ejecutar localmente con node
node index.mjs <comando>
```

---

## 📋 Comandos Disponibles

### 1. Listar Perfiles Detectados (`profiles`)
Detecta automáticamente los perfiles de Zen Browser instalados en el sistema (Linux, macOS, Windows).

```bash
zen-sync profiles
```

*Ejemplo de salida:*
```text
Base directory: /home/rousseau/.config/zen

Detected Profiles:
 - Default (release) (Default)
   Path: /home/rousseau/.config/zen/rm1st2zi.Default (release)
```

---

### 2. Exportar Copia de Seguridad (`export`)
Exporta todo el perfil o partes específicas en un único archivo comprimido `.zenbackup`.

#### Exportación completa (Predeterminada):
```bash
zen-sync export -o ~/MiBackupZen.zenbackup
```

#### Exportar perfil específico por nombre:
```bash
zen-sync export -p "release" -o ~/ZenReleaseBackup.zenbackup
```

#### Exportar excluyendo elementos específicos (Flags):
```bash
# Exportar todo excepto el historial
zen-sync export --no-history -o backup-sin-historial.zenbackup

# Exportar solo Zen Mods y Extensiones
zen-sync export --no-session --no-history --no-config -o mods-y-extensiones.zenbackup
```

---

### 3. Importar / Restaurar Copia de Seguridad (`import`)
Restaura el contenido de un archivo `.zenbackup` en la instancia o perfil especificado.

> [!WARNING]
> Cierra **Zen Browser** antes de ejecutar una restauración para asegurar que los archivos SQLite (`places.sqlite`) y de sesión no estén bloqueados por el navegador.

#### Modo simulación (Dry Run):
Verifica lo que se va a restaurar sin escribir ningún archivo:
```bash
zen-sync import -i ~/MiBackupZen.zenbackup --dry-run
```

#### Restauración completa:
```bash
zen-sync import -i ~/MiBackupZen.zenbackup
```

#### Restaurar en un perfil específico:
```bash
zen-sync import -i ~/MiBackupZen.zenbackup -p "Default Profile"
```

#### Restaurar omitiendo el historial:
```bash
zen-sync import -i ~/MiBackupZen.zenbackup --no-history
```

---

## 🔍 Resumen de Pruebas Realizadas

- **Prueba de exportación de perfil activo:** Realizada exitosamente generando un archivo empaquetado `.zenbackup` con un tamaño de **45.44 MB** que contiene el historial completo, mods, extensiones y sesión activa.
- **Prueba de simulación (Dry Run):** Verificado que lee correctamente el manifiesto e identifica las secciones a restaurar.
