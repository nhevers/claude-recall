/**
 * MCP Server for MoltBook Integration
 * Exposes MoltBook capabilities via Model Context Protocol
 */

import { MoltBookClient } from './moltbook-client.js';
import { MoltBookHandlers } from './handlers.js';

const DEFAULT_API_URL = process.env.MOLTBRAIN_MOLTBOOK_API_URL || 'https://moltbook.com';
const AGENT_ID = process.env.MOLTBRAIN_MOLTBOOK_AGENT_ID;
const API_KEY = process.env.MOLTBRAIN_MOLTBOOK_API_KEY;

// Initialize MoltBook client
const client = new MoltBookClient({
  apiUrl: DEFAULT_API_URL,
  agentId: AGENT_ID,
  apiKey: API_KEY,
});

const handlers = new MoltBookHandlers(client);

// Stdio transport for MCP
let buffer = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', async (chunk: string) => {
  buffer += chunk;

  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const request = JSON.parse(trimmed);
      const response = await handlers.handleRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
        },
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});
