/**
 * MoltBot Lifecycle Hooks
 * Integrates claude-recall with MoltBot's agent loop
 */

import type { ClawdExtensionContext, ClawdMessage, ClawdResponse, ClawdSession } from './index.js';

interface MemoryEntry {
  id: string;
  content: string;
  type: string;
  timestamp: string;
  channel: string;
  relevance?: number;
}

export class ClawdHooks {
  private context: ClawdExtensionContext;
  private currentSession: ClawdSession | null = null;
  private sessionMemories: Map<string, MemoryEntry[]> = new Map();

  constructor(context: ClawdExtensionContext) {
    this.context = context;
  }

  /**
   * Called when a new session starts
   */
  async onSessionStart(session: ClawdSession): Promise<void> {
    this.currentSession = session;
    this.context.logger.info(`Session started: ${session.id} on ${session.channel}`);

    // Load relevant memories for this session
    const memories = await this.loadSessionMemories(session);
    this.sessionMemories.set(session.id, memories);
  }

  /**
   * Called when a message is received (before processing)
   */
  async onMessage(message: ClawdMessage): Promise<{ context?: string }> {
    const sessionId = this.currentSession?.id;
    if (!sessionId) return {};

    // Search for relevant memories based on message content
    const relevantMemories = await this.searchMemories(message.content);

    if (relevantMemories.length > 0) {
      const contextBlock = this.formatMemoriesAsContext(relevantMemories);
      this.context.logger.info(`Injecting ${relevantMemories.length} memories into context`);
      return { context: contextBlock };
    }

    return {};
  }

  /**
   * Called after a response is generated
   */
  async onResponse(message: ClawdMessage, response: ClawdResponse): Promise<void> {
    // Extract and save observations from the conversation
    const observations = this.extractObservations(message, response);

    for (const obs of observations) {
      await this.saveMemory(obs);
    }

    if (observations.length > 0) {
      this.context.logger.info(`Saved ${observations.length} observations`);
    }
  }

  /**
   * Called when a session ends
   */
  async onSessionEnd(session: ClawdSession): Promise<void> {
    // Generate session summary if there were significant interactions
    const memories = this.sessionMemories.get(session.id) || [];
    
    if (memories.length > 5) {
      await this.generateSessionSummary(session, memories);
    }

    this.sessionMemories.delete(session.id);
    this.currentSession = null;
    this.context.logger.info(`Session ended: ${session.id}`);
  }

  // Private helper methods
  private async loadSessionMemories(session: ClawdSession): Promise<MemoryEntry[]> {
    // Load memories relevant to this channel/user
    return [];
  }

  private async searchMemories(query: string): Promise<MemoryEntry[]> {
    // Search memories using semantic similarity
    return [];
  }

  private formatMemoriesAsContext(memories: MemoryEntry[]): string {
    if (memories.length === 0) return '';

    const lines = ['<recalled_context>'];
    for (const mem of memories.slice(0, 10)) {
      lines.push(`- [${mem.type}] ${mem.content}`);
    }
    lines.push('</recalled_context>');

    return lines.join('\n');
  }

  private extractObservations(message: ClawdMessage, response: ClawdResponse): MemoryEntry[] {
    const observations: MemoryEntry[] = [];
    const timestamp = new Date().toISOString();

    // Extract preferences (user explicitly states preferences)
    const preferencePatterns = [
      /i prefer\s+(.+)/gi,
      /i like\s+(.+)/gi,
      /i always\s+(.+)/gi,
      /i never\s+(.+)/gi,
    ];

    for (const pattern of preferencePatterns) {
      const matches = message.content.matchAll(pattern);
      for (const match of matches) {
        observations.push({
          id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: match[0],
          type: 'preference',
          timestamp,
          channel: message.channel,
        });
      }
    }

    // Extract decisions from response
    const decisionPatterns = [
      /i'll\s+(.+)/gi,
      /let's\s+(.+)/gi,
      /we should\s+(.+)/gi,
    ];

    for (const pattern of decisionPatterns) {
      const matches = response.content.matchAll(pattern);
      for (const match of matches) {
        if (match[1].length > 20 && match[1].length < 200) {
          observations.push({
            id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: match[0],
            type: 'decision',
            timestamp,
            channel: message.channel,
          });
        }
      }
    }

    return observations;
  }

  private async saveMemory(entry: MemoryEntry): Promise<void> {
    // Save to claude-recall storage
    const sessionId = this.currentSession?.id;
    if (sessionId) {
      const memories = this.sessionMemories.get(sessionId) || [];
      memories.push(entry);
      this.sessionMemories.set(sessionId, memories);
    }
  }

  private async generateSessionSummary(session: ClawdSession, memories: MemoryEntry[]): Promise<void> {
    // Generate a summary of the session for long-term storage
    this.context.logger.info(`Generating summary for session ${session.id} with ${memories.length} memories`);
  }
}
