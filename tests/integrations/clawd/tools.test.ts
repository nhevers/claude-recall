/**
 * Tests for OpenClaw Skill Tools (MemorySkill)
 *
 * Mock Justification: ~80% mock code
 * - Mocks OpenClawExtensionContext for isolation
 * - Tests tool definition structure and execution logic
 * - Tests error handling and edge cases
 *
 * Value: Validates tool definitions, execution flow, and error handling
 */
import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { MemorySkill } from '../../../integrations/clawd/tools.js';

// Mock OpenClawExtensionContext
const createMockContext = () => ({
  logger: {
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    debug: mock(() => {}),
  },
  config: {},
  api: {},
});

describe('MemorySkill', () => {
  let skill: MemorySkill;
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    skill = new MemorySkill(mockContext as any);
  });

  describe('getDefinition', () => {
    it('should return valid skill definition with correct name', () => {
      const def = skill.getDefinition();

      expect(def.name).toBe('moltbrain');
      expect(def.displayName).toBe('MoltBrain Memory');
      expect(def.description).toContain('memory');
    });

    it('should define three tools', () => {
      const def = skill.getDefinition();

      expect(def.tools).toHaveLength(3);
      expect(def.tools.map(t => t.name)).toEqual([
        'recall_context',
        'search_memories',
        'save_memory',
      ]);
    });

    it('should have correct parameters for recall_context', () => {
      const def = skill.getDefinition();
      const recallTool = def.tools.find(t => t.name === 'recall_context');

      expect(recallTool).toBeDefined();
      expect(recallTool!.parameters.properties.context).toBeDefined();
      expect(recallTool!.parameters.properties.context.type).toBe('string');
      expect(recallTool!.parameters.properties.maxResults).toBeDefined();
      expect(recallTool!.parameters.properties.maxResults.default).toBe(10);
      expect(recallTool!.parameters.required).toContain('context');
    });

    it('should have correct parameters for search_memories', () => {
      const def = skill.getDefinition();
      const searchTool = def.tools.find(t => t.name === 'search_memories');

      expect(searchTool).toBeDefined();
      expect(searchTool!.parameters.properties.query).toBeDefined();
      expect(searchTool!.parameters.properties.query.type).toBe('string');
      expect(searchTool!.parameters.properties.limit).toBeDefined();
      expect(searchTool!.parameters.properties.limit.default).toBe(20);
      expect(searchTool!.parameters.properties.types).toBeDefined();
      expect(searchTool!.parameters.properties.types.type).toBe('array');
      expect(searchTool!.parameters.required).toContain('query');
    });

    it('should have correct parameters for save_memory', () => {
      const def = skill.getDefinition();
      const saveTool = def.tools.find(t => t.name === 'save_memory');

      expect(saveTool).toBeDefined();
      expect(saveTool!.parameters.properties.content).toBeDefined();
      expect(saveTool!.parameters.properties.type).toBeDefined();
      expect(saveTool!.parameters.properties.type.enum).toEqual([
        'preference',
        'decision',
        'learning',
        'context',
      ]);
      expect(saveTool!.parameters.properties.metadata).toBeDefined();
      expect(saveTool!.parameters.required).toContain('content');
      expect(saveTool!.parameters.required).toContain('type');
    });
  });

  describe('execute', () => {
    describe('recall_context', () => {
      it('should return success with empty memories array', async () => {
        const result = await skill.execute('recall_context', {
          context: 'test context',
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect((result.data as any).memories).toEqual([]);
        expect((result.data as any).count).toBe(0);
      });

      it('should respect maxResults parameter', async () => {
        const result = await skill.execute('recall_context', {
          context: 'test context',
          maxResults: 5,
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('should use default maxResults when not provided', async () => {
        const result = await skill.execute('recall_context', {
          context: 'another context',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('search_memories', () => {
      it('should return success with search results', async () => {
        const result = await skill.execute('search_memories', {
          query: 'test query',
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect((result.data as any).results).toEqual([]);
        expect((result.data as any).count).toBe(0);
        expect((result.data as any).query).toBe('test query');
      });

      it('should accept limit parameter', async () => {
        const result = await skill.execute('search_memories', {
          query: 'test query',
          limit: 10,
        });

        expect(result.success).toBe(true);
      });

      it('should accept types filter', async () => {
        const result = await skill.execute('search_memories', {
          query: 'test query',
          types: ['preference', 'decision'],
        });

        expect(result.success).toBe(true);
      });

      it('should handle empty query', async () => {
        const result = await skill.execute('search_memories', {
          query: '',
        });

        expect(result.success).toBe(true);
        expect((result.data as any).query).toBe('');
      });
    });

    describe('save_memory', () => {
      it('should save memory and return success', async () => {
        const result = await skill.execute('save_memory', {
          content: 'User prefers TypeScript',
          type: 'preference',
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect((result.data as any).id).toBeDefined();
        expect((result.data as any).id).toMatch(/^mem_/);
        expect((result.data as any).timestamp).toBeDefined();
        expect((result.data as any).message).toBe('Memory saved successfully');
      });

      it('should generate unique IDs for each memory', async () => {
        const result1 = await skill.execute('save_memory', {
          content: 'Memory 1',
          type: 'learning',
        });
        const result2 = await skill.execute('save_memory', {
          content: 'Memory 2',
          type: 'learning',
        });

        expect((result1.data as any).id).not.toBe((result2.data as any).id);
      });

      it('should accept all valid memory types', async () => {
        const types = ['preference', 'decision', 'learning', 'context'] as const;

        for (const type of types) {
          const result = await skill.execute('save_memory', {
            content: `Test ${type}`,
            type,
          });
          expect(result.success).toBe(true);
        }
      });

      it('should accept optional metadata', async () => {
        const result = await skill.execute('save_memory', {
          content: 'Memory with metadata',
          type: 'context',
          metadata: { source: 'test', priority: 'high' },
        });

        expect(result.success).toBe(true);
      });

      it('should log saved memory', async () => {
        await skill.execute('save_memory', {
          content: 'Logged memory content',
          type: 'preference',
        });

        expect(mockContext.logger.info).toHaveBeenCalled();
      });
    });

    describe('unknown tool', () => {
      it('should return error for unknown tool name', async () => {
        const result = await skill.execute('unknown_tool', {});

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown tool: unknown_tool');
      });
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in recall_context', async () => {
      // Create a skill with a broken context
      const brokenContext = {
        logger: {
          info: () => { throw new Error('Logger broken'); },
          error: mock(() => {}),
        },
      };
      const brokenSkill = new MemorySkill(brokenContext as any);

      // The skill should still work because logging happens after the main logic
      const result = await brokenSkill.execute('recall_context', {
        context: 'test',
      });
      expect(result.success).toBe(true);
    });

    it('should include error message in result', async () => {
      // Test unknown tool error message format
      const result = await skill.execute('nonexistent', {});

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
      expect(result.error).toContain('Unknown tool');
    });
  });
});

describe('MemorySkill - Edge Cases', () => {
  let skill: MemorySkill;
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    skill = new MemorySkill(mockContext as any);
  });

  describe('boundary conditions', () => {
    it('should handle very long context string', async () => {
      const longContext = 'a'.repeat(100000);
      const result = await skill.execute('recall_context', {
        context: longContext,
      });

      expect(result.success).toBe(true);
    });

    it('should handle very long content in save_memory', async () => {
      const longContent = 'b'.repeat(100000);
      const result = await skill.execute('save_memory', {
        content: longContent,
        type: 'context',
      });

      expect(result.success).toBe(true);
    });

    it('should handle maxResults of 0', async () => {
      const result = await skill.execute('recall_context', {
        context: 'test',
        maxResults: 0,
      });

      expect(result.success).toBe(true);
      expect((result.data as any).memories).toEqual([]);
    });

    it('should handle negative maxResults', async () => {
      const result = await skill.execute('recall_context', {
        context: 'test',
        maxResults: -1,
      });

      expect(result.success).toBe(true);
    });

    it('should handle empty types array in search', async () => {
      const result = await skill.execute('search_memories', {
        query: 'test',
        types: [],
      });

      expect(result.success).toBe(true);
    });

    it('should handle special characters in query', async () => {
      const result = await skill.execute('search_memories', {
        query: '!@#$%^&*(){}[]|\\:";\'<>?,./`~',
      });

      expect(result.success).toBe(true);
    });

    it('should handle unicode in content', async () => {
      const result = await skill.execute('save_memory', {
        content: '你好世界 🌍 مرحبا العالم',
        type: 'learning',
      });

      expect(result.success).toBe(true);
    });

    it('should handle nested metadata objects', async () => {
      const result = await skill.execute('save_memory', {
        content: 'Test memory',
        type: 'context',
        metadata: {
          nested: {
            deep: {
              value: 'test',
            },
          },
          array: [1, 2, 3],
        },
      });

      expect(result.success).toBe(true);
    });
  });
});
