-- ============================================================================
-- 0004_crm_domains_support_mailing.sql
--
-- Extends the platform toward a single-super-admin CRM ("WordPress-like
-- CRM + hosting for stores"):
--   1. Custom-domain + DNS lifecycle on `sites` — every store can attach a
--      real domain and receive the nameservers to configure at its registrar.
--   2. `support_tickets` — unified inbox for contact-form / support requests
--      coming from any storefront, all visible to the super admin.
--   3. `subscribers` — per-store mailing lists with subscribe/unsubscribe
--      lifecycle and broadcast support.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Custom-domain lifecycle on `sites`
--    custom_domain (VARCHAR) already exists from 0002_multi_site.sql.
--    We add the verification state machine so the CRM can show the exact
--    nameserver instructions + whether the domain is live.
-- ---------------------------------------------------------------------------
ALTER TABLE sites ADD COLUMN IF NOT EXISTS custom_domain_status VARCHAR(20) NOT NULL DEFAULT 'NONE';
-- NONE = no custom domain | PENDING = attached, waiting on DNS | ACTIVE = live | FAILED = check failed
ALTER TABLE sites ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMP WITH TIME ZONE;

-- ---------------------------------------------------------------------------
-- 2. support_tickets — unified CRM inbox
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id              SERIAL PRIMARY KEY,
    site_id         INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    subject         VARCHAR(500) NOT NULL,
    message         TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'NEW',  -- NEW | OPEN | REPLIED | CLOSED
    source          VARCHAR(20) NOT NULL DEFAULT 'contact_form', -- contact_form | support | store
    ip_address      VARCHAR(64),
    reply_subject   VARCHAR(500),
    reply_body      TEXT,
    replied_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_site   ON support_tickets (site_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets (created_at DESC);

DROP TRIGGER IF EXISTS support_tickets_set_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_set_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. subscribers — per-store mailing list
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscribers (
    id               SERIAL PRIMARY KEY,
    site_id          INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    email            VARCHAR(255) NOT NULL,
    name             VARCHAR(255),
    status           VARCHAR(20) NOT NULL DEFAULT 'SUBSCRIBED', -- SUBSCRIBED | UNSUBSCRIBED
    source           VARCHAR(40) NOT NULL DEFAULT 'footer',
    unsubscribed_at  TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (site_id, email)
);

CREATE INDEX IF NOT EXISTS idx_subscribers_site   ON subscribers (site_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers (site_id, status);

COMMIT;
