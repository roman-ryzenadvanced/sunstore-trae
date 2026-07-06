# 🚀 SunStore v2 — VPS Deployment Guide

## Quick Deploy (One Command)

Run this from **your local terminal** (Git Bash, PowerShell, or Terminal):

```bash
# One-liner: Download and run deployment
curl -fsSL https://raw.githubusercontent.com/roman-ryzenadvanced/sunstore/main/deploy-vps.sh | GITHUB_TOKEN=$GITHUB_TOKEN bash -s
```

Or with SSH directly:

```bash
GITHUB_TOKEN=$GITHUB_TOKEN ssh root@167.233.19.201 "bash -s" < <(curl -fsSL https://raw.githubusercontent.com/roman-ryzenadvanced/sunstore/main/deploy-vps.sh)
```

---

## Manual Step-by-Step

### 1. SSH into VPS
```bash
ssh root@167.233.19.201
Password: sbXwxdXbbp7vfxdsJxHL
```

### 2. Run Deployment Script
```bash
# Set token and download+execute
export GITHUB_TOKEN="your-github-token-here"
curl -fsSL https://raw.githubusercontent.com/roman-ryzenadvanced/sunstore/main/deploy-vps.sh | bash
```

---

## What the Script Does

| Step | Action |
|------|--------|
| ✅ | Checks root permissions |
| ✅ | Installs Bun runtime (if needed) |
| ✅ | Backs up existing `/app/sunstore` |
| ✅ | Stops old processes |
| ✅ | Clones v2 from GitHub |
| ✅ | Runs `bun install` |
| ✅ | Builds Next.js app |
| ✅ | Assembles production package |
| ✅ | Configures nginx proxy (port 80 → 3000) |
| ✅ | Creates systemd service |
| ✅ | Starts SunStore service |
| ✅ | Verifies deployment |

---

## After Deployment

| Item | Value |
|------|-------|
| **URL** | `http://167.233.19.201/` |
| **Login** | `admin` / `changeme123` |
| **API Health** | `curl http://167.233.19.201/api` → "Hello, world!" |
| **Dashboard** | `http://167.233.19.201/` (root) |
| **Logs** | `journalctl -u sunstore -f` |
| **Restart** | `systemctl restart sunstore` |

---

## Files Created

| File | Purpose |
|------|---------|
| `deploy-vps.sh` | Main deployment script |
| `sunstore-nginx.conf` | Nginx site configuration |
| `sunstore.service` | Systemd service unit |

---

## What Changes

| Before (v1) | After (v2) |
|-------------|------------|
| Go backend + PostgreSQL | Pure Next.js + SQLite |
| Russian storefront | English SunStore admin |
| Login at `/central/login` | Login at root `/` |
| Go binary | Bun runtime |
| Unknown process mgmt | systemd service |

---

## Troubleshooting

### SSH Connection Issues
```bash
# Test connectivity
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@167.233.19.201 "echo connected"

# Use password
ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no root@167.233.19.201
```

### Deployment Fails
```bash
# Check logs
journalctl -u sunstore -n 50 --no-pager

# Manual restart
systemctl restart sunstore
systemctl status sunstore

# Test port 3000 directly
curl http://127.0.0.1:3000/api
```

### Revert to Backup
```bash
# Stop service
systemctl stop sunstore

# Restore backup
rm -rf /app/sunstore
cp -a /app/sunstore-backup-$(date +%Y%m%d-%H%M%S) /app/sunstore

# Restart
systemctl start sunstore
```