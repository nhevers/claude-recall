/**
 * Gather.is API Client
 *
 * Gather.is is a social platform for AI agents using Ed25519 challenge-response
 * authentication and proof-of-work anti-spam.
 *
 * API docs: https://gather.is/help
 * Source: https://github.com/philmade/gather-infra
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import type {
  GatherPost,
  GatherComment,
  GatherAgent,
  GatherInboxMessage,
  CreatePostParams,
  GetPostsParams,
  AddCommentParams,
} from './types.js';

export interface GatherClientConfig {
  apiUrl: string;
  privateKeyPath?: string;
  publicKeyPath?: string;
}

export class GatherClient {
  private config: GatherClientConfig;
  private token: string | null = null;

  constructor(config: GatherClientConfig) {
    this.config = {
      apiUrl: config.apiUrl || 'https://gather.is',
      ...config,
    };
  }

  /**
   * Authenticate via Ed25519 challenge-response
   */
  async authenticate(): Promise<void> {
    if (!this.config.privateKeyPath || !this.config.publicKeyPath) {
      throw new Error('Gather.is requires privateKeyPath and publicKeyPath for Ed25519 authentication');
    }

    const publicPem = fs.readFileSync(this.config.publicKeyPath, 'utf-8');
    const privateKey = crypto.createPrivateKey(fs.readFileSync(this.config.privateKeyPath));

    // Get challenge nonce
    const challengeResp = await this.request('/api/agents/challenge', {
      method: 'POST',
      body: JSON.stringify({ public_key: publicPem }),
    }, true);
    const { nonce } = await challengeResp.json();
    const nonceBytes = Buffer.from(nonce, 'base64');

    // Sign the nonce
    const signature = crypto.sign(null, nonceBytes, privateKey);
    const sigB64 = signature.toString('base64');

    // Exchange for JWT
    const authResp = await this.request('/api/agents/authenticate', {
      method: 'POST',
      body: JSON.stringify({ public_key: publicPem, signature: sigB64 }),
    }, true);
    const { token } = await authResp.json();
    this.token = token;
  }

  /**
   * Solve proof-of-work challenge (required for posting)
   */
  private async solvePoW(purpose: string = 'post'): Promise<{ challenge: string; nonce: string }> {
    const resp = await this.request('/api/pow/challenge', {
      method: 'POST',
      body: JSON.stringify({ purpose }),
    });
    const { challenge, difficulty } = await resp.json();

    const targetBytes = Math.floor(difficulty / 8);
    const targetBits = difficulty % 8;

    for (let i = 0; i < 50_000_000; i++) {
      const hash = crypto.createHash('sha256').update(`${challenge}:${i}`).digest();

      let ok = true;
      for (let j = 0; j < targetBytes; j++) {
        if (hash[j] !== 0) { ok = false; break; }
      }
      if (ok && targetBits > 0) {
        const mask = 0xFF << (8 - targetBits);
        if ((hash[targetBytes] & mask) !== 0) ok = false;
      }
      if (ok) {
        return { challenge, nonce: String(i) };
      }
    }

    throw new Error(`Failed to solve PoW (difficulty=${difficulty})`);
  }

  /**
   * Create a post on Gather.is
   */
  async createPost(params: CreatePostParams): Promise<GatherPost> {
    const { challenge, nonce } = await this.solvePoW();

    const response = await this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: params.title.slice(0, 200),
        summary: params.summary.slice(0, 500),
        body: params.body.slice(0, 10000),
        tags: params.tags.slice(0, 5),
        pow_challenge: challenge,
        pow_nonce: nonce,
      }),
    });

    return response.json();
  }

  /**
   * Get posts from the feed
   */
  async getPosts(params: GetPostsParams = {}): Promise<GatherPost[]> {
    const queryParams = new URLSearchParams();
    if (params.sort) queryParams.set('sort', params.sort);
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset) queryParams.set('offset', params.offset.toString());

    const response = await this.request(`/api/posts?${queryParams.toString()}`);
    const data = await response.json();
    return data.posts || [];
  }

  /**
   * Add a comment to a post
   */
  async addComment(params: AddCommentParams): Promise<GatherComment> {
    const response = await this.request(`/api/posts/${params.postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: params.body }),
    });

    return response.json();
  }

  /**
   * Discover agents on the platform
   */
  async getAgents(): Promise<GatherAgent[]> {
    const response = await this.request('/api/agents');
    const data = await response.json();
    return data.agents || [];
  }

  /**
   * Get inbox messages
   */
  async getInbox(): Promise<GatherInboxMessage[]> {
    const response = await this.request('/api/inbox');
    const data = await response.json();
    return data.messages || [];
  }

  /**
   * Make HTTP request to Gather.is API
   */
  private async request(
    path: string,
    options: RequestInit = {},
    skipAuth: boolean = false
  ): Promise<Response> {
    if (!skipAuth && !this.token) {
      await this.authenticate();
    }

    const url = `${this.config.apiUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (!skipAuth && this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Gather.is API error: ${error.message || response.statusText}`);
    }

    return response;
  }
}
