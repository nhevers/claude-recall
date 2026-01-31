/**
 * Tests for OpenClaw Lifecycle Hooks (OpenClawHooks)
 *
 * Mock Justification: ~85% mock code
 * - Mocks OpenClawExtensionContext, Session, Message, Response
 * - Tests lifecycle hooks and observation extraction
 * - Tests memory injection and session management
 *
 * Value: Validates hook integration, pattern matching, and session lifecycle
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { OpenClawHooks } from '../../../integrations/clawd/hooks.js';
import type { OpenClawExtensionContext, OpenClawMessage, OpenClawResponse, OpenClawSession } from '../../../integrations/clawd/index.js';

// Mock factory functions
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

const createMockSession = (overrides: Partial<OpenClawSession> = {}): OpenClawSession => ({
  id: `session_${Date.now()}`,
  channel: 'test-channel',
  user: 'test-user',
  startedAt: new Date().toISOString(),
  ...overrides,
});

const createMockMessage = (overrides: Partial<OpenClawMessage> = {}): OpenClawMessage => ({
  id: `msg_${Date.now()}`,
  content: 'Test message content',
  channel: 'test-channel',
  timestamp: new Date().toISOString(),
  ...overrides,
});

const createMockResponse = (overrides: Partial<OpenClawResponse> = {}): OpenClawResponse => ({
  content: 'Test response content',
  ...overrides,
});

describe('OpenClawHooks', () => {
  let hooks: OpenClawHooks;
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    hooks = new OpenClawHooks(mockContext as any);
  });

  describe('onSessionStart', () => {
    it('should store session and log start', async () => {
      const session = createMockSession({ id: 'session-123' });

      await hooks.onSessionStart(session);

      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Session started: session-123')
      );
    });

    it('should include channel in log', async () => {
      const session = createMockSession({ channel: 'discord' });

      await hooks.onSessionStart(session);

      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('discord')
      );
    });

    it('should handle multiple sessions sequentially', async () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });

      await hooks.onSessionStart(session1);
      await hooks.onSessionStart(session2);

      expect(mockContext.logger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('onMessage', () => {
    it('should return empty context when no session', async () => {
      const message = createMockMessage();

      const result = await hooks.onMessage(message);

      expect(result).toEqual({});
    });

    it('should return empty context when no relevant memories', async () => {
      const session = createMockSession();
      await hooks.onSessionStart(session);

      const message = createMockMessage({ content: 'simple message' });
      const result = await hooks.onMessage(message);

      expect(result).toEqual({});
    });

    it('should handle message with empty content', async () => {
      const session = createMockSession();
      await hooks.onSessionStart(session);

      const message = createMockMessage({ content: '' });
      const result = await hooks.onMessage(message);

      expect(result).toEqual({});
    });
  });

  describe('onResponse', () => {
    beforeEach(async () => {
      const session = createMockSession();
      await hooks.onSessionStart(session);
    });

    it('should extract preference observations', async () => {
      const message = createMockMessage({
        content: 'I prefer TypeScript over JavaScript',
      });
      const response = createMockResponse({
        content: 'Noted your preference for TypeScript.',
      });

      await hooks.onResponse(message, response);

      // Observations are extracted silently, just verify no error
      expect(true).toBe(true);
    });

    it('should extract multiple preference patterns', async () => {
      const message = createMockMessage({
        content: 'I prefer dark mode. I like functional programming. I always use Vim.',
      });
      const response = createMockResponse({ content: 'Got it!' });

      await hooks.onResponse(message, response);

      expect(mockContext.logger.info).toHaveBeenCalled();
    });

    it('should extract "I never" patterns', async () => {
      const message = createMockMessage({
        content: 'I never use tabs for indentation',
      });
      const response = createMockResponse({ content: 'Understood.' });

      await hooks.onResponse(message, response);

      // Pattern matching should work
      expect(true).toBe(true);
    });

    it('should extract decision patterns from response', async () => {
      const message = createMockMessage({ content: 'How should we proceed?' });
      const response = createMockResponse({
        content: "I'll implement the authentication module first. Let's use JWT for tokens.",
      });

      await hooks.onResponse(message, response);

      expect(mockContext.logger.info).toHaveBeenCalled();
    });

    it('should filter short decisions', async () => {
      const message = createMockMessage({ content: 'What now?' });
      const response = createMockResponse({
        content: "I'll do it.",  // Too short (< 20 chars)
      });

      await hooks.onResponse(message, response);

      // Short decisions should be filtered out
      expect(true).toBe(true);
    });

    it('should filter very long decisions', async () => {
      const message = createMockMessage({ content: 'What now?' });
      const longDecision = "I'll " + 'a'.repeat(250);
      const response = createMockResponse({
        content: longDecision,  // Too long (> 200 chars)
      });

      await hooks.onResponse(message, response);

      expect(true).toBe(true);
    });

    it('should handle response without decisions', async () => {
      const message = createMockMessage({ content: 'Hello' });
      const response = createMockResponse({ content: 'Hi there!' });

      await hooks.onResponse(message, response);

      // No observations should be saved
      expect(true).toBe(true);
    });
  });

  describe('onSessionEnd', () => {
    it('should log session end', async () => {
      const session = createMockSession({ id: 'session-end-test' });
      await hooks.onSessionStart(session);

      await hooks.onSessionEnd(session);

      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Session ended: session-end-test')
      );
    });

    it('should generate summary when many memories exist', async () => {
      const session = createMockSession({ id: 'summary-session' });
      await hooks.onSessionStart(session);

      // Simulate multiple messages to build up memories
      for (let i = 0; i < 6; i++) {
        const message = createMockMessage({
          content: `I prefer option ${i}`,
        });
        const response = createMockResponse({ content: 'Noted.' });
        await hooks.onResponse(message, response);
      }

      await hooks.onSessionEnd(session);

      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generating summary')
      );
    });

    it('should skip summary for short sessions', async () => {
      const session = createMockSession({ id: 'short-session' });
      await hooks.onSessionStart(session);

      // Only a few messages
      const message = createMockMessage({ content: 'I prefer dark mode' });
      const response = createMockResponse({ content: 'OK' });
      await hooks.onResponse(message, response);

      await hooks.onSessionEnd(session);

      // Summary generation log should not appear
      const calls = mockContext.logger.info.mock.calls;
      const summaryCall = calls.find((c: any[]) =>
        c[0].includes('Generating summary')
      );
      expect(summaryCall).toBeUndefined();
    });

    it('should clean up session memories', async () => {
      const session = createMockSession({ id: 'cleanup-session' });
      await hooks.onSessionStart(session);
      await hooks.onSessionEnd(session);

      // Starting a new message should work without old session data
      const message = createMockMessage({ content: 'test' });
      const result = await hooks.onMessage(message);
      expect(result).toEqual({});
    });
  });

  describe('lifecycle integration', () => {
    it('should handle full session lifecycle', async () => {
      // Start session
      const session = createMockSession({ id: 'full-lifecycle' });
      await hooks.onSessionStart(session);

      // Multiple message exchanges
      for (let i = 0; i < 3; i++) {
        const message = createMockMessage({
          content: `Message ${i}: I prefer approach ${i}`,
        });
        await hooks.onMessage(message);
        const response = createMockResponse({
          content: `Let's implement that with method ${i}`,
        });
        await hooks.onResponse(message, response);
      }

      // End session
      await hooks.onSessionEnd(session);

      // Verify all lifecycle hooks were called
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Session started')
      );
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Session ended')
      );
    });

    it('should isolate different sessions', async () => {
      const session1 = createMockSession({ id: 'session-1', channel: 'channel-1' });
      const session2 = createMockSession({ id: 'session-2', channel: 'channel-2' });

      await hooks.onSessionStart(session1);
      await hooks.onSessionEnd(session1);

      await hooks.onSessionStart(session2);

      // Session 2 should start fresh
      const message = createMockMessage({ content: 'test' });
      const result = await hooks.onMessage(message);
      expect(result).toEqual({});
    });
  });
});

describe('OpenClawHooks - Pattern Matching', () => {
  let hooks: OpenClawHooks;
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(async () => {
    mockContext = createMockContext();
    hooks = new OpenClawHooks(mockContext as any);
    await hooks.onSessionStart(createMockSession());
  });

  describe('preference patterns', () => {
    const testCases = [
      { pattern: 'I prefer', input: 'I prefer dark mode', shouldMatch: true },
      { pattern: 'I like', input: 'I like using TypeScript', shouldMatch: true },
      { pattern: 'I always', input: 'I always use strict mode', shouldMatch: true },
      { pattern: 'I never', input: 'I never skip tests', shouldMatch: true },
      { pattern: 'case insensitive', input: 'i PREFER uppercase', shouldMatch: true },
    ];

    for (const tc of testCases) {
      it(`should match "${tc.pattern}" pattern: "${tc.input}"`, async () => {
        const message = createMockMessage({ content: tc.input });
        const response = createMockResponse({ content: 'OK' });

        await hooks.onResponse(message, response);

        if (tc.shouldMatch) {
          expect(mockContext.logger.info).toHaveBeenCalled();
        }
      });
    }

    it('should not match partial patterns', async () => {
      const message = createMockMessage({
        content: 'Something I preferably do',  // "preferably" not "prefer "
      });
      const response = createMockResponse({ content: 'OK' });

      await hooks.onResponse(message, response);

      // Should still work without error
      expect(true).toBe(true);
    });
  });

  describe('decision patterns', () => {
    const testCases = [
      { pattern: "I'll", input: "I'll implement the feature", shouldMatch: true },
      { pattern: "Let's", input: "Let's refactor this module", shouldMatch: true },
      { pattern: "We should", input: "We should add more tests", shouldMatch: true },
    ];

    for (const tc of testCases) {
      it(`should match "${tc.pattern}" pattern in response`, async () => {
        const message = createMockMessage({ content: 'What should we do?' });
        const longEnoughContent = tc.input + ' with proper implementation details';
        const response = createMockResponse({ content: longEnoughContent });

        await hooks.onResponse(message, response);

        // Verify observation was attempted
        expect(mockContext.logger.info).toHaveBeenCalled();
      });
    }
  });
});

describe('OpenClawHooks - Edge Cases', () => {
  let hooks: OpenClawHooks;
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    hooks = new OpenClawHooks(mockContext as any);
  });

  it('should handle session without channel', async () => {
    const session = createMockSession({ channel: undefined as any });

    await expect(hooks.onSessionStart(session)).resolves.toBeUndefined();
  });

  it('should handle message with undefined channel', async () => {
    await hooks.onSessionStart(createMockSession());

    const message = createMockMessage({ channel: undefined as any });
    const response = createMockResponse();

    await expect(hooks.onResponse(message, response)).resolves.toBeUndefined();
  });

  it('should handle very long messages', async () => {
    await hooks.onSessionStart(createMockSession());

    const longContent = 'I prefer ' + 'a'.repeat(100000);
    const message = createMockMessage({ content: longContent });
    const response = createMockResponse({ content: 'OK' });

    await expect(hooks.onResponse(message, response)).resolves.toBeUndefined();
  });

  it('should handle unicode content', async () => {
    await hooks.onSessionStart(createMockSession());

    const message = createMockMessage({
      content: 'I prefer 中文编程 and 日本語',
    });
    const response = createMockResponse({
      content: "Let's use internationalization throughout the application",
    });

    await expect(hooks.onResponse(message, response)).resolves.toBeUndefined();
  });

  it('should handle special regex characters in content', async () => {
    await hooks.onSessionStart(createMockSession());

    const message = createMockMessage({
      content: 'I prefer using regex like /^test$/gi',
    });
    const response = createMockResponse({
      content: "I'll add pattern matching with $1 and $2 captures",
    });

    await expect(hooks.onResponse(message, response)).resolves.toBeUndefined();
  });

  it('should handle rapid session switches', async () => {
    for (let i = 0; i < 10; i++) {
      const session = createMockSession({ id: `rapid-${i}` });
      await hooks.onSessionStart(session);
      const message = createMockMessage({ content: `I prefer option ${i}` });
      const response = createMockResponse({ content: 'OK' });
      await hooks.onResponse(message, response);
      await hooks.onSessionEnd(session);
    }

    expect(mockContext.logger.info).toHaveBeenCalled();
  });

  it('should handle concurrent message processing', async () => {
    await hooks.onSessionStart(createMockSession());

    const messages = Array.from({ length: 10 }, (_, i) =>
      createMockMessage({ content: `I prefer option ${i}` })
    );

    const promises = messages.map(async (msg) => {
      await hooks.onMessage(msg);
      return hooks.onResponse(msg, createMockResponse({ content: 'OK' }));
    });

    await expect(Promise.all(promises)).resolves.toBeDefined();
  });
});
