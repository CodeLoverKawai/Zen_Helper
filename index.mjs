#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { getZenProfiles, getZenBaseDir, resolveProfilePath } from './lib/zen-paths.mjs';
import { exportZenBackup } from './lib/exporter.mjs';
import { importZenBackup } from './lib/importer.mjs';

const program = new Command();

program
  .name('zen-sync')
  .description('CLI tool to export and import Zen Browser mods, extensions, session, history, and preferences.')
  .version('1.0.0');

// Comando: profiles
program
  .command('profiles')
  .description('List detected Zen Browser profiles')
  .action(() => {
    console.log(`Base directory: ${getZenBaseDir()}`);
    const profiles = getZenProfiles();
    if (profiles.length === 0) {
      console.log('No profiles found.');
      return;
    }
    console.log('\nDetected Profiles:');
    profiles.forEach(p => {
      console.log(` - ${p.name} ${p.isDefault ? '(Default)' : ''}`);
      console.log(`   Path: ${p.path}`);
    });
  });

// Comando: export
program
  .command('export')
  .description('Export Zen Browser data to a backup file (.zenbackup)')
  .option('-p, --profile <nameOrPath>', 'Profile name or exact path to export')
  .option('-o, --output <filePath>', 'Output zip file path', 'zen-backup.zenbackup')
  .option('--no-mods', 'Exclude Zen Mods')
  .option('--no-extensions', 'Exclude Extensions')
  .option('--no-session', 'Exclude open tabs and pins (Session)')
  .option('--no-history', 'Exclude History and Bookmarks')
  .option('--no-config', 'Exclude Preferences and CSS styles')
  .action(async (opts) => {
    try {
      const profilePath = resolveProfilePath(opts.profile);
      const outputPath = path.resolve(process.cwd(), opts.output);

      console.log(`📦 Exporting Zen Browser profile...`);
      console.log(`   Source profile: ${profilePath}`);
      console.log(`   Destination: ${outputPath}`);

      const result = await exportZenBackup(profilePath, outputPath, {
        mods: opts.mods !== false,
        extensions: opts.extensions !== false,
        session: opts.session !== false,
        history: opts.history !== false,
        config: opts.config !== false
      });

      const sizeMB = (result.bytes / (1024 * 1024)).toFixed(2);
      console.log(`\n✅ Backup successfully created!`);
      console.log(`   File: ${result.path}`);
      console.log(`   Size: ${sizeMB} MB`);
    } catch (err) {
      console.error(`\n❌ Export failed: ${err.message}`);
      process.exit(1);
    }
  });

// Comando: import
program
  .command('import')
  .description('Import and restore a Zen Browser backup file (.zenbackup)')
  .requiredOption('-i, --input <filePath>', 'Path to the .zenbackup file')
  .option('-p, --profile <nameOrPath>', 'Target profile name or exact path to restore to')
  .option('--dry-run', 'Simulate import without writing files')
  .option('--no-mods', 'Do not restore Zen Mods')
  .option('--no-extensions', 'Do not restore Extensions')
  .option('--no-session', 'Do not restore Session (open tabs/pins)')
  .option('--no-history', 'Do not restore History')
  .option('--no-config', 'Do not restore Preferences')
  .action(async (options) => {
    try {
      const backupPath = path.resolve(process.cwd(), options.input);
      const targetProfilePath = resolveProfilePath(options.profile);

      console.log(`📥 Preparing to import Zen Browser backup...`);
      console.log(`   Backup file: ${backupPath}`);
      console.log(`   Target profile: ${targetProfilePath}`);

      const result = await importZenBackup(backupPath, targetProfilePath, {
        dryRun: options.dryRun || false,
        mods: options.mods,
        extensions: options.extensions,
        session: options.session,
        history: options.history,
        config: options.config
      });

      if (result.dryRun) {
        console.log(`\n🔍 [Dry Run] Simulation completed.`);
        console.log(`   Manifest contents: ${result.manifest.contents.join(', ')}`);
        console.log(`   Target profile path: ${result.targetProfilePath}`);
      } else {
        console.log(`\n✅ Restore completed successfully!`);
        console.log(`   Restored files count: ${result.restoredFilesCount}`);
        console.log(`   Profile updated: ${result.targetProfilePath}`);
        console.log(`\n💡 Tip: Restart Zen Browser to apply all changes.`);
      }
    } catch (err) {
      console.error(`\n❌ Import failed: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
