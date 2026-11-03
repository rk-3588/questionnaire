CREATE TABLE IF NOT EXISTS survey_submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  label TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '愿你在选择中保持诚实，也保留温柔。',
  gender TEXT NOT NULL DEFAULT '不愿透露'
);

CREATE INDEX IF NOT EXISTS survey_submissions_created_at
  ON survey_submissions(created_at DESC);

-- Version 2 uses stable question IDs and typed answer states. Keep v1 untouched.
CREATE TABLE IF NOT EXISTS survey_submissions_v2 (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1))
);
CREATE INDEX IF NOT EXISTS survey_submissions_v2_public_date
  ON survey_submissions_v2(published, created_at DESC);
