-- ============================================================================
-- 0001_init.sql
-- Initial schema for the Sun.store-style e-commerce platform.
-- All monetary values are stored as BIGINT Kopecks (1 RUB = 100 Kopecks).
-- Idempotent where possible; uses IF NOT EXISTS / DO blocks for safety.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ENUM: order lifecycle states mirrored from the T-Bank payment flow
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'NEW',         -- Created locally, not yet sent to T-Bank
            'PENDING',     -- Sent to T-Bank, awaiting customer action
            'AUTHORIZED',  -- Funds reserved (two-stage flow)
            'CONFIRMED',   -- Funds captured (succeeded)
            'REJECTED',    -- Declined or cancelled
            'REFUNDED'     -- Money returned to customer
        );
    END IF;
END$$;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(255) UNIQUE NOT NULL,
    name_ru     VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- products
-- price_kopecks: monetary amount in the smallest unit (Kopecks)
-- images:        array of CDN/object-storage URLs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id                      SERIAL PRIMARY KEY,
    category_id             INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    slug                    VARCHAR(255) UNIQUE NOT NULL,
    title_ru                VARCHAR(255) NOT NULL,
    description_ru          TEXT         NOT NULL DEFAULT '',
    price_kopecks           BIGINT       NOT NULL CHECK (price_kopecks >= 0),
    sku                     VARCHAR(100) UNIQUE NOT NULL,
    stock_quantity          INTEGER      NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    images                  TEXT[]       NOT NULL DEFAULT '{}',
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_slug        ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category    ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_price       ON products (price_kopecks);

-- Auto-bump updated_at on every UPDATE
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- tbank_order_id / tbank_payment_id: identifiers returned by the T-Bank API
-- raw_tbank_response: full JSON response preserved for audit / debugging
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                       SERIAL PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_orders_tbank_id      ON orders (tbank_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON orders (created_at DESC);

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items — line items, captured at the time of purchase
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id                          SERIAL PRIMARY KEY,
    order_id                    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id                  INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity                    INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase_kopecks   BIGINT  NOT NULL CHECK (price_at_purchase_kopecks >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- ---------------------------------------------------------------------------
-- admin_users — for the Admin Portal authentication
-- password_hash stores bcrypt hashes (cost >= 12)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
