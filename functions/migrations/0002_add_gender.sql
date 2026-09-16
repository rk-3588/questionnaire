-- Existing D1 deployments: add the optional profile gender field.
ALTER TABLE survey_submissions
ADD COLUMN gender TEXT NOT NULL DEFAULT '不愿透露';
