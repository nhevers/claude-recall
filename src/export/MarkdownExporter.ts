/**
 * Markdown Exporter
 * 
 * Exports observations and sessions to Markdown format.
 */

import type { Observation, Summary, Session } from '../types/index.js';

export interface MarkdownExportOptions {
  includeTableOfContents?: boolean;
  groupByProject?: boolean;
  groupByDate?: boolean;
  includeStats?: boolean;
  headingLevel?: number;
}

export class MarkdownExporter {
  private options: MarkdownExportOptions;

  constructor(options: MarkdownExportOptions = {}) {
    this.options = {
      includeTableOfContents: true,
      groupByProject: false,
      groupByDate: true,
      includeStats: true,
      headingLevel: 1,
      ...options,
    };
  }

  /**
   * Export all data to Markdown
   */
  export(
    observations: Observation[],
    sessions: Session[],
    summaries: Summary[]
  ): string {
    const lines: string[] = [];
    const h = this.heading;

    lines.push(h(1, 'claude-recall Export'));
    lines.push('');
    lines.push(`*Exported on ${new Date().toLocaleString()}*`);
    lines.push('');

    if (this.options.includeStats) {
      lines.push(h(2, 'Statistics'));
      lines.push('');
      lines.push(`- **Total Observations:** ${observations.length}`);
      lines.push(`- **Total Sessions:** ${sessions.length}`);
      lines.push(`- **Total Summaries:** ${summaries.length}`);
      lines.push(`- **Projects:** ${this.getUniqueProjects(observations).length}`);
      lines.push('');
    }

    if (this.options.includeTableOfContents && observations.length > 0) {
      lines.push(h(2, 'Table of Contents'));
      lines.push('');
      lines.push('- [Observations](#observations)');
      lines.push('- [Session Summaries](#session-summaries)');
      lines.push('');
    }

    lines.push('---');
    lines.push('');

    // Observations section
    lines.push(h(2, 'Observations'));
    lines.push('');

    if (this.options.groupByProject) {
      lines.push(...this.exportObservationsByProject(observations));
    } else if (this.options.groupByDate) {
      lines.push(...this.exportObservationsByDate(observations));
    } else {
      lines.push(...this.exportObservationsList(observations));
    }

    // Summaries section
    if (summaries.length > 0) {
      lines.push('---');
      lines.push('');
      lines.push(h(2, 'Session Summaries'));
      lines.push('');
      lines.push(...this.exportSummaries(summaries));
    }

    return lines.join('\n');
  }

  /**
   * Export single observation to Markdown
   */
  exportObservation(obs: Observation): string {
    const lines: string[] = [];
    const h = this.heading;

    lines.push(h(3, `${this.getTypeEmoji(obs.type)} ${obs.title}`));
    lines.push('');

    if (obs.subtitle) {
      lines.push(`*${obs.subtitle}*`);
      lines.push('');
    }

    if (obs.narrative) {
      lines.push(obs.narrative);
      lines.push('');
    }

    const facts = this.parseArray(obs.facts);
    if (facts.length > 0) {
      lines.push('**Key Facts:**');
      for (const fact of facts) {
        lines.push(`- ${fact}`);
      }
      lines.push('');
    }

    const concepts = this.parseArray(obs.concepts);
    if (concepts.length > 0) {
      lines.push(`**Concepts:** ${concepts.map(c => `\`${c}\``).join(' ')}`);
      lines.push('');
    }

    const filesModified = this.parseArray(obs.files_modified);
    if (filesModified.length > 0) {
      lines.push('**Files Modified:**');
      for (const file of filesModified) {
        lines.push(`- \`${file}\``);
      }
      lines.push('');
    }

    lines.push(`*${obs.project} | ${this.formatDate(obs.created_at)} | Prompt #${obs.prompt_number}*`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Export summary to Markdown
   */
  exportSummary(summary: Summary): string {
    const lines: string[] = [];
    const h = this.heading;

    lines.push(h(3, `Session: ${summary.session_id.slice(0, 8)}`));
    lines.push('');
    lines.push(`*${summary.project} | ${this.formatDate(summary.created_at)}*`);
    lines.push('');

    if (summary.request) {
      lines.push('**What was requested:**');
      lines.push(summary.request);
      lines.push('');
    }

    if (summary.investigated) {
      lines.push('**What was investigated:**');
      lines.push(summary.investigated);
      lines.push('');
    }

    if (summary.learned) {
      lines.push('**What was learned:**');
      lines.push(summary.learned);
      lines.push('');
    }

    if (summary.completed) {
      lines.push('**What was completed:**');
      lines.push(summary.completed);
      lines.push('');
    }

    if (summary.next_steps) {
      lines.push('**Next steps:**');
      lines.push(summary.next_steps);
      lines.push('');
    }

    if (summary.notes) {
      lines.push('**Notes:**');
      lines.push(summary.notes);
      lines.push('');
    }

    return lines.join('\n');
  }

  private exportObservationsByProject(observations: Observation[]): string[] {
    const lines: string[] = [];
    const h = this.heading;
    const byProject = this.groupBy(observations, o => o.project);

    for (const [project, obs] of Object.entries(byProject)) {
      lines.push(h(3, project));
      lines.push('');
      for (const o of obs) {
        lines.push(this.exportObservation(o));
      }
    }

    return lines;
  }

  private exportObservationsByDate(observations: Observation[]): string[] {
    const lines: string[] = [];
    const h = this.heading;
    const byDate = this.groupBy(observations, o => 
      new Date(o.created_at).toISOString().split('T')[0]
    );

    const sortedDates = Object.keys(byDate).sort().reverse();

    for (const date of sortedDates) {
      const obs = byDate[date];
      lines.push(h(3, this.formatDateHeading(date)));
      lines.push('');
      for (const o of obs) {
        lines.push(this.exportObservation(o));
      }
    }

    return lines;
  }

  private exportObservationsList(observations: Observation[]): string[] {
    const lines: string[] = [];
    for (const obs of observations) {
      lines.push(this.exportObservation(obs));
    }
    return lines;
  }

  private exportSummaries(summaries: Summary[]): string[] {
    const lines: string[] = [];
    for (const summary of summaries) {
      lines.push(this.exportSummary(summary));
      lines.push('---');
      lines.push('');
    }
    return lines;
  }

  private heading = (level: number, text: string): string => {
    const actualLevel = Math.min(6, level + (this.options.headingLevel! - 1));
    return '#'.repeat(actualLevel) + ' ' + text;
  };

  private getTypeEmoji(type: string): string {
    const emojis: Record<string, string> = {
      discovery: '🔍',
      decision: '⚖️',
      implementation: '🔧',
      issue: '🐛',
      learning: '📚',
      reference: '🔗',
    };
    return emojis[type] || '📝';
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatDateHeading(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private parseArray(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private getUniqueProjects(observations: Observation[]): string[] {
    return [...new Set(observations.map(o => o.project))];
  }

  private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    }
    return result;
  }
}
