#!/bin/bash
set -e

echo "================================================"
echo "  PivotHire — EC2 Deployment Script"
echo "================================================"

# ── 1. Install Docker if not present ─────────────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose-v2
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. You may need to log out and back in for group changes."
fi

# ── 2. Set up production .env ─────────────────────────────────────────────────
if [ ! -f backend/.env ]; then
    echo ""
    echo "🔧 Setting up production environment..."

    # Get the EC2 public IP
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
    echo "   Detected public IP: $PUBLIC_IP"

    # Generate a random secret key
    SECRET_KEY=$(openssl rand -hex 32)

    # Generate a random DB password
    DB_PASSWORD=$(openssl rand -hex 16)

    # Copy and configure .env
    cp backend/.env.production backend/.env
    sed -i "s/CHANGE_THIS_TO_A_RANDOM_SECRET/$SECRET_KEY/" backend/.env
    sed -i "s/CHANGE_THIS_DB_PASSWORD/$DB_PASSWORD/" backend/.env
    sed -i "s/YOUR_EC2_PUBLIC_IP/$PUBLIC_IP/g" backend/.env

    # Export DB password for docker-compose
    echo "DB_PASSWORD=$DB_PASSWORD" > .env

    echo "✅ Environment configured"
    echo "   Edit backend/.env to add your Razorpay/SendGrid keys if needed"
else
    echo "⏭️  backend/.env already exists, skipping setup"
    # Ensure .env exists for docker-compose DB_PASSWORD
    if [ ! -f .env ]; then
        echo "DB_PASSWORD=postgres" > .env
    fi
fi

# ── 3. Build and start ───────────────────────────────────────────────────────
echo ""
echo "🏗️  Building and starting services..."
docker compose -f docker-compose.prod.yml up -d --build

# ── 4. Wait for DB to be ready ───────────────────────────────────────────────
echo ""
echo "⏳ Waiting for database..."
sleep 10

# ── 5. Seed demo data (optional) ─────────────────────────────────────────────
echo ""
read -p "🌱 Seed demo data? (y/n): " SEED
if [ "$SEED" = "y" ] || [ "$SEED" = "Y" ]; then
    docker compose -f docker-compose.prod.yml exec backend python seed.py
fi

# ── 6. Done! ──────────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
echo ""
echo "================================================"
echo "  ✅ PivotHire is live!"
echo "================================================"
echo ""
echo "  🌐 App:      http://$PUBLIC_IP"
echo "  📡 API docs: http://$PUBLIC_IP/api/docs"
echo ""
echo "  Useful commands:"
echo "    docker compose -f docker-compose.prod.yml logs -f"
echo "    docker compose -f docker-compose.prod.yml restart"
echo "    docker compose -f docker-compose.prod.yml down"
echo ""
