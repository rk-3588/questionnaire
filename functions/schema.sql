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
