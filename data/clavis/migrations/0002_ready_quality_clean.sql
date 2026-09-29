-- Rows already published (status=ready) start at clean.
-- needs-cleanup stays the default for new rows. Only a person sets verified.

UPDATE work_texts
SET quality = 'clean'
WHERE status = 'ready' AND quality = 'needs-cleanup';
