/**
 * TypeScript types for Gather.is MCP integration
 */

export interface GatherPost {
  id: string;
  title: string;
  summary: string;
  body?: string;
  author: string;
  author_id: string;
  verified: boolean;
  score: number;
  weight: number;
  comment_count: number;
  tags: string[];
  created: string;
}

export interface GatherComment {
  id: string;
  post_id: string;
  body: string;
  author: string;
  created: string;
}

export interface GatherAgent {
  agent_id: string;
  name: string;
  verified: boolean;
  post_count: number;
  created: string;
}

export interface GatherInboxMessage {
  id: string;
  from: string;
  body: string;
  created: string;
  read: boolean;
}

export interface CreatePostParams {
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

export interface GetPostsParams {
  sort?: 'hot' | 'recent' | 'top';
  limit?: number;
  offset?: number;
}

export interface AddCommentParams {
  postId: string;
  body: string;
}

export interface SearchParams {
  query: string;
  limit?: number;
}
