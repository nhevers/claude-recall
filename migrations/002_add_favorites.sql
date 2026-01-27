-- Migration: 002_add_favorites
-- Description: Add favorites/bookmarking functionality
-- Created: 2026-01-16

-- Add is_favorite column to observations
ALTER TABLE observations ADD COLUMN is_favorite INTEGER DEFAULT 0;

-- Create favorites index for quick filtering
CREATE INDEX IF NOT EXISTS idx_observations_favorite ON observations(is_favorite) WHERE is_favorite = 1;

-- Favorites metadata table for additional info
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_id INTEGER NOT NULL UNIQUE,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_observation ON favorites(observation_id);

-- Update schema version
INSERT INTO schema_version (version, description) VALUES (2, 'Add favorites support');
