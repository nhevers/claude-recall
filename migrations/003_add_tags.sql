-- Migration: 003_add_tags
-- Description: Add custom tagging system
-- Created: 2026-01-18

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Observation-tag junction table
CREATE TABLE IF NOT EXISTS observation_tags (
  observation_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (observation_id, tag_id),
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_observation_tags_obs ON observation_tags(observation_id);
CREATE INDEX IF NOT EXISTS idx_observation_tags_tag ON observation_tags(tag_id);

-- Session-tag junction table
CREATE TABLE IF NOT EXISTS session_tags (
  session_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, tag_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_tags_session ON session_tags(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tags_tag ON session_tags(tag_id);

-- Insert some default tags
INSERT OR IGNORE INTO tags (name, color, description) VALUES
  ('important', '#ef4444', 'High priority items'),
  ('todo', '#f59e0b', 'Items to follow up on'),
  ('reference', '#3b82f6', 'Reference material'),
  ('archived', '#6b7280', 'Archived items');

-- Update schema version
INSERT INTO schema_version (version, description) VALUES (3, 'Add custom tags');
