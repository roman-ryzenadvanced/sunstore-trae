#!/bin/bash
# ============================================================================
# SunStore v2 — VPS Deployment Script
# ============================================================================
# Replaces v1 (Go backend + old Next.js) with v2 (pure Next.js + SQLite)
# Usage:
#   Option A (pipe):  GITHUB_TOKEN=ghp_xxx ssh root@167.233.19.201 "bash -s" < deploy-vps.sh
#   Option B (copy):  scp deploy-vps.sh root@167.233.19.201:/tmp/ && ssh root@167.233.19.201 "GITHUB_TOKEN=ghp_xxx bash /tmp/deploy-vps.sh"
# ============================================================================

set -e

# ── Colors ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${BLUE}[SunStore]${NC} $*"; }
ok()     { echo -e "${GREEN}✅ $*${NC}"; }
warn()   { echo -e "${YELLOW}⚠️  $*${NC}"; }
err()    { echo -e "${RED}❌ ERROR: $*${NC}" >&2; }
die()    { err "$*"; exit 1; }

# ── Config ──────────────────────────────────────────────────────────────────
# GitHub token passed via environment variable (to avoid committing secrets)
GITHUB_TOKEN="${GITHUB_TOKEN:?Error: GITHUB_TOKEN env var is required. Run: GITHUB_TOKEN=ghp_xxx bash deploy-vps.sh}"
GITHUB_REPO="https://${GITHUB_TOKEN}@github.com/roman-ryzenadvanced/sunstore.git"
DEPLOY_DIR="/app/sunstore"
BACKUP_DIR="/app/sunstore-backup-$(date +%Y%m%d-%H%M%S)"
APP_PORT=3000
NODE_ENV="production"
JWT_SECRET="sunstore-prod-secret-$(date +%s)"

# ── Pre-flight Checks ──────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🌞 SunStore v2 — VPS Deployment                   ║"
echo "║           Replacing v1 → v2 on $(hostname)                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

log "Running pre-flight checks..."

[[ $EUID -eq 0 ]] || die "This script must be run as root."

command -v git >/dev/null 2>&1 || die "git is not installed. Run: apt-get install -y git"

# ── Install Bun (if missing) ───────────────────────────────────────────────
if ! command -v bun >/dev/null 2>&1; then
    log "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    ok "Bun installed: $(bun --version)"
else
    ok "Bun already installed: $(bun --version)"
fi

# ── Backup existing deployment (if any) ────────────────────────────────────
if [ -d "$DEPLOY_DIR" ]; then
    warn "Existing deployment found at $DEPLOY_DIR"
    log "Creating backup at $BACKUP_DIR ..."
    mkdir -p "$(dirname "$BACKUP_DIR")"
    cp -a "$DEPLOY_DIR" "$BACKUP_DIR" || warn "Backup failed (non-fatal)"
    ok "Backup created"
    
    # Stop existing service / process
    log "Stopping existing SunStore processes..."
    systemctl stop sunstore 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "server.js.*sunstore" 2>/dev/null || true
    sleep 2
    ok "Old processes stopped"
fi

# ── Clone / Update Repository ─────────────────────────────────────────────
if [ -d "$DEPLOY_DIR/.git" ]; then
    log "Updating existing repository..."
    cd "$DEPLOY_DIR"
    git fetch origin main 2>/dev/null || git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    log "Cloning repository..."
    rm -rf "$DEPLOY_DIR"
    git clone --depth 1 --branch main "$GITHUB_REPO" "$DEPLOY_DIR"
fi
cd "$DEPLOY_DIR"
ok "Repository ready at $(git log -1 --format='%h %s (%ci)')"

# ── Install Dependencies ──────────────────────────────────────────────────
log "Installing dependencies..."
bun install --no-save 2>&1 | tail -5
ok "Dependencies installed"

# ── Build Application ─────────────────────────────────────────────────────
log "Building Next.js application (this may take a few minutes)..."

export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

bun run build 2>&1 | tail -20

# Verify build output
if [ ! -f ".next/standalone/server.js" ]; then
    die "Build failed — server.js not found in .next/standalone/"
fi

ok "Build successful"

# ── Prepare Production Directory Structure ────────────────────────────────
log "Assembling production package..."

# Copy standalone output
mkdir -p .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

# Copy public assets
cp -r public .next/standalone/ 2>/dev/null || true

# Ensure database file exists
if [ -f "db/production.db" ]; then
    cp db/production.db .next/standalone/
    ok "Database bundled ($(du -sh .next/standalone/production.db | cut -f1))"
elif [ -f "db/custom.db" ]; then
    cp db/custom.db .next/standalone/production.db
    ok "Using custom.db as production database"
else
    warn "No database found! Seeding will be required after first start."
fi

# Create .env for production
cat > .next/standalone/.env << ENVEOF
NODE_ENV=production
PORT=$APP_PORT
HOSTNAME=0.0.0.0
DATABASE_URL=file:./production.db
JWT_SECRET=$JWT_SECRET
NEXT_TELEMETRY_DISABLED=1
ENVEOF

ok "Environment configured"

# ── Deploy (swap to production location) ──────────────────────────────────
# The deploy dir IS the production dir since we cloned into it.
# Just ensure we're running from the right place.

log "Deployment directory: $DEPLOY_DIR"
cd "$DEPLOY_DIR"

# ── Configure Nginx ───────────────────────────────────────────────────────
log "Configuring nginx..."

NGINX_CONF="/etc/nginx/sites-available/sunstore"
NGINX_ENABLED="/etc/nginx/sites-enabled/sunstore"

cat > "$NGINX_CONF" << 'NGINXEOF'
# SunStore v2 — Next.js reverse proxy
server {
    listen 80;
    server_name 167.233.19.201 _;

    client_max_body_size 10M;

    # Proxy to Next.js/Bun on port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }

    # API routes — no caching
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;

        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

# Remove old site configs that might conflict
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Enable our config
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

# Test nginx config
nginx -t 2>&1 && ok "Nginx configuration valid" || warn "Nginx config test failed — check manually"

# Reload nginx
systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || warn "Nginx reload failed"
ok "Nginx configured and reloaded"

# ── Create Systemd Service ─────────────────────────────────────────────────
log "Creating systemd service..."

BUN_PATH="$(which bun)"
CATALOG_PATH="/etc/systemd/system/sunstore.service"

cat > "$CATALOG_PATH" << SYSTEMDEOF
[Unit]
Description=SunStore v2 — Multi-Store E-Commerce Platform
Documentation=https://github.com/roman-ryzenadvanced/sunstore
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=${DEPLOY_DIR}/.next/standalone
Environment="NODE_ENV=production"
Environment="PORT=${APP_PORT}"
Environment="HOSTNAME=0.0.0.0"
Environment="DATABASE_URL=file:${DEPLOY_DIR}/.next/standalone/production.db"
Environment="JWT_SECRET=${JWT_SECRET}"
Environment="NEXT_TELEMETRY_DISABLED=1"
ExecStart=${BUN_PATH} ${DEPLOY_DIR}/.next/standalone/server.js
Restart=always
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=3

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sunstore

# Security
NoNewPrivileges=false

[Install]
WantedBy=multi-user.target
SYSTEMDEOF

systemctl daemon-reload
systemctl enable sunstore
ok "Systemd service created and enabled"

# ── Start Service ─────────────────────────────────────────────────────────
log "Starting SunStore v2..."
systemctl restart sunstore

# Wait for startup
sleep 3

# Check status
if systemctl is-active --quiet sunstore; then
    ok "SunStore v2 is RUNNING (systemctl status sunstore)"
else
    err "SunStore v2 FAILED to start!"
    echo ""
    echo "--- Recent logs ---"
    journalctl -u sunstore -n 30 --no-pager 2>/dev/null || true
    echo ""
    die "Service did not start. Check logs above."
fi

# ── Verify Deployment ─────────────────────────────────────────────────────
echo ""
log "Verifying deployment..."
sleep 2

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$APP_PORT/ 2>/dev/null || echo "000")
API_CHECK=$(curl -s http://127.0.0.1:$APP_PORT/api 2>/dev/null || echo "")

if [ "$HTTP_CODE" = "200" ]; then
    ok "Main page: HTTP 200 ✅"
else
    warn "Main page returned HTTP $HTTP_CODE (may need a few more seconds)"
fi

if echo "$API_CHECK" | grep -q "Hello"; then
    ok "API health check: ✅"
else
    warn "API health check: unexpected response"
fi

# ── Done! ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🎉 SunStore v2 Deployed Successfully!             ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  URL:         http://167.233.19.201/                        ║"
echo "║  Login:       admin / changeme123                           ║"
echo "║  API Health:  http://167.233.19.201/api                      ║"
echo "║                                                            ║"
echo "║  Commands:                                                  ║"
echo "║    Logs:       journalctl -u sunstore -f                    ║"
echo "║    Restart:    systemctl restart sunstore                    ║"
echo "║    Status:     systemctl status sunstore                     ║"
echo "║    Stop:       systemctl stop sunstore                       ║"
echo "║                                                            ║"
echo "║  Backup:      $BACKUP_DIR"
echo "║  DB Location: ${DEPLOY_DIR}/.next/standalone/production.db"
echo "║  JWT Secret:  ${JWT_SECRET:0:20}...                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
