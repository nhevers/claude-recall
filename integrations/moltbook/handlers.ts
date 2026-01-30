/**
 * MCP Request Handlers for MoltBook
 * Handles MoltBook operations via MCP protocol
 */

import { MoltBookClient } from './moltbook-client.js';
import type {
  CreatePostParams,
  GetPostsParams,
  AddCommentParams,
  SearchParams,
  RegisterAgentParams,
} from './types.js';

export interface MCPRequest {
  id: string | number;
  method: string;
  params?: unknown;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export class MoltBookHandlers {
  private client: MoltBookClient;
  private initialized = false;

  constructor(client: MoltBookClient) {
    this.client = client;
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;

    try {
      // Initialize must be called first
      if (method !== 'initialize' && !this.initialized) {
        return this.errorResponse(id, -32002, 'Server not initialized');
      }

      switch (method) {
        case 'initialize':
          return this.handleInitialize(id, params);
        case 'moltbook/create_post':
          return this.handleCreatePost(id, params as CreatePostParams);
        case 'moltbook/get_posts':
          return this.handleGetPosts(id, params as GetPostsParams);
        case 'moltbook/get_post':
          return this.handleGetPost(id, params as { postId: string });
        case 'moltbook/add_comment':
          return this.handleAddComment(id, params as AddCommentParams);
        case 'moltbook/list_submolts':
          return this.handleListSubmolts(id);
        case 'moltbook/get_submolt':
          return this.handleGetSubmolt(id, params as { submoltName: string });
        case 'moltbook/search':
          return this.handleSearch(id, params as SearchParams);
        case 'moltbook/register_agent':
          return this.handleRegisterAgent(id, params as RegisterAgentParams);
        case 'moltbook/get_agent':
          return this.handleGetAgent(id, params as { agentId: string });
        case 'shutdown':
          return this.handleShutdown(id);
        default:
          return this.errorResponse(id, -32601, `Unknown method: ${method}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.errorResponse(id, -32603, message);
    }
  }

  private handleInitialize(id: string | number, params?: unknown): MCPResponse {
    this.initialized = true;

    const result = {
      serverInfo: {
        name: 'moltbrain-moltbook',
        version: '1.0.0',
      },
      capabilities: {
        tools: {
          'moltbook/create_post': true,
          'moltbook/get_posts': true,
          'moltbook/get_post': true,
          'moltbook/add_comment': true,
          'moltbook/list_submolts': true,
          'moltbook/get_submolt': true,
          'moltbook/search': true,
          'moltbook/register_agent': true,
          'moltbook/get_agent': true,
        },
      },
    };

    return { jsonrpc: '2.0', id, result };
  }

  private async handleCreatePost(id: string | number, params: CreatePostParams): Promise<MCPResponse> {
    if (!params?.title || !params?.content || !params?.submolt) {
      return this.errorResponse(id, -32602, 'Missing required parameters: title, content, submolt');
    }

    const post = await this.client.createPost(params);
    return { jsonrpc: '2.0', id, result: { post } };
  }

  private async handleGetPosts(id: string | number, params?: GetPostsParams): Promise<MCPResponse> {
    const posts = await this.client.getPosts(params);
    return { jsonrpc: '2.0', id, result: { posts } };
  }

  private async handleGetPost(id: string | number, params: { postId: string }): Promise<MCPResponse> {
    if (!params?.postId) {
      return this.errorResponse(id, -32602, 'Missing required parameter: postId');
    }

    const post = await this.client.getPost(params.postId);
    return { jsonrpc: '2.0', id, result: { post } };
  }

  private async handleAddComment(id: string | number, params: AddCommentParams): Promise<MCPResponse> {
    if (!params?.postId || !params?.content) {
      return this.errorResponse(id, -32602, 'Missing required parameters: postId, content');
    }

    const comment = await this.client.addComment(params);
    return { jsonrpc: '2.0', id, result: { comment } };
  }

  private async handleListSubmolts(id: string | number): Promise<MCPResponse> {
    const submolts = await this.client.listSubmolts();
    return { jsonrpc: '2.0', id, result: { submolts } };
  }

  private async handleGetSubmolt(id: string | number, params: { submoltName: string }): Promise<MCPResponse> {
    if (!params?.submoltName) {
      return this.errorResponse(id, -32602, 'Missing required parameter: submoltName');
    }

    const submolt = await this.client.getSubmolt(params.submoltName);
    return { jsonrpc: '2.0', id, result: { submolt } };
  }

  private async handleSearch(id: string | number, params: SearchParams): Promise<MCPResponse> {
    if (!params?.query) {
      return this.errorResponse(id, -32602, 'Missing required parameter: query');
    }

    const results = await this.client.search(params);
    return { jsonrpc: '2.0', id, result: results };
  }

  private async handleRegisterAgent(id: string | number, params: RegisterAgentParams): Promise<MCPResponse> {
    if (!params?.name || !params?.description) {
      return this.errorResponse(id, -32602, 'Missing required parameters: name, description');
    }

    const agent = await this.client.registerAgent(params);
    return { jsonrpc: '2.0', id, result: { agent } };
  }

  private async handleGetAgent(id: string | number, params: { agentId: string }): Promise<MCPResponse> {
    if (!params?.agentId) {
      return this.errorResponse(id, -32602, 'Missing required parameter: agentId');
    }

    const agent = await this.client.getAgent(params.agentId);
    return { jsonrpc: '2.0', id, result: { agent } };
  }

  private handleShutdown(id: string | number): MCPResponse {
    this.initialized = false;
    return { jsonrpc: '2.0', id, result: { success: true } };
  }

  private errorResponse(id: string | number, code: number, message: string): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    };
  }
}
