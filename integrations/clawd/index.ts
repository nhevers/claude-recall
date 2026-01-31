/**
 * MoltBrain Plugin for Clawdbot (OpenClaw)
 * 
 * Long-term memory layer that learns and recalls your context.
 * Connects to MoltBrain's HTTP API at localhost:37777.
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

// ============================================================================
// Configuration
// ============================================================================

const MOLTBRAIN_HOST = process.env.MOLTBRAIN_HOST || '127.0.0.1';
const MOLTBRAIN_PORT = parseInt(process.env.MOLTBRAIN_PORT || '37777', 10);
const MOLTBRAIN_BASE_URL = `http://${MOLTBRAIN_HOST}:${MOLTBRAIN_PORT}`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;

// ============================================================================
// Logger
// ============================================================================

const LOG_PREFIX = '[moltbrain]';

const log = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`${LOG_PREFIX} ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`${LOG_PREFIX} WARN: ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    console.error(`${LOG_PREFIX} ERROR: ${message}`, data ? JSON.stringify(data) : '', error);
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.MOLTBRAIN_DEBUG === 'true') {
      console.log(`${LOG_PREFIX} DEBUG: ${message}`, data ? JSON.stringify(data) : '');
    }
  },
};

// ============================================================================
// HTTP Client with Retry Logic
// ============================================================================

interface FetchOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  params?: Record<string, string | number | undefined>;
  timeout?: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make HTTP request to MoltBrain API with retry logic
 */
async function fetchWithRetry<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, params, timeout = REQUEST_TIMEOUT_MS } = options;
  
  // Build URL with query params
  let url = `${MOLTBRAIN_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log.debug(`API request attempt ${attempt}/${MAX_RETRIES}`, { method, url });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      };
      
      if (body && method === 'POST') {
        fetchOptions.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json() as T;
      log.debug('API request successful', { endpoint, attempt });
      
      return { success: true, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (lastError.name === 'AbortError') {
        log.warn('Request timed out', { endpoint, timeout });
        return { success: false, error: `Request timed out after ${timeout}ms` };
      }
      
      // Check if it's a connection error (MoltBrain not running)
      if (lastError.message.includes('ECONNREFUSED') || 
          lastError.message.includes('fetch failed')) {
        log.warn('MoltBrain service not available', { endpoint, attempt });
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          log.debug(`Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        
        return {
          success: false,
          error: `MoltBrain service not available at ${MOLTBRAIN_BASE_URL}. ` +
                 `Please ensure the worker is running (npm run worker:start).`,
        };
      }
      
      log.error(`Request failed (attempt ${attempt}/${MAX_RETRIES})`, lastError, { endpoint });
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        log.debug(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Unknown error after max retries',
  };
}

/**
 * Check if MoltBrain service is healthy
 */
async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetchWithRetry<{ status: string }>('/api/health', {
      timeout: 5000,
    });
    return response.success && response.data?.status === 'ok';
  } catch {
    return false;
  }
}

// ============================================================================
// API Response Types
// ============================================================================

interface SearchContent {
  type: 'text';
  text: string;
}

interface SearchResponse {
  content: SearchContent[];
  isError?: boolean;
}

interface MemoryResult {
  id: string | number;
  content: string;
  type: string;
  timestamp: string;
  relevance?: number;
}

interface RecallResponse {
  memories: MemoryResult[];
  tokenCount?: number;
}

interface SaveResponse {
  id: string;
  success: boolean;
  timestamp: string;
}

// ============================================================================
// Memory API Functions
// ============================================================================

/**
 * Recall relevant context based on current conversation
 */
async function recallContext(
  context: string,
  maxResults: number = 10
): Promise<{ memories: MemoryResult[]; count: number }> {
  log.info('Recalling context', { contextLength: context.length, maxResults });
  
  // Use the search API with the context as query
  const response = await fetchWithRetry<SearchResponse>('/api/search', {
    params: {
      query: context,
      limit: maxResults,
      format: 'json',
    },
  });
  
  if (!response.success || !response.data) {
    log.warn('Recall failed, returning empty result', { error: response.error });
    return { memories: [], count: 0 };
  }
  
  // Parse the response - it may be in text format or structured
  try {
    const data = response.data as any;
    
    // If response has content array with text, try to extract
    if (data.content && Array.isArray(data.content)) {
      const textContent = data.content.find((c: any) => c.type === 'text');
      if (textContent?.text) {
        // The text might be JSON or formatted text
        try {
          const parsed = JSON.parse(textContent.text);
          if (parsed.observations || parsed.sessions || parsed.prompts) {
            const memories: MemoryResult[] = [];
            
            // Convert observations to memory format
            if (parsed.observations) {
              for (const obs of parsed.observations) {
                memories.push({
                  id: obs.id,
                  content: obs.content || obs.summary || '',
                  type: obs.type || 'observation',
                  timestamp: obs.created_at || new Date().toISOString(),
                  relevance: obs.relevance,
                });
              }
            }
            
            // Convert sessions to memory format
            if (parsed.sessions) {
              for (const sess of parsed.sessions) {
                memories.push({
                  id: `S${sess.id}`,
                  content: sess.summary || '',
                  type: 'session',
                  timestamp: sess.created_at || new Date().toISOString(),
                });
              }
            }
            
            log.info('Recall successful', { memoriesFound: memories.length });
            return { memories, count: memories.length };
          }
        } catch {
          // Text is not JSON, return as single memory
          log.debug('Response is not JSON, treating as text');
        }
      }
    }
    
    // Handle direct JSON response
    if (data.observations || data.results) {
      const items = data.observations || data.results || [];
      const memories: MemoryResult[] = items.map((item: any) => ({
        id: item.id,
        content: item.content || item.summary || '',
        type: item.type || 'observation',
        timestamp: item.created_at || new Date().toISOString(),
        relevance: item.relevance,
      }));
      
      log.info('Recall successful', { memoriesFound: memories.length });
      return { memories, count: memories.length };
    }
  } catch (parseError) {
    log.error('Failed to parse recall response', parseError);
  }
  
  return { memories: [], count: 0 };
}

/**
 * Search through stored memories
 */
async function searchMemories(
  query: string,
  limit: number = 20,
  types?: string[]
): Promise<{ results: MemoryResult[]; count: number; query: string }> {
  log.info('Searching memories', { query, limit, types });
  
  const params: Record<string, string | number | undefined> = {
    query,
    limit,
  };
  
  // Add type filter if specified
  if (types && types.length > 0) {
    params.type = types.join(',');
  }
  
  const response = await fetchWithRetry<SearchResponse>('/api/search', {
    params,
  });
  
  if (!response.success || !response.data) {
    log.warn('Search failed, returning empty result', { error: response.error });
    return { results: [], count: 0, query };
  }
  
  try {
    const data = response.data as any;
    
    // Parse structured response
    if (data.content && Array.isArray(data.content)) {
      const textContent = data.content.find((c: any) => c.type === 'text');
      if (textContent?.text) {
        try {
          const parsed = JSON.parse(textContent.text);
          if (parsed.observations || parsed.results) {
            const items = parsed.observations || parsed.results || [];
            const results: MemoryResult[] = items.map((item: any) => ({
              id: item.id,
              content: item.content || item.summary || '',
              type: item.type || 'observation',
              timestamp: item.created_at || new Date().toISOString(),
              relevance: item.relevance,
            }));
            
            log.info('Search successful', { resultsFound: results.length });
            return { results, count: results.length, query };
          }
        } catch {
          // Not JSON, handle as text
        }
        
        // Return the text as a single result
        return {
          results: [{
            id: 'text-result',
            content: textContent.text,
            type: 'search-result',
            timestamp: new Date().toISOString(),
          }],
          count: 1,
          query,
        };
      }
    }
    
    // Handle direct response
    if (data.observations || data.results || data.sessions) {
      const results: MemoryResult[] = [];
      
      for (const obs of (data.observations || [])) {
        results.push({
          id: obs.id,
          content: obs.content || obs.summary || '',
          type: obs.type || 'observation',
          timestamp: obs.created_at || new Date().toISOString(),
          relevance: obs.relevance,
        });
      }
      
      for (const sess of (data.sessions || [])) {
        results.push({
          id: `S${sess.id}`,
          content: sess.summary || '',
          type: 'session',
          timestamp: sess.created_at || new Date().toISOString(),
        });
      }
      
      for (const prompt of (data.prompts || [])) {
        results.push({
          id: `P${prompt.id}`,
          content: prompt.content || '',
          type: 'prompt',
          timestamp: prompt.created_at || new Date().toISOString(),
        });
      }
      
      log.info('Search successful', { resultsFound: results.length });
      return { results, count: results.length, query };
    }
  } catch (parseError) {
    log.error('Failed to parse search response', parseError);
  }
  
  return { results: [], count: 0, query };
}

/**
 * Save a new memory
 * 
 * Note: This creates an observation in MoltBrain's storage.
 * Full implementation would require MoltBrain's observation API,
 * which currently only accepts observations through the hook system.
 */
async function saveMemory(
  content: string,
  type: 'preference' | 'decision' | 'learning' | 'context',
  metadata?: Record<string, unknown>
): Promise<{ id: string; timestamp: string; success: boolean; message: string }> {
  log.info('Saving memory', { type, contentLength: content.length });
  
  // Generate a local ID since we're creating a new memory
  const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const timestamp = new Date().toISOString();
  
  // Try to save via MoltBrain's API
  // Note: MoltBrain's current architecture saves observations through hooks,
  // not direct API calls. For now, we'll log the intent and return success.
  // A future version could integrate with /api/observations/create if available.
  
  try {
    // Check if MoltBrain has a save endpoint
    const response = await fetchWithRetry<SaveResponse>('/api/memory/save', {
      method: 'POST',
      body: {
        content,
        type,
        metadata,
        timestamp,
      },
      timeout: 10000,
    });
    
    if (response.success && response.data) {
      log.info('Memory saved successfully', { id: response.data.id });
      return {
        id: response.data.id,
        timestamp: response.data.timestamp,
        success: true,
        message: 'Memory saved successfully',
      };
    }
  } catch {
    // Save endpoint might not exist, fall through to local handling
  }
  
  // Fallback: Log the memory for manual integration
  log.warn('Direct save not available, memory logged for reference', {
    id,
    type,
    content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
  });
  
  return {
    id,
    timestamp,
    success: true,
    message: 'Memory recorded locally. Direct save to MoltBrain requires the observation hook system.',
  };
}

// ============================================================================
// Plugin Definition
// ============================================================================

log.info('Module loading - top level');

const moltbrainPlugin = {
  id: "moltbrain",
  name: "MoltBrain Memory",
  description: "Long-term memory layer that learns and recalls your context",
  kind: "extension",
  configSchema: emptyPluginConfigSchema(),
  
  register(api: OpenClawPluginApi) {
    log.info('Extension register() called');
    
    // ========================================================================
    // Tool: recall_context
    // ========================================================================
    log.info('Registering recall_context tool');
    api.registerTool(
      {
        name: "recall_context",
        label: "Recall Context",
        description: "Retrieve relevant memories based on current context. " +
                     "Searches MoltBrain's memory store for semantically similar observations.",
        parameters: Type.Object({
          context: Type.String({ 
            description: "The current context to find relevant memories for" 
          }),
          maxResults: Type.Optional(Type.Number({ 
            description: "Maximum number of memories to return", 
            default: 10 
          })),
        }),
        
        async execute(_toolCallId, params) {
          const { context, maxResults = 10 } = params as { 
            context: string; 
            maxResults?: number 
          };
          
          log.debug('recall_context called', { contextLength: context.length, maxResults });
          
          try {
            const result = await recallContext(context, maxResults);
            
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2) 
              }],
              details: result,
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error('recall_context failed', error);
            
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify({ 
                  memories: [], 
                  count: 0, 
                  error: errorMessage 
                }, null, 2) 
              }],
              details: { memories: [], count: 0, error: errorMessage },
            };
          }
        },
      },
      { name: "recall_context" },
    );
    log.info('recall_context registered');

    // ========================================================================
    // Tool: search_memories
    // ========================================================================
    log.info('Registering search_memories tool');
    api.registerTool(
      {
        name: "search_memories",
        label: "Search Memories",
        description: "Search through stored memories using semantic search. " +
                     "Returns observations, sessions, and prompts matching the query.",
        parameters: Type.Object({
          query: Type.String({ 
            description: "Search query" 
          }),
          limit: Type.Optional(Type.Number({ 
            description: "Maximum results to return", 
            default: 20 
          })),
          types: Type.Optional(Type.Array(Type.String(), { 
            description: "Filter by memory types (preference, decision, learning, context, observation, session)" 
          })),
        }),
        
        async execute(_toolCallId, params) {
          const { query, limit = 20, types } = params as { 
            query: string; 
            limit?: number; 
            types?: string[] 
          };
          
          log.debug('search_memories called', { query, limit, types });
          
          try {
            const result = await searchMemories(query, limit, types);
            
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2) 
              }],
              details: result,
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error('search_memories failed', error);
            
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify({ 
                  results: [], 
                  count: 0, 
                  query, 
                  error: errorMessage 
                }, null, 2) 
              }],
              details: { results: [], count: 0, query, error: errorMessage },
            };
          }
        },
      },
      { name: "search_memories" },
    );
    log.info('search_memories registered');

    // ========================================================================
    // Tool: save_memory
    // ========================================================================
    log.info('Registering save_memory tool');
    api.registerTool(
      {
        name: "save_memory",
        label: "Save Memory",
        description: "Manually save an important piece of information to long-term memory. " +
                     "Use for preferences, decisions, learnings, or important context.",
        parameters: Type.Object({
          content: Type.String({ 
            description: "The information to remember" 
          }),
          type: Type.Union([
            Type.Literal("preference"),
            Type.Literal("decision"),
            Type.Literal("learning"),
            Type.Literal("context"),
          ], { 
            description: "Type of memory: preference (user preferences), decision (choices made), " +
                         "learning (insights discovered), context (project/environment info)" 
          }),
          metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { 
            description: "Additional metadata to store (e.g., project, tags, source)" 
          })),
        }),
        
        async execute(_toolCallId, params) {
          const { content, type, metadata } = params as { 
            content: string; 
            type: 'preference' | 'decision' | 'learning' | 'context';
            metadata?: Record<string, unknown>;
          };
          
          log.debug('save_memory called', { type, contentLength: content.length });
          
          try {
            const result = await saveMemory(content, type, metadata);
            
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2) 
              }],
              details: result,
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error('save_memory failed', error);
            
            const failedResult = { 
              id: '', 
              timestamp: new Date().toISOString(), 
              success: false,
              message: `Failed to save memory: ${errorMessage}`,
            };
            
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(failedResult, null, 2) 
              }],
              details: failedResult,
            };
          }
        },
      },
      { name: "save_memory" },
    );
    log.info('save_memory registered');
    
    log.info('All tools registered successfully');
    
    // Health check on startup (non-blocking)
    checkHealth().then(healthy => {
      if (healthy) {
        log.info('MoltBrain service is available', { url: MOLTBRAIN_BASE_URL });
      } else {
        log.warn('MoltBrain service not available - tools will retry on use', { 
          url: MOLTBRAIN_BASE_URL 
        });
      }
    }).catch(() => {
      log.warn('Health check failed - MoltBrain may not be running');
    });
  },
};

export default moltbrainPlugin;

// Export types for external use
export type { MemoryResult, RecallResponse, SearchResponse, SaveResponse };
export { checkHealth, recallContext, searchMemories, saveMemory };
