# 🌀 Zen Browser Sync & Backup CLI (`zen-sync`)

A powerful CLI tool designed to **export, backup, and restore** your entire [Zen Browser](https://zen-browser.app/) configuration across different instances and operating systems.

Easily sync your **Zen Mods, Extensions, Pinned Tabs (Pins/Essentials), Open Session, Browsing History, and Preferences** in a single `.zenbackup` compressed file.

---

## ✨ Features

- 🎨 **Zen Mods Backup:** Complete export of installed Zen Mods & themes (`zen-themes.json`).
- 🧩 **Extensions:** Export and restore installed `.xpi` extensions and metadata (`extensions.json`).
- 📌 **Session & Pinned Tabs:** Preserve all open tabs, tab groups, and Pinned/Essential tabs (`sessionstore.jsonlz4`).
- 📜 **History & Bookmarks:** Complete backup of browsing history, bookmarks, and favicons (`places.sqlite`, `favicons.sqlite`).
- ⚙️ **Custom Styles & Preferences:** Back up custom `userChrome.css` styles and `about:config` preferences (`prefs.js`, `user.js`).
- 💻 **Cross-Platform Auto-Detection:** Automatically detects Zen Browser profile paths on **Linux**, **macOS**, and **Windows**.

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Node.js (v18 or higher)** installed.

### 2. Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/tu-usuario/Zen_Mods.git
cd Zen_Mods
npm install
```

*(Optional)* Link globally to use `zen-sync` anywhere in your terminal:
```bash
npm link
```

---

## 💻 Usage

### 🔍 1. List Detected Zen Profiles
Detect all Zen Browser profiles available on your system:

```bash
node index.mjs profiles
# Or if linked globally:
zen-sync profiles
```

*Example Output:*
```text
Base directory: /home/rousseau/.config/zen

Detected Profiles:
 - Default Profile
   Path: /home/rousseau/.config/zen/overfapp.Default Profile
 - Default (release) (Default)
   Path: /home/rousseau/.config/zen/rm1st2zi.Default (release)
```

---

### 📦 2. Export Backup (`export`)

Export your active profile to a `.zenbackup` file:

```bash
node index.mjs export -o ~/MyZenBackup.zenbackup
```

#### Advanced Export Options:
```bash
# Export a specific profile by name
node index.mjs export -p "release" -o ~/ZenReleaseBackup.zenbackup

# Exclude browsing history from the backup
node index.mjs export --no-history -o ~/PrivateBackup.zenbackup

# Export only Mods & Extensions (exclude session, history & config)
node index.mjs export --no-session --no-history --no-config -o ~/ModsAndExtensions.zenbackup
```

---

### 📥 3. Import & Restore (`import`)

> [!WARNING]
> Close **Zen Browser** before performing a full restore to avoid file lock conflicts with `places.sqlite` and session databases.

#### Dry-Run Mode (Simulation):
Verify what will be restored without writing any files:
```bash
node index.mjs import -i ~/MyZenBackup.zenbackup --dry-run
```

#### Full Import:
Restore everything into your default profile:
```bash
node index.mjs import -i ~/MyZenBackup.zenbackup
```

#### Import to a Specific Profile:
```bash
node index.mjs import -i ~/MyZenBackup.zenbackup -p "Default Profile"
```

---

## ⚙️ CLI Options & Flags

| Command | Option | Description |
| :--- | :--- | :--- |
| `profiles` | - | Lists all detected Zen Browser profiles |
| `export` | `-o, --output <path>` | Destination output file path (default: `zen-backup.zenbackup`) |
| `export` | `-p, --profile <name>` | Target profile to export |
| `export` | `--no-mods` | Exclude Zen Mods |
| `export` | `--no-extensions` | Exclude WebExtensions |
| `export` | `--no-session` | Exclude Open Tabs and Pins |
| `export` | `--no-history` | Exclude Browsing History and Bookmarks |
| `export` | `--no-config` | Exclude Preferences (`prefs.js`) and CSS |
| `import` | `-i, --input <path>` | **Required.** Path to `.zenbackup` file |
| `import` | `-p, --profile <name>` | Destination profile to restore into |
| `import` | `--dry-run` | Simulate restore process without modifying files |

---

## 📄 License

[MIT](LICENSE) © 2026
