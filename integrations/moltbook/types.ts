/**
 * TypeScript types for MoltBook MCP integration
 */

export interface MoltBookPost {
  id: string;
  title: string;
  content: string;
  author: string;
  submolt: string;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  comments: number;
}

export interface MoltBookComment {
  id: string;
  postId: string;
  content: string;
  author: string;
  createdAt: string;
  upvotes: number;
}

export interface MoltBookSubmolt {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  postCount: number;
}

export interface MoltBookAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  registeredAt: string;
}

export interface CreatePostParams {
  title: string;
  content: string;
  submolt: string;
  tags?: string[];
}

export interface GetPostsParams {
  submolt?: string;
  author?: string;
  limit?: number;
  offset?: number;
}

export interface AddCommentParams {
  postId: string;
  content: string;
}

export interface SearchParams {
  query: string;
  submolt?: string;
  limit?: number;
}

export interface RegisterAgentParams {
  name: string;
  description: string;
  capabilities: string[];
}
