#!/usr/bin/env npx tsx
/**
 * Bulk Export CLI Tool
 * 
 * Export claude-recall data to various formats.
 * 
 * Usage:
 *   npx tsx tools/export/index.ts --format json --output backup.json
 *   npx tsx tools/export/index.ts --format csv --project my-project
 *   npx tsx tools/export/index.ts --format markdown --days 30
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';

type ExportFormat = 'json' | 'csv' | 'markdown';

interface ExportOptions {
  format: ExportFormat;
  output?: string;
  project?: string;
  days?: number;
  includeObservations: boolean;
  includeSummaries: boolean;
  help: boolean;
}

interface Observation {
  id: number;
  session_id: string;
  type: string;
  title: string;
  subtitle?: string;
  narrative: string;
  facts: string[];
  concepts: string[];
  files_read: string[];
  files_modified: string[];
  project: string;
  created_at: string;
}

interface Summary {
  id: number;
  session_id: string;
  request?: string;
  investigated?: string;
  learned?: string;
  completed?: string;
  next_steps?: string;
  project: string;
  created_at: string;
}

interface ExportData {
  exported_at: string;
  version: string;
  filters: {
    project?: string;
    days?: number;
  };
  observations: Observation[];
  summaries: Summary[];
}

function parseArgs(args: string[]): ExportOptions {
  const options: ExportOptions = {
    format: 'json',
    includeObservations: true,
    includeSummaries: true,
    help: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as ExportFormat;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--project':
      case '-p':
        options.project = args[++i];
        break;
      case '--days':
      case '-d':
        options.days = parseInt(args[++i], 10);
        break;
      case '--no-observations':
        options.includeObservations = false;
        break;
      case '--no-summaries':
        options.includeSummaries = false;
        break;
    }
  }
  
  return options;
}

function showHelp(): void {
  console.log(`
claude-recall Export Tool

Usage:
  npx tsx tools/export/index.ts [options]

Options:
  -h, --help              Show this help message
  -f, --format FORMAT     Export format: json, csv, markdown (default: json)
  -o, --output FILE       Output file path (default: stdout or auto-generated)
  -p, --project NAME      Filter by project
  -d, --days N            Only export last N days
  --no-observations       Exclude observations
  --no-summaries          Exclude summaries

Examples:
  npx tsx tools/export/index.ts --format json --output backup.json
  npx tsx tools/export/index.ts --format csv --project my-app
  npx tsx tools/export/index.ts --format markdown --days 7 > weekly-report.md
`);
}

async function fetchData(options: ExportOptions): Promise<ExportData> {
  const dataDir = join(homedir(), '.claude-recall');
  const dbPath = join(dataDir, 'memory.db');
  
  if (!existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}`);
    process.exit(1);
  }
  
  // Mock data - in real implementation, query the database
  return {
    exported_at: new Date().toISOString(),
    version: '9.0.9',
    filters: {
      project: options.project,
      days: options.days,
    },
    observations: [],
    summaries: [],
  };
}

function exportToJson(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

function exportToCsv(data: ExportData): string {
  const lines: string[] = [];
  
  // Observations CSV
  if (data.observations.length > 0) {
    lines.push('# Observations');
    lines.push('id,session_id,type,title,project,created_at');
    for (const obs of data.observations) {
      lines.push([
        obs.id,
        `"${obs.session_id}"`,
        obs.type,
        `"${obs.title.replace(/"/g, '""')}"`,
        `"${obs.project}"`,
        obs.created_at,
      ].join(','));
    }
    lines.push('');
  }
  
  // Summaries CSV
  if (data.summaries.length > 0) {
    lines.push('# Summaries');
    lines.push('id,session_id,project,created_at,completed');
    for (const sum of data.summaries) {
      lines.push([
        sum.id,
        `"${sum.session_id}"`,
        `"${sum.project}"`,
        sum.created_at,
        `"${(sum.completed || '').replace(/"/g, '""')}"`,
      ].join(','));
    }
  }
  
  return lines.join('\n');
}

function exportToMarkdown(data: ExportData): string {
  const lines: string[] = [];
  
  lines.push('# claude-recall Export');
  lines.push('');
  lines.push(`Exported: ${new Date(data.exported_at).toLocaleString()}`);
  if (data.filters.project) {
    lines.push(`Project: ${data.filters.project}`);
  }
  if (data.filters.days) {
    lines.push(`Period: Last ${data.filters.days} days`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Observations
  if (data.observations.length > 0) {
    lines.push('## Observations');
    lines.push('');
    
    for (const obs of data.observations) {
      lines.push(`### ${obs.type}: ${obs.title}`);
      lines.push('');
      if (obs.subtitle) {
        lines.push(`*${obs.subtitle}*`);
        lines.push('');
      }
      lines.push(obs.narrative);
      lines.push('');
      if (obs.concepts.length > 0) {
        lines.push(`**Concepts:** ${obs.concepts.join(', ')}`);
        lines.push('');
      }
      lines.push(`*${obs.project} | ${new Date(obs.created_at).toLocaleDateString()}*`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }
  
  // Summaries
  if (data.summaries.length > 0) {
    lines.push('## Session Summaries');
    lines.push('');
    
    for (const sum of data.summaries) {
      lines.push(`### Session: ${sum.session_id.slice(0, 8)}`);
      lines.push('');
      if (sum.completed) {
        lines.push('**Completed:**');
        lines.push(sum.completed);
        lines.push('');
      }
      if (sum.learned) {
        lines.push('**Learned:**');
        lines.push(sum.learned);
        lines.push('');
      }
      if (sum.next_steps) {
        lines.push('**Next Steps:**');
        lines.push(sum.next_steps);
        lines.push('');
      }
      lines.push(`*${sum.project} | ${new Date(sum.created_at).toLocaleDateString()}*`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

function getDefaultFilename(format: ExportFormat): string {
  const date = new Date().toISOString().split('T')[0];
  const extensions: Record<ExportFormat, string> = {
    json: 'json',
    csv: 'csv',
    markdown: 'md',
  };
  return `claude-recall-export-${date}.${extensions[format]}`;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  
  if (options.help) {
    showHelp();
    return;
  }
  
  if (!['json', 'csv', 'markdown'].includes(options.format)) {
    console.error(`Invalid format: ${options.format}`);
    console.error('Valid formats: json, csv, markdown');
    process.exit(1);
  }
  
  try {
    const data = await fetchData(options);
    
    let output: string;
    switch (options.format) {
      case 'json':
        output = exportToJson(data);
        break;
      case 'csv':
        output = exportToCsv(data);
        break;
      case 'markdown':
        output = exportToMarkdown(data);
        break;
    }
    
    if (options.output) {
      const dir = join(options.output, '..');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(options.output, output);
      console.error(`Exported to ${options.output}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

main();
