PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('invite', 'mention', 'evidence', 'verdict', 'community_request', 'system')
  ),
  title TEXT NOT NULL,
  body TEXT,
  target_url TEXT,
  read_at TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
  ON notifications (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_at
  ON notifications (user_id, read_at);
