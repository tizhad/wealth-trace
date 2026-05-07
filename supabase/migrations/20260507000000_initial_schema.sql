-- ─────────────────────────────────────────────────────────────────────────────
-- JobMate — initial schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Shared: updated_at trigger ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── study_subjects ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_subjects (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title               text        NOT NULL,
  summary             text,
  category            text        NOT NULL DEFAULT 'javascript',
  priority            text        NOT NULL DEFAULT 'medium',
  status              text        NOT NULL DEFAULT 'not_started',
  confidence_score    smallint    NOT NULL DEFAULT 1 CHECK (confidence_score BETWEEN 1 AND 5),
  estimated_read_time integer,
  tags                text[]      NOT NULL DEFAULT '{}',
  qa                  jsonb       NOT NULL DEFAULT '[]',
  source_url          text,
  ai_summary          text,
  interviewed_on      timestamptz[] NOT NULL DEFAULT '{}',
  last_reviewed_at    timestamptz,
  next_review_at      timestamptz,
  is_archived         boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_study_subjects
  BEFORE UPDATE ON study_subjects
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE study_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects: owner access"
  ON study_subjects FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── subject_relations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subject_relations (
  subject_id  uuid NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
  related_id  uuid NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (subject_id, related_id),
  CONSTRAINT no_self_relation CHECK (subject_id != related_id)
);

ALTER TABLE subject_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_relations: owner access"
  ON subject_relations FOR ALL
  USING (
    subject_id IN (SELECT id FROM study_subjects WHERE user_id = auth.uid())
  );

-- ── subject_companies ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subject_companies (
  id          uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id  uuid  NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
  user_id     uuid  NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        text  NOT NULL,
  frequency   text  NOT NULL DEFAULT 'once',
  notes       text
);

ALTER TABLE subject_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_companies: owner access"
  ON subject_companies FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── subject_notes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subject_notes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id  uuid        NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content     jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_subject_notes
  BEFORE UPDATE ON subject_notes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE subject_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_notes: owner access"
  ON subject_notes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── subject_code_samples ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subject_code_samples (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id  uuid        NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title       text        NOT NULL,
  language    text        NOT NULL DEFAULT 'typescript',
  code        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subject_code_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_code_samples: owner access"
  ON subject_code_samples FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── subject_resources ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subject_resources (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id  uuid    NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
  user_id     uuid    NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title       text    NOT NULL,
  url         text    NOT NULL,
  type        text    NOT NULL DEFAULT 'article',
  read        boolean NOT NULL DEFAULT false
);

ALTER TABLE subject_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_resources: owner access"
  ON subject_resources FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── companies ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        text        NOT NULL,
  category    text        NOT NULL DEFAULT 'startup',
  status      text        NOT NULL DEFAULT 'saved',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies: owner access"
  ON companies FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── applications ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS applications (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title       text        NOT NULL,
  company     text        NOT NULL,
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  location    text,
  status      text        NOT NULL DEFAULT 'saved',
  salary      text,
  tags        text[]      NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_applications
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications: owner access"
  ON applications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── user_settings ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  display_name  text,
  accent        text        NOT NULL DEFAULT 'indigo',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_user_settings
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings: owner access"
  ON user_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Supabase Storage bucket ───────────────────────────────────────────────────
-- Run this separately in Dashboard → Storage, or via the Supabase CLI:
--
--   supabase storage create subject-images --public
--
-- Then add RLS policies via Dashboard → Storage → subject-images → Policies:
--   SELECT: true (public reads)
--   INSERT: auth.uid() IS NOT NULL
--   DELETE: name LIKE auth.uid() || '/%'
