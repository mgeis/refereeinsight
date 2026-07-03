#!/usr/bin/env bash
# EC2 deployment script — run on the EC2 instance after first-time setup.
# First-time setup:
#   sudo yum install -y git nodejs npm nginx
#   sudo npm install -g pm2
#   pm2 startup  # follow the printed command to enable pm2 on boot
#   sudo cp /home/ec2-user/app/scripts/nginx.conf /etc/nginx/conf.d/referee-insight.conf
#   sudo systemctl enable nginx && sudo systemctl start nginx

set -euo pipefail

APP_DIR="/home/ec2-user/app"
LOG_DIR="/home/ec2-user/logs"

mkdir -p "$LOG_DIR"

echo "==> Pulling latest code..."
cd "$APP_DIR"
git pull origin main

echo "==> Installing dependencies..."
npm ci --omit=dev

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Building..."
npm run build

echo "==> Restarting app..."
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "==> Saving PM2 process list..."
pm2 save

echo "==> Done. App running on port 3000."
