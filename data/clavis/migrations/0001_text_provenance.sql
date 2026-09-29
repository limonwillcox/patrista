-- Existing databases only. A database created from the current schema.sql
-- already has these columns. Do not run this file against that database.
-- import, pack, and attach skip an ADD COLUMN that already exists and record
-- this file's name in schema_migrations.

ALTER TABLE work_texts ADD COLUMN translator TEXT;
ALTER TABLE work_texts ADD COLUMN edition TEXT;
ALTER TABLE work_texts ADD COLUMN edition_year INTEGER;
ALTER TABLE work_texts ADD COLUMN source_url TEXT;
ALTER TABLE work_texts ADD COLUMN license TEXT;
ALTER TABLE work_texts ADD COLUMN quality TEXT NOT NULL DEFAULT 'needs-cleanup' CHECK (quality IN ('ocr-raw', 'needs-cleanup', 'partial', 'clean', 'verified'));
