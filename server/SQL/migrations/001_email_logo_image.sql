-- Migration: Replace text/emoji logo with image placeholder in email templates
-- If the logo still doesn't show in emails, the DB likely has OLD HTML (no {{logoUrl}}).
-- Run this migration, OR re-run the full insert_email_templates.sql against your DB.

-- Replace <h1>⚡ Mana Chain</h1> with <img src="{{logoUrl}}" ...>
UPDATE email_template
SET html_content = REPLACE(
  html_content,
  '<h1>⚡ Mana Chain</h1>',
  '<img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />'
)
WHERE html_content LIKE '%<h1>⚡ Mana Chain</h1>%';

-- Replace <h1>Mana Chain</h1> (password_changed template)
UPDATE email_template
SET html_content = REPLACE(
  html_content,
  '<h1>Mana Chain</h1>',
  '<img src="{{logoUrl}}" alt="Mana Chain" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />'
)
WHERE html_content LIKE '%<h1>Mana Chain</h1>%';

-- After running this, re-send an email to test. If the DB still had old content,
-- the templates now have <img src="{{logoUrl}}" ...> and logoUrl is replaced at send time.
