#!/usr/bin/env npx tsx
/**
 * Migration Runner
 * 
 * Run database migrations.
 * 
 * Usage:
 *   npm run migrate
 *   npx tsx scripts/migrate.ts
 *   npx tsx scripts/migrate.ts --dry-run
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';

interface MigrationOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

interface Migration {
  version: number;
  filename: string;
  sql: string;
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {};

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }

  return options;
}

function loadMigrations(): Migration[] {
  const migrationsDir = join(process.cwd(), 'migrations');
  
  if (!existsSync(migrationsDir)) {
    console.error('Migrations directory not found');
    return [];
  }

  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(filename => {
    const match = filename.match(/^(\d+)_/);
    const version = match ? parseInt(match[1], 10) : 0;
    const sql = readFileSync(join(migrationsDir, filename), 'utf-8');
    return { version, filename, sql };
  });
}

async function main() {
  const options = parseArgs();
  const migrations = loadMigrations();

  console.log('\n🔄 claude-recall Migration Runner\n');
  console.log('═'.repeat(50));

  if (migrations.length === 0) {
    console.log('No migrations found.');
    return;
  }

  console.log(`Found ${migrations.length} migrations:\n`);

  for (const migration of migrations) {
    const status = options.dryRun ? '[DRY RUN]' : '[PENDING]';
    console.log(`  ${status} ${migration.filename}`);
    
    if (options.verbose) {
      console.log(`    Version: ${migration.version}`);
      console.log(`    Lines: ${migration.sql.split('\n').length}`);
    }
  }

  if (options.dryRun) {
    console.log('\n⚠️  Dry run mode - no changes made');
  } else {
    console.log('\n✅ Migrations would be applied here');
    console.log('   (Database connection not implemented in this script)');
  }

  console.log('\n' + '═'.repeat(50));
}

main().catch(console.error);
