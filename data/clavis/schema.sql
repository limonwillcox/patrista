-- Clavis mirror for Patrista.
-- D1 stores these rows only. Text bodies are not columns here.
-- R2 key: clavis/texts/{work_id}/{language}.txt
-- Local mirror: data/clavis/bodies/{work_id}/{language}.txt
-- Import is read-only against Clavis scrape sources. This file is the mirror.
-- Existing databases take new columns from data/clavis/migrations, not from here.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authors (
  author_id TEXT PRIMARY KEY,
  name_latin TEXT NOT NULL,
  detail_url TEXT,
  letter_bucket TEXT NOT NULL,
  imported_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS works (
  work_id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES authors(author_id),
  parent_work_id TEXT REFERENCES works(work_id),
  title_latin TEXT NOT NULL,
  title_designated TEXT,
  clavis_codes TEXT NOT NULL,
  path_json TEXT NOT NULL,
  detail_url TEXT,
  kind TEXT NOT NULL,
  imported_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS work_texts (
  work_id TEXT NOT NULL REFERENCES works(work_id),
  language TEXT NOT NULL CHECK (language IN ('english', 'original')),
  title TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready')),
  r2_key TEXT,
  source_path TEXT,
  content_sha256 TEXT,
  byte_size INTEGER,
  updated_at TEXT,
  translator TEXT,
  edition TEXT,
  edition_year INTEGER,
  source_url TEXT,
  license TEXT,
  quality TEXT NOT NULL DEFAULT 'needs-cleanup' CHECK (quality IN ('ocr-raw', 'needs-cleanup', 'partial', 'clean', 'verified')),
  PRIMARY KEY (work_id, language)
);

CREATE INDEX IF NOT EXISTS idx_authors_letter_bucket ON authors(letter_bucket, name_latin);
CREATE INDEX IF NOT EXISTS idx_works_author ON works(author_id);
CREATE INDEX IF NOT EXISTS idx_works_parent ON works(parent_work_id);
CREATE INDEX IF NOT EXISTS idx_work_texts_language_status ON work_texts(language, status);
