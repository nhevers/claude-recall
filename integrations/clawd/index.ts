/**
 * Claude Recall Extension for MoltBot
 * Provides long-term memory capabilities across all MoltBot channels
 */

import { ClawdHooks } from './hooks.js';
import { MemorySkill } from './tools.js';

export interface ClawdExtensionContext {
  config: Record<string, unknown>;
  dataDir: string;
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export interface ClawdMessage {
  id: string;
  content: string;
  channel: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ClawdResponse {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ClawdSession {
  id: string;
  channel: string;
  startTime: string;
  userId?: string;
}

// Extension entry point
export function activate(context: ClawdExtensionContext) {
  const hooks = new ClawdHooks(context);
  const skill = new MemorySkill(context);

  context.logger.info('Claude Recall extension activated');

  return {
    hooks,
    skill,
    deactivate: () => {
      context.logger.info('Claude Recall extension deactivated');
    },
  };
}

export { ClawdHooks } from './hooks.js';
export { MemorySkill } from './tools.js';
