PRAGMA foreign_keys = OFF;

CREATE TABLE tratto_participants_new (
  id TEXT PRIMARY KEY,
  tratto_id TEXT NOT NULL,
  display_name TEXT NOT NULL COLLATE NOCASE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (
    role IN ('creator', 'participant', 'judge')
  ),
  invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    invite_status IN ('pending', 'accepted', 'declined')
  ),
  accepted_at TEXT,
  declined_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  invited_by_user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  invited_at TEXT,
  FOREIGN KEY (tratto_id) REFERENCES trattos (id) ON DELETE CASCADE,
  UNIQUE (tratto_id, id)
);

INSERT INTO tratto_participants_new (
  id,
  tratto_id,
  display_name,
  role,
  invite_status,
  accepted_at,
  declined_at,
  created_at,
  user_id,
  invited_by_user_id,
  invited_at
)
SELECT
  id,
  tratto_id,
  display_name,
  role,
  invite_status,
  accepted_at,
  declined_at,
  created_at,
  user_id,
  invited_by_user_id,
  invited_at
FROM tratto_participants;

DROP TABLE tratto_participants;
ALTER TABLE tratto_participants_new RENAME TO tratto_participants;

CREATE INDEX IF NOT EXISTS idx_participants_tratto
  ON tratto_participants (tratto_id);

CREATE INDEX IF NOT EXISTS idx_participants_invite_status
  ON tratto_participants (invite_status);

CREATE INDEX IF NOT EXISTS idx_tratto_participants_user_id
  ON tratto_participants (user_id);

PRAGMA foreign_keys = ON;
