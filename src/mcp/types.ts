/**
 * MCP (Model Context Protocol) Types
 * Defines the protocol types for memory operations
 */

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

// Memory operation types
export interface MemorySearchParams {
  query: string;
  limit?: number;
  projectPath?: string;
  types?: string[];
}

export interface MemorySearchResult {
  id: string;
  content: string;
  type: string;
  timestamp: string;
  relevance: number;
  projectPath?: string;
}

export interface MemoryRecallParams {
  context: string;
  projectPath?: string;
  maxTokens?: number;
}

export interface MemoryRecallResult {
  memories: MemorySearchResult[];
  summary?: string;
  tokenCount: number;
}

export interface MemorySaveParams {
  content: string;
  type: 'preference' | 'decision' | 'learning' | 'context' | 'custom';
  projectPath?: string;
  metadata?: Record<string, unknown>;
}

export interface MemorySaveResult {
  id: string;
  success: boolean;
  timestamp: string;
}

export interface MemoryTimelineParams {
  projectPath?: string;
  limit?: number;
  since?: string;
}

export interface MemoryTimelineResult {
  entries: MemorySearchResult[];
  totalCount: number;
  hasMore: boolean;
}

// Server capability types
export interface ServerCapabilities {
  memory: {
    search: boolean;
    recall: boolean;
    save: boolean;
    timeline: boolean;
  };
  version: string;
}

export interface InitializeParams {
  clientInfo?: {
    name: string;
    version: string;
  };
}

export interface InitializeResult {
  serverInfo: {
    name: string;
    version: string;
  };
  capabilities: ServerCapabilities;
}

// Error codes
export const MCPErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  NOT_INITIALIZED: -32002,
  MEMORY_NOT_FOUND: -32001,
} as const;

export type MCPErrorCode = typeof MCPErrorCodes[keyof typeof MCPErrorCodes];
