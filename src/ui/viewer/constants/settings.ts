/**
 * Default settings values for Claude Memory
 * Shared across UI components and hooks
 */
export const DEFAULT_SETTINGS = {
  CLAUDE_RECALL_MODEL: 'claude-sonnet-4-5',
  CLAUDE_RECALL_CONTEXT_OBSERVATIONS: '50',
  CLAUDE_RECALL_WORKER_PORT: '37777',
  CLAUDE_RECALL_WORKER_HOST: '127.0.0.1',

  // AI Provider Configuration
  CLAUDE_RECALL_PROVIDER: 'claude',
  CLAUDE_RECALL_GEMINI_API_KEY: '',
  CLAUDE_RECALL_GEMINI_MODEL: 'gemini-2.5-flash-lite',
  CLAUDE_RECALL_OPENROUTER_API_KEY: '',
  CLAUDE_RECALL_OPENROUTER_MODEL: 'xiaomi/mimo-v2-flash:free',
  CLAUDE_RECALL_OPENROUTER_SITE_URL: '',
  CLAUDE_RECALL_OPENROUTER_APP_NAME: 'claude-recall',
  CLAUDE_RECALL_GEMINI_RATE_LIMITING_ENABLED: 'true',

  // Token Economics (all true for backwards compatibility)
  CLAUDE_RECALL_CONTEXT_SHOW_READ_TOKENS: 'true',
  CLAUDE_RECALL_CONTEXT_SHOW_WORK_TOKENS: 'true',
  CLAUDE_RECALL_CONTEXT_SHOW_SAVINGS_AMOUNT: 'true',
  CLAUDE_RECALL_CONTEXT_SHOW_SAVINGS_PERCENT: 'true',

  // Observation Filtering (all types and concepts)
  CLAUDE_RECALL_CONTEXT_OBSERVATION_TYPES: 'bugfix,feature,refactor,discovery,decision,change',
  CLAUDE_RECALL_CONTEXT_OBSERVATION_CONCEPTS: 'how-it-works,why-it-exists,what-changed,problem-solution,gotcha,pattern,trade-off',

  // Display Configuration
  CLAUDE_RECALL_CONTEXT_FULL_COUNT: '5',
  CLAUDE_RECALL_CONTEXT_FULL_FIELD: 'narrative',
  CLAUDE_RECALL_CONTEXT_SESSION_COUNT: '10',

  // Feature Toggles
  CLAUDE_RECALL_CONTEXT_SHOW_LAST_SUMMARY: 'true',
  CLAUDE_RECALL_CONTEXT_SHOW_LAST_MESSAGE: 'false',
} as const;
