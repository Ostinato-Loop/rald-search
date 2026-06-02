-- ============================================================
-- RALD Search — Supabase Schema v1.0
-- Search Platform — Phase E
-- Owner: LILCKY STUDIO LIMITED
-- All statements idempotent (IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- ── Generic Search Index helper function ─────────────────────
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.raw_text, ''));
  RETURN NEW;
END;
$$;

-- ── Customers Search Index ────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_index_customers (
  id            TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'customers',
  data          JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR,
  deleted_at    TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, workspace_id)
);
CREATE INDEX IF NOT EXISTS srch_cust_ws_idx ON search_index_customers (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS srch_cust_fts_idx ON search_index_customers USING GIN (search_vector) WHERE deleted_at IS NULL;

CREATE OR REPLACE TRIGGER search_customers_vector
  BEFORE INSERT OR UPDATE ON search_index_customers
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Customer Notes Search Index ───────────────────────────────
CREATE TABLE IF NOT EXISTS search_index_customer_notes (
  id            TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'customer_notes',
  data          JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR,
  deleted_at    TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, workspace_id)
);
CREATE INDEX IF NOT EXISTS srch_cnotes_ws_idx  ON search_index_customer_notes (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS srch_cnotes_fts_idx ON search_index_customer_notes USING GIN (search_vector) WHERE deleted_at IS NULL;
CREATE OR REPLACE TRIGGER search_customer_notes_vector
  BEFORE INSERT OR UPDATE ON search_index_customer_notes
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Customer Activities Search Index ─────────────────────────
CREATE TABLE IF NOT EXISTS search_index_customer_activities (
  id            TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'customer_activities',
  data          JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR,
  deleted_at    TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, workspace_id)
);
CREATE INDEX IF NOT EXISTS srch_cact_ws_idx  ON search_index_customer_activities (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS srch_cact_fts_idx ON search_index_customer_activities USING GIN (search_vector) WHERE deleted_at IS NULL;
CREATE OR REPLACE TRIGGER search_customer_activities_vector
  BEFORE INSERT OR UPDATE ON search_index_customer_activities
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Segments Search Index ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_index_segments (
  id            TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'segments',
  data          JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR,
  deleted_at    TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, workspace_id)
);
CREATE INDEX IF NOT EXISTS srch_seg_ws_idx  ON search_index_segments (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS srch_seg_fts_idx ON search_index_segments USING GIN (search_vector) WHERE deleted_at IS NULL;
CREATE OR REPLACE TRIGGER search_segments_vector
  BEFORE INSERT OR UPDATE ON search_index_segments
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Workspaces Search Index ───────────────────────────────────
CREATE TABLE IF NOT EXISTS search_index_workspaces (
  id            TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'workspaces',
  data          JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR,
  deleted_at    TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, workspace_id)
);
CREATE INDEX IF NOT EXISTS srch_ws_ws_idx  ON search_index_workspaces (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS srch_ws_fts_idx ON search_index_workspaces USING GIN (search_vector) WHERE deleted_at IS NULL;
CREATE OR REPLACE TRIGGER search_workspaces_vector
  BEFORE INSERT OR UPDATE ON search_index_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Users Search Index ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_index_users (
  id            TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'users',
  data          JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR,
  deleted_at    TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, workspace_id)
);
CREATE INDEX IF NOT EXISTS srch_usr_ws_idx  ON search_index_users (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS srch_usr_fts_idx ON search_index_users USING GIN (search_vector) WHERE deleted_at IS NULL;
CREATE OR REPLACE TRIGGER search_users_vector
  BEFORE INSERT OR UPDATE ON search_index_users
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Notifications Search Index ────────────────────────────────
CREATE TABLE IF NOT EXISTS search_index_notifications (
  id            TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'notifications',
  data          JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR,
  deleted_at    TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, workspace_id)
);
CREATE INDEX IF NOT EXISTS srch_notif_ws_idx  ON search_index_notifications (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS srch_notif_fts_idx ON search_index_notifications USING GIN (search_vector) WHERE deleted_at IS NULL;
CREATE OR REPLACE TRIGGER search_notifications_vector
  BEFORE INSERT OR UPDATE ON search_index_notifications
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Templates Search Index ────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_index_templates (
  id            TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT 'templates',
  data          JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR,
  deleted_at    TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, workspace_id)
);
CREATE INDEX IF NOT EXISTS srch_tmpl_ws_idx  ON search_index_templates (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS srch_tmpl_fts_idx ON search_index_templates USING GIN (search_vector) WHERE deleted_at IS NULL;
CREATE OR REPLACE TRIGGER search_templates_vector
  BEFORE INSERT OR UPDATE ON search_index_templates
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Saved Searches ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_saved (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  query        TEXT NOT NULL,
  entities     JSONB NOT NULL DEFAULT '[]',
  filters      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id, name)
);
CREATE INDEX IF NOT EXISTS srch_saved_ws_idx   ON search_saved (workspace_id);
CREATE INDEX IF NOT EXISTS srch_saved_user_idx ON search_saved (workspace_id, user_id);

-- ── Recent Searches ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_recent (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  query        TEXT NOT NULL,
  entity_scope JSONB NOT NULL DEFAULT '[]',
  result_count INTEGER NOT NULL DEFAULT 0,
  searched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id, query)
);
CREATE INDEX IF NOT EXISTS srch_recent_ws_idx   ON search_recent (workspace_id);
CREATE INDEX IF NOT EXISTS srch_recent_user_idx ON search_recent (workspace_id, user_id);
CREATE INDEX IF NOT EXISTS srch_recent_time_idx ON search_recent (searched_at DESC);

-- ── Search Audit Log ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_audit_log (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL,
  user_id      TEXT,
  query        TEXT NOT NULL,
  entity_scope JSONB NOT NULL DEFAULT '[]',
  result_count INTEGER NOT NULL DEFAULT 0,
  provider     TEXT NOT NULL DEFAULT 'postgres',
  ip_address   TEXT,
  user_agent   TEXT,
  saved        BOOLEAN NOT NULL DEFAULT FALSE,
  searched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS srch_audit_ws_idx   ON search_audit_log (workspace_id);
CREATE INDEX IF NOT EXISTS srch_audit_user_idx ON search_audit_log (user_id);
CREATE INDEX IF NOT EXISTS srch_audit_time_idx ON search_audit_log (searched_at DESC);

-- ── Disable RLS (service role key used from Worker) ───────────
ALTER TABLE search_index_customers           DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_index_customer_notes      DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_index_customer_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_index_segments            DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_index_workspaces          DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_index_users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_index_notifications       DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_index_templates           DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_saved                     DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_recent                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_audit_log                 DISABLE ROW LEVEL SECURITY;

-- NOTE: Owner: LILCKY STUDIO LIMITED. Phase E — Search Platform.
