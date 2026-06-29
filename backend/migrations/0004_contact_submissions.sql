-- ============================================================================
-- 0004_contact_submissions.sql
--
-- Public contact-form submissions. Visible only to the super admin.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS contact_submissions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(160)  NOT NULL,
    email       VARCHAR(255)  NOT NULL,
    phone       VARCHAR(60),
    subject     VARCHAR(255),
    message     TEXT          NOT NULL,
    source_url  VARCHAR(500),
    user_ip     VARCHAR(64),
    user_agent  VARCHAR(500),
    is_read     BOOLEAN       NOT NULL DEFAULT FALSE,
    handled_at  TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
    ON contact_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read
    ON contact_submissions (is_read);

COMMIT;
