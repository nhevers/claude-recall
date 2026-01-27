-- Migration: 001_initial
-- Description: Initial database schema for claude-recall
-- Created: 2026-01-14

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_session_id TEXT NOT NULL UNIQUE,
  memory_session_id TEXT,
  project TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at_epoch INTEGER,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_complete INTEGER DEFAULT 0,
  prompt_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at_epoch);
CREATE INDEX IF NOT EXISTS idx_sessions_content_id ON sessions(content_session_id);

-- Observations table
CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_session_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  narrative TEXT,
  facts TEXT, -- JSON array
  concepts TEXT, -- JSON array
  files_read TEXT, -- JSON array
  files_modified TEXT, -- JSON array
  project TEXT NOT NULL,
  prompt_number INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at_epoch INTEGER,
  tokens_used INTEGER DEFAULT 0,
  FOREIGN KEY (memory_session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_observations_session ON observations(memory_session_id);
CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project);
CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type);
CREATE INDEX IF NOT EXISTS idx_observations_created_at ON observations(created_at_epoch);

-- Full-text search for observations
CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
  title,
  subtitle,
  narrative,
  facts,
  concepts,
  content='observations',
  content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
  INSERT INTO observations_fts(rowid, title, subtitle, narrative, facts, concepts)
  VALUES (new.id, new.title, new.subtitle, new.narrative, new.facts, new.concepts);
END;

CREATE TRIGGER IF NOT EXISTS observations_ad AFTER DELETE ON observations BEGIN
  INSERT INTO observations_fts(observations_fts, rowid, title, subtitle, narrative, facts, concepts)
  VALUES ('delete', old.id, old.title, old.subtitle, old.narrative, old.facts, old.concepts);
END;

CREATE TRIGGER IF NOT EXISTS observations_au AFTER UPDATE ON observations BEGIN
  INSERT INTO observations_fts(observations_fts, rowid, title, subtitle, narrative, facts, concepts)
  VALUES ('delete', old.id, old.title, old.subtitle, old.narrative, old.facts, old.concepts);
  INSERT INTO observations_fts(rowid, title, subtitle, narrative, facts, concepts)
  VALUES (new.id, new.title, new.subtitle, new.narrative, new.facts, new.concepts);
END;

-- Summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  request TEXT,
  investigated TEXT,
  learned TEXT,
  completed TEXT,
  next_steps TEXT,
  notes TEXT,
  project TEXT NOT NULL,
  prompt_number INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at_epoch INTEGER,
  tokens_used INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_summaries_session ON summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_summaries_project ON summaries(project);

-- Prompts table (user prompts)
CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  prompt_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  project TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at_epoch INTEGER
);

CREATE INDEX IF NOT EXISTS idx_prompts_session ON prompts(session_id);

-- Pending messages queue
CREATE TABLE IF NOT EXISTS pending_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_db_id INTEGER NOT NULL,
  message_type TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON
  created_at_epoch INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error TEXT,
  FOREIGN KEY (session_db_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pending_session ON pending_messages(session_db_id);
CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_messages(status);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

INSERT OR IGNORE INTO schema_version (version, description) VALUES (1, 'Initial schema');
