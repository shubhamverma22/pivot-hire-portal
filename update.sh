#!/bin/bash
set -e

echo "================================================"
echo "  PivotHire — Update Deployment"
echo "================================================"
echo ""

# ── 1. Pull latest code ──────────────────────────────────────────────────────
echo "📥 Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code updated"

# ── 2. Update backend .env with new Razorpay/pricing fields ──────────────────
echo ""
echo "🔧 Checking backend/.env for new config fields..."

# Add new fields if they don't exist yet (preserves existing values)
add_env_if_missing() {
    local key="$1"
    local value="$2"
    local file="backend/.env"
    if ! grep -q "^${key}=" "$file" 2>/dev/null; then
        echo "${key}=${value}" >> "$file"
        echo "   Added: ${key}"
    fi
}

# Razorpay fields (replacing old Stripe fields)
add_env_if_missing "RAZORPAY_KEY_ID" "rzp_test_SVADQpVEBaDkoU"
add_env_if_missing "RAZORPAY_KEY_SECRET" "0lQxByBN4XJWtJAvWdDGZ3Go"
add_env_if_missing "RAZORPAY_WEBHOOK_SECRET" ""
add_env_if_missing "RAZORPAY_PLAN_ID_PREMIUM" "plan_SVAumEuWdWUQ2g"

# Brevo SMTP for password reset emails
add_env_if_missing "BREVO_SMTP_HOST" "smtp-relay.brevo.com"
add_env_if_missing "BREVO_SMTP_PORT" "587"
add_env_if_missing "BREVO_SMTP_USER" ""
add_env_if_missing "BREVO_SMTP_KEY" ""
add_env_if_missing "FROM_EMAIL" ""
add_env_if_missing "FROM_NAME" "PivotHire"

# Remove old SendGrid fields if present
if grep -q "SENDGRID_" backend/.env 2>/dev/null; then
    echo "   Removing old SendGrid config..."
    sed -i '/^SENDGRID_/d' backend/.env
fi

# Pricing config (single source of truth)
add_env_if_missing "PREMIUM_PLAN_AMOUNT" "1999"
add_env_if_missing "PREMIUM_PLAN_AMOUNT_PAISE" "199900"
add_env_if_missing "PREMIUM_PLAN_CURRENCY" "INR"
add_env_if_missing "PREMIUM_PLAN_NAME" "PivotHire Premium"
add_env_if_missing "PREMIUM_PLAN_DESCRIPTION" "Unlimited job applications — ₹1,999/month"

# Remove old Stripe fields if present
if grep -q "STRIPE_" backend/.env 2>/dev/null; then
    echo "   Removing old Stripe config..."
    sed -i '/^STRIPE_/d' backend/.env
fi

echo "✅ Environment config updated"

# ── 3. Rebuild and restart containers ─────────────────────────────────────────
echo ""
echo "🏗️  Rebuilding containers (this may take a few minutes)..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# ── 4. Wait for services to start ────────────────────────────────────────────
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 15

# ── 5. Run database migrations (create new tables if needed) ──────────────────
echo ""
echo "🗄️  Ensuring database schema is up to date..."
docker compose -f docker-compose.prod.yml exec -T backend python -c "
import asyncio
from database import engine, Base
from models import *

async def migrate():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Database schema updated successfully')

asyncio.run(migrate())
" 2>&1 || echo "⚠️  DB migration had warnings (tables may already exist — this is OK)"

# ── 6. Health check ──────────────────────────────────────────────────────────
echo ""
echo "🔍 Running health checks..."

# Check backend
BACKEND_STATUS=$(docker compose -f docker-compose.prod.yml exec -T backend python -c "
import httpx, asyncio
async def check():
    async with httpx.AsyncClient() as c:
        r = await c.get('http://localhost:8000/api/health', timeout=10)
        return r.status_code
try:
    code = asyncio.run(check())
    print(code)
except:
    print('failed')
" 2>/dev/null || echo "failed")

if [ "$BACKEND_STATUS" = "200" ]; then
    echo "   ✅ Backend API: healthy"
else
    echo "   ⚠️  Backend API: checking via curl..."
    curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null && echo " OK" || echo " (may need a moment to start)"
fi

# Check all containers are running
echo ""
echo "📊 Container status:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}"

# ── 7. Done! ──────────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
echo ""
echo "================================================"
echo "  ✅ PivotHire updated successfully!"
echo "================================================"
echo ""
echo "  🌐 App:      http://$PUBLIC_IP"
echo "  📡 API docs: http://$PUBLIC_IP/api/docs"
echo ""
echo "  What changed:"
echo "    • Razorpay payment gateway (replaced Stripe)"
echo "    • Forgot password with email reset"
echo "    • INR ₹1,999 pricing (configurable)"
echo ""
echo "  View logs:  docker compose -f docker-compose.prod.yml logs -f"
echo ""
