#!/usr/bin/env npx tsx
/**
 * Memory Statistics CLI Tool
 * 
 * Displays statistics about your claude-recall memory database.
 * 
 * Usage:
 *   npx tsx tools/stats/index.ts
 *   npx tsx tools/stats/index.ts --project my-project
 *   npx tsx tools/stats/index.ts --json
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

interface Stats {
  totalObservations: number;
  totalSessions: number;
  totalSummaries: number;
  totalProjects: number;
  tokensUsed: number;
  observationsByType: Record<string, number>;
  observationsByProject: Record<string, number>;
  recentActivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  topConcepts: Array<{ concept: string; count: number }>;
  averageObservationsPerSession: number;
  oldestObservation: string | null;
  newestObservation: string | null;
}

interface CliOptions {
  project?: string;
  json: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    json: false,
    help: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--project' || arg === '-p') {
      options.project = args[++i];
    }
  }
  
  return options;
}

function showHelp(): void {
  console.log(`
claude-recall Statistics Tool

Usage:
  npx tsx tools/stats/index.ts [options]

Options:
  -h, --help           Show this help message
  -p, --project NAME   Filter stats by project
  --json               Output as JSON

Examples:
  npx tsx tools/stats/index.ts
  npx tsx tools/stats/index.ts --project my-app
  npx tsx tools/stats/index.ts --json > stats.json
`);
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function getStats(project?: string): Promise<Stats> {
  // This would normally connect to the SQLite database
  // For now, return mock data structure
  const dataDir = join(homedir(), '.claude-recall');
  const dbPath = join(dataDir, 'memory.db');
  
  if (!existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}`);
    console.error('Run claude-recall first to create the database.');
    process.exit(1);
  }
  
  // Mock stats - in real implementation, query the database
  return {
    totalObservations: 0,
    totalSessions: 0,
    totalSummaries: 0,
    totalProjects: 0,
    tokensUsed: 0,
    observationsByType: {},
    observationsByProject: {},
    recentActivity: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    },
    topConcepts: [],
    averageObservationsPerSession: 0,
    oldestObservation: null,
    newestObservation: null,
  };
}

function displayStats(stats: Stats): void {
  console.log('\n📊 claude-recall Statistics\n');
  console.log('═'.repeat(50));
  
  // Overview
  console.log('\n📈 Overview');
  console.log('─'.repeat(40));
  console.log(`  Total Observations:  ${formatNumber(stats.totalObservations)}`);
  console.log(`  Total Sessions:      ${formatNumber(stats.totalSessions)}`);
  console.log(`  Total Summaries:     ${formatNumber(stats.totalSummaries)}`);
  console.log(`  Total Projects:      ${formatNumber(stats.totalProjects)}`);
  console.log(`  Tokens Used:         ${formatNumber(stats.tokensUsed)}`);
  console.log(`  Avg Obs/Session:     ${stats.averageObservationsPerSession.toFixed(1)}`);
  
  // Date range
  console.log('\n📅 Date Range');
  console.log('─'.repeat(40));
  console.log(`  Oldest:  ${formatDate(stats.oldestObservation)}`);
  console.log(`  Newest:  ${formatDate(stats.newestObservation)}`);
  
  // Recent activity
  console.log('\n🕐 Recent Activity');
  console.log('─'.repeat(40));
  console.log(`  Today:      ${formatNumber(stats.recentActivity.today)}`);
  console.log(`  This Week:  ${formatNumber(stats.recentActivity.thisWeek)}`);
  console.log(`  This Month: ${formatNumber(stats.recentActivity.thisMonth)}`);
  
  // By type
  if (Object.keys(stats.observationsByType).length > 0) {
    console.log('\n📋 By Type');
    console.log('─'.repeat(40));
    for (const [type, count] of Object.entries(stats.observationsByType)) {
      const bar = '█'.repeat(Math.min(20, Math.round(count / stats.totalObservations * 20)));
      console.log(`  ${type.padEnd(15)} ${bar} ${count}`);
    }
  }
  
  // By project
  if (Object.keys(stats.observationsByProject).length > 0) {
    console.log('\n📁 By Project');
    console.log('─'.repeat(40));
    const sorted = Object.entries(stats.observationsByProject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [project, count] of sorted) {
      console.log(`  ${project.padEnd(25)} ${formatNumber(count)}`);
    }
  }
  
  // Top concepts
  if (stats.topConcepts.length > 0) {
    console.log('\n🏷️  Top Concepts');
    console.log('─'.repeat(40));
    for (const { concept, count } of stats.topConcepts.slice(0, 10)) {
      console.log(`  ${concept.padEnd(20)} ${formatNumber(count)}`);
    }
  }
  
  console.log('\n' + '═'.repeat(50));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  
  if (options.help) {
    showHelp();
    return;
  }
  
  try {
    const stats = await getStats(options.project);
    
    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      displayStats(stats);
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    process.exit(1);
  }
}

main();
