PRAGMA foreign_keys = ON;

ALTER TABLE trattos ADD COLUMN creator_id TEXT REFERENCES users (id);
ALTER TABLE trattos ADD COLUMN community_id TEXT REFERENCES communities (id) ON DELETE SET NULL;
ALTER TABLE trattos ADD COLUMN rules_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE tratto_participants ADD COLUMN user_id TEXT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE tratto_participants ADD COLUMN invited_by_user_id TEXT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE tratto_participants ADD COLUMN invited_at TEXT;

ALTER TABLE evidences ADD COLUMN author_user_id TEXT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE comments ADD COLUMN author_user_id TEXT REFERENCES users (id) ON DELETE SET NULL;

WITH unique_display_names AS (
  SELECT LOWER(display_name) AS display_name_key, MIN(id) AS user_id
  FROM users
  GROUP BY LOWER(display_name)
  HAVING COUNT(*) = 1
)
UPDATE tratto_participants
SET user_id = (
  SELECT unique_display_names.user_id
  FROM unique_display_names
  WHERE unique_display_names.display_name_key = LOWER(tratto_participants.display_name)
)
WHERE user_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM unique_display_names
    WHERE unique_display_names.display_name_key = LOWER(tratto_participants.display_name)
  );

UPDATE tratto_participants
SET invited_at = created_at
WHERE invited_at IS NULL;

UPDATE trattos
SET creator_id = (
  SELECT participant.user_id
  FROM tratto_participants participant
  WHERE participant.tratto_id = trattos.id
    AND participant.role = 'creator'
  GROUP BY participant.tratto_id
  HAVING COUNT(*) = 1
)
WHERE creator_id IS NULL;

UPDATE tratto_participants
SET invited_by_user_id = (
  SELECT trattos.creator_id
  FROM trattos
  WHERE trattos.id = tratto_participants.tratto_id
)
WHERE invited_by_user_id IS NULL
  AND role != 'creator'
  AND EXISTS (
    SELECT 1
    FROM trattos
    WHERE trattos.id = tratto_participants.tratto_id
      AND trattos.creator_id IS NOT NULL
  );

UPDATE evidences
SET author_user_id = (
  SELECT participant.user_id
  FROM tratto_participants participant
  WHERE participant.tratto_id = evidences.tratto_id
    AND participant.id = evidences.author_participant_id
)
WHERE author_user_id IS NULL;

UPDATE comments
SET author_user_id = (
  SELECT participant.user_id
  FROM tratto_participants participant
  WHERE participant.tratto_id = comments.tratto_id
    AND participant.id = comments.author_participant_id
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
