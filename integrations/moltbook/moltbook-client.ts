/**
 * MoltBook API Client
 * Handles communication with MoltBook API
 */

import type {
  MoltBookPost,
  MoltBookComment,
  MoltBookSubmolt,
  MoltBookAgent,
  CreatePostParams,
  GetPostsParams,
  AddCommentParams,
  SearchParams,
  RegisterAgentParams,
} from './types.js';

export interface MoltBookClientConfig {
  apiUrl: string;
  agentId?: string;
  apiKey?: string;
}

export class MoltBookClient {
  private config: MoltBookClientConfig;

  constructor(config: MoltBookClientConfig) {
    this.config = {
      apiUrl: config.apiUrl || 'https://moltbook.com',
      ...config,
    };
  }

  /**
   * Create a new post on MoltBook
   */
  async createPost(params: CreatePostParams): Promise<MoltBookPost> {
    const response = await this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return response.json();
  }

  /**
   * Get posts from MoltBook
   */
  async getPosts(params: GetPostsParams = {}): Promise<MoltBookPost[]> {
    const queryParams = new URLSearchParams();
    if (params.submolt) queryParams.set('submolt', params.submolt);
    if (params.author) queryParams.set('author', params.author);
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset) queryParams.set('offset', params.offset.toString());

    const response = await this.request(`/api/posts?${queryParams.toString()}`);
    return response.json();
  }

  /**
   * Get a specific post by ID
   */
  async getPost(postId: string): Promise<MoltBookPost> {
    const response = await this.request(`/api/posts/${postId}`);
    return response.json();
  }

  /**
   * Add a comment to a post
   */
  async addComment(params: AddCommentParams): Promise<MoltBookComment> {
    const response = await this.request(`/api/posts/${params.postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: params.content }),
    });

    return response.json();
  }

  /**
   * List all submolts
   */
  async listSubmolts(): Promise<MoltBookSubmolt[]> {
    const response = await this.request('/api/submolts');
    return response.json();
  }

  /**
   * Get a specific submolt
   */
  async getSubmolt(submoltName: string): Promise<MoltBookSubmolt> {
    const response = await this.request(`/api/submolts/${submoltName}`);
    return response.json();
  }

  /**
   * Search posts and comments
   */
  async search(params: SearchParams): Promise<{ posts: MoltBookPost[]; comments: MoltBookComment[] }> {
    const queryParams = new URLSearchParams();
    queryParams.set('q', params.query);
    if (params.submolt) queryParams.set('submolt', params.submolt);
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const response = await this.request(`/api/search?${queryParams.toString()}`);
    return response.json();
  }

  /**
   * Register an agent with MoltBook
   */
  async registerAgent(params: RegisterAgentParams): Promise<MoltBookAgent> {
    const response = await this.request('/api/agents/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return response.json();
  }

  /**
   * Get agent information
   */
  async getAgent(agentId: string): Promise<MoltBookAgent> {
    const response = await this.request(`/api/agents/${agentId}`);
    return response.json();
  }

  /**
   * Make HTTP request to MoltBook API
   */
  private async request(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.config.apiUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    if (this.config.agentId) {
      headers['X-Agent-ID'] = this.config.agentId;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`MoltBook API error: ${error.message || response.statusText}`);
    }

    return response;
  }
}
