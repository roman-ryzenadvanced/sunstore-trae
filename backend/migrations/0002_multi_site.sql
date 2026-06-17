-- ============================================================================
-- 0002_multi_site.sql
-- Multi-site deployment extension.
-- Allows a central super-admin to create, manage, and deploy many storefronts.
-- Each site has its own admin users, products, and orders.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ENUM: site lifecycle status
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'site_status') THEN
        CREATE TYPE site_status AS ENUM (
            'PROVISIONING',   -- being created from a template
            'READY',          -- live, accepting traffic
            'SUSPENDED',      -- temporarily disabled
            'ARCHIVED'        -- soft-deleted
        );
    END IF;
END$$;

-- ---------------------------------------------------------------------------
-- sites: one row per storefront
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
    id                SERIAL PRIMARY KEY,
    slug              VARCHAR(80) UNIQUE NOT NULL,
    name              VARCHAR(255) NOT NULL,
    niche             VARCHAR(120) NOT NULL,
    template_id       VARCHAR(80)  NOT NULL,
    status            site_status  NOT NULL DEFAULT 'PROVISIONING',
    custom_domain     VARCHAR(255),
    primary_color     VARCHAR(20),
    logo_mark         VARCHAR(20),
    tagline           VARCHAR(255),
    description       TEXT,
    settings          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    launched_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sites_slug    ON sites (slug);
CREATE INDEX IF NOT EXISTS idx_sites_status  ON sites (status);
CREATE INDEX IF NOT EXISTS idx_sites_niche   ON sites (niche);

DROP TRIGGER IF EXISTS sites_set_updated_at ON sites;
CREATE TRIGGER sites_set_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- site_admins: per-site admin users
-- One user can admin multiple sites; per-site role + isolated password.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_admins (
    id              SERIAL PRIMARY KEY,
    site_id         INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    username        VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'manager', -- 'owner' | 'manager' | 'viewer'
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (site_id, username)
);

CREATE INDEX IF NOT EXISTS idx_site_admins_site ON site_admins (site_id);

-- ---------------------------------------------------------------------------
-- super_admins: central platform admins (can create sites, manage all)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS super_admins (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- site_products: per-site product catalog (no longer global)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_products (
    id                  SERIAL PRIMARY KEY,
    site_id             INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    slug                VARCHAR(255) NOT NULL,
    title_ru            VARCHAR(255) NOT NULL,
    description_ru      TEXT         NOT NULL DEFAULT '',
    price_kopecks       BIGINT       NOT NULL CHECK (price_kopecks >= 0),
    sku                 VARCHAR(100) NOT NULL,
    stock_quantity      INTEGER      NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    images              TEXT[]       NOT NULL DEFAULT '{}',
    category            VARCHAR(120) NOT NULL DEFAULT 'general',
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (site_id, slug),
    UNIQUE (site_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_site_products_site    ON site_products (site_id);
CREATE INDEX IF NOT EXISTS idx_site_products_active ON site_products (site_id, is_active);

DROP TRIGGER IF EXISTS site_products_set_updated_at ON site_products;
CREATE TRIGGER site_products_set_updated_at
    BEFORE UPDATE ON site_products
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- site_orders: per-site orders + T-Bank linkage
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_orders (
    id                       SERIAL PRIMARY KEY,
    site_id                  INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    tbank_order_id           VARCHAR(100) UNIQUE NOT NULL,
    tbank_payment_id         VARCHAR(100),
    customer_name            VARCHAR(255) NOT NULL,
    customer_email           VARCHAR(255) NOT NULL,
    customer_phone           VARCHAR(50)  NOT NULL,
    total_amount_kopecks     BIGINT       NOT NULL CHECK (total_amount_kopecks >= 0),
    status                   order_status NOT NULL DEFAULT 'NEW',
    raw_tbank_response       JSONB,
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_orders_site   ON site_orders (site_id);
CREATE INDEX IF NOT EXISTS idx_site_orders_status ON site_orders (status);

DROP TRIGGER IF EXISTS site_orders_set_updated_at ON site_orders;
CREATE TRIGGER site_orders_set_updated_at
    BEFORE UPDATE ON site_orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- site_order_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_order_items (
    id                          SERIAL PRIMARY KEY,
    order_id                    INTEGER NOT NULL REFERENCES site_orders(id) ON DELETE CASCADE,
    product_id                  INTEGER REFERENCES site_products(id) ON DELETE SET NULL,
    quantity                    INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase_kopecks   BIGINT  NOT NULL CHECK (price_at_purchase_kopecks >= 0)
);

CREATE INDEX IF NOT EXISTS idx_site_order_items_order ON site_order_items (order_id);

COMMIT;
