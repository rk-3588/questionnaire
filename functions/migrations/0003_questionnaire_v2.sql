-- Add alongside v1: never reinterpret or overwrite the original twenty answers.
CREATE TABLE IF NOT EXISTS survey_submissions_v2 (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1))
);
CREATE INDEX IF NOT EXISTS survey_submissions_v2_public_date
  ON survey_submissions_v2(published, created_at DESC);
