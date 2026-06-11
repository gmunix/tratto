PRAGMA foreign_keys = ON;

ALTER TABLE trattos ADD COLUMN creator_id TEXT REFERENCES users (id);
ALTER TABLE trattos ADD COLUMN community_id TEXT REFERENCES communities (id) ON DELETE SET NULL;
ALTER TABLE trattos ADD COLUMN rules_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE tratto_participants ADD COLUMN user_id TEXT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE tratto_participants ADD COLUMN invited_by_user_id TEXT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE tratto_participants ADD COLUMN invited_at TEXT;

ALTER TABLE evidences ADD COLUMN author_user_id TEXT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE comments ADD COLUMN author_user_id TEXT REFERENCES users (id) ON DELETE SET NULL;

UPDATE tratto_participants
SET user_id = (
  SELECT users.id
  FROM users
  WHERE LOWER(users.display_name) = LOWER(tratto_participants.display_name)
  LIMIT 1
)
WHERE user_id IS NULL;

UPDATE tratto_participants
SET invited_at = created_at
WHERE invited_at IS NULL
  AND invite_status = 'pending';

UPDATE trattos
SET creator_id = (
  SELECT participant.user_id
  FROM tratto_participants participant
  WHERE participant.tratto_id = trattos.id
    AND participant.role = 'creator'
  LIMIT 1
)
WHERE creator_id IS NULL;

UPDATE evidences
SET author_user_id = (
  SELECT participant.user_id
  FROM tratto_participants participant
  WHERE participant.tratto_id = evidences.tratto_id
    AND participant.id = evidences.author_participant_id
  LIMIT 1
)
WHERE author_user_id IS NULL;

UPDATE comments
SET author_user_id = (
  SELECT participant.user_id
  FROM tratto_participants participant
  WHERE participant.tratto_id = comments.tratto_id
    AND participant.id = comments.author_participant_id
  LIMIT 1
)
WHERE author_user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_trattos_creator_id
  ON trattos (creator_id);

CREATE INDEX IF NOT EXISTS idx_trattos_community_id
  ON trattos (community_id);

CREATE INDEX IF NOT EXISTS idx_tratto_participants_user_id
  ON tratto_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_evidences_author_user_id
  ON evidences (author_user_id);

CREATE INDEX IF NOT EXISTS idx_comments_author_user_id
  ON comments (author_user_id);
