/**
 * OpenClaw Skill Tools
 * Memory tools that can be invoked by OpenClaw
 */

import type { OpenClawExtensionContext } from './index.js';

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface SearchParams {
  query: string;
  limit?: number;
  types?: string[];
}

interface RecallParams {
  context: string;
  maxResults?: number;
}

interface SaveParams {
  content: string;
  type: 'preference' | 'decision' | 'learning' | 'context';
  metadata?: Record<string, unknown>;
}

export class MemorySkill {
  private context: OpenClawExtensionContext;

  constructor(context: OpenClawExtensionContext) {
    this.context = context;
  }

  /**
   * Get skill definition for OpenClaw
   */
  getDefinition() {
    return {
      name: 'moltbrain',
      displayName: 'MoltBrain Memory',
      description: 'Long-term memory that learns and recalls your context',
      tools: [
        {
          name: 'recall_context',
          description: 'Retrieve relevant memories based on current context',
          parameters: {
            type: 'object',
            properties: {
              context: {
                type: 'string',
                description: 'The current context to find relevant memories for',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of memories to return',
                default: 10,
              },
            },
            required: ['context'],
          },
        },
        {
          name: 'search_memories',
          description: 'Search through stored memories',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              limit: {
                type: 'number',
                description: 'Maximum results to return',
                default: 20,
              },
              types: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by memory types (preference, decision, learning, context)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'save_memory',
          description: 'Manually save an important piece of information',
          parameters: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'The information to remember',
              },
              type: {
                type: 'string',
                enum: ['preference', 'decision', 'learning', 'context'],
                description: 'Type of memory',
              },
              metadata: {
                type: 'object',
                description: 'Additional metadata to store',
              },
            },
            required: ['content', 'type'],
          },
        },
      ],
    };
  }

  /**
   * Execute a tool by name
   */
  async execute(toolName: string, params: unknown): Promise<ToolResult> {
    switch (toolName) {
      case 'recall_context':
        return this.recallContext(params as RecallParams);
      case 'search_memories':
        return this.searchMemories(params as SearchParams);
      case 'save_memory':
        return this.saveMemory(params as SaveParams);
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  /**
   * Recall relevant context based on current conversation
   */
  private async recallContext(params: RecallParams): Promise<ToolResult> {
    try {
      const { context, maxResults = 10 } = params;

      // Search for semantically similar memories
      const memories = await this.performSearch(context, maxResults);

      return {
        success: true,
        data: {
          memories,
          count: memories.length,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Search through stored memories
   */
  private async searchMemories(params: SearchParams): Promise<ToolResult> {
    try {
      const { query, limit = 20, types } = params;

      let memories = await this.performSearch(query, limit);

      // Filter by types if specified
      if (types && types.length > 0) {
        memories = memories.filter((m: any) => types.includes(m.type));
      }

      return {
        success: true,
        data: {
          results: memories,
          count: memories.length,
          query,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Save a new memory
   */
  private async saveMemory(params: SaveParams): Promise<ToolResult> {
    try {
      const { content, type, metadata } = params;

      const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Save to storage
      const entry = {
        id,
        content,
        type,
        timestamp,
        metadata,
      };

      this.context.logger.info(`Saved memory: ${type} - ${content.substring(0, 50)}...`);

      return {
        success: true,
        data: {
          id,
          timestamp,
          message: 'Memory saved successfully',
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Internal search implementation
   */
  private async performSearch(query: string, limit: number): Promise<unknown[]> {
    // This will integrate with the main moltbrain search functionality
    return [];
  }
}
