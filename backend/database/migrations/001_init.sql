PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS trattos (
  id TEXT PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Outro',
  consequence TEXT,
  rules TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'active',
      'review',
      'finished',
      'cancelled',
      'loser-detected',
      'compliance'
    )
  ),
  deadline TEXT,
  decision_method TEXT NOT NULL DEFAULT 'mutual' CHECK (
    decision_method IN ('mutual', 'vote', 'judge')
  ),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  cancelled_at TEXT
);

CREATE TABLE IF NOT EXISTS tratto_participants (
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
  FOREIGN KEY (tratto_id) REFERENCES trattos (id) ON DELETE CASCADE,
  UNIQUE (tratto_id, id),
  UNIQUE (tratto_id, display_name)
);

CREATE TABLE IF NOT EXISTS evidences (
  id TEXT PRIMARY KEY,
  tratto_id TEXT NOT NULL,
  author_participant_id TEXT,
  author_display_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'link', 'file')),
  content TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tratto_id) REFERENCES trattos (id) ON DELETE CASCADE,
  FOREIGN KEY (tratto_id, author_participant_id)
    REFERENCES tratto_participants (tratto_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  tratto_id TEXT NOT NULL,
  author_participant_id TEXT,
  author_display_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tratto_id) REFERENCES trattos (id) ON DELETE CASCADE,
  FOREIGN KEY (tratto_id, author_participant_id)
    REFERENCES tratto_participants (tratto_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  tratto_id TEXT NOT NULL,
  voter_participant_id TEXT NOT NULL,
  voted_for_participant_id TEXT,
  value TEXT NOT NULL CHECK (value IN ('approve', 'reject', 'winner', 'loser', 'abstain')),
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tratto_id) REFERENCES trattos (id) ON DELETE CASCADE,
  FOREIGN KEY (tratto_id, voter_participant_id)
    REFERENCES tratto_participants (tratto_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tratto_id, voted_for_participant_id)
    REFERENCES tratto_participants (tratto_id, id) ON DELETE CASCADE,
  UNIQUE (tratto_id, voter_participant_id)
);

CREATE TABLE IF NOT EXISTS tratto_verdicts (
  id TEXT PRIMARY KEY,
  tratto_id TEXT NOT NULL UNIQUE,
  decision_method TEXT NOT NULL CHECK (decision_method IN ('mutual', 'vote', 'judge')),
  decided_by_participant_id TEXT,
  winner_participant_id TEXT,
  loser_participant_id TEXT,
  summary TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tratto_id) REFERENCES trattos (id) ON DELETE CASCADE,
  FOREIGN KEY (tratto_id, decided_by_participant_id)
    REFERENCES tratto_participants (tratto_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tratto_id, winner_participant_id)
    REFERENCES tratto_participants (tratto_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tratto_id, loser_participant_id)
    REFERENCES tratto_participants (tratto_id, id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS trg_trattos_updated_at
AFTER UPDATE ON trattos
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE trattos
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

CREATE INDEX IF NOT EXISTS idx_trattos_status_deadline
  ON trattos (status, deadline);

CREATE INDEX IF NOT EXISTS idx_participants_tratto
  ON tratto_participants (tratto_id);

CREATE INDEX IF NOT EXISTS idx_participants_invite_status
  ON tratto_participants (invite_status);

CREATE INDEX IF NOT EXISTS idx_evidences_tratto_created_at
  ON evidences (tratto_id, created_at);

CREATE INDEX IF NOT EXISTS idx_comments_tratto_created_at
  ON comments (tratto_id, created_at);

CREATE INDEX IF NOT EXISTS idx_votes_tratto
  ON votes (tratto_id);
