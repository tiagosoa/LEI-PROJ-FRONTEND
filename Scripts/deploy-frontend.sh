#!/bin/bash
set -e

SERVER_HOST="$1"
SERVER_PORT="$2"
SERVER_USER="$3"
FRONTEND_PATH="$4"

echo "=== Deploying Frontend ==="

cd Frontend

# Configurar API URL para produção
echo "Configuring production API URL..."
sed -i 's|private apiUrl = .*|private apiUrl = "https://cloud.dei.isep.ipp.pt/api";|' \
    src/app/services/auth.service.ts
sed -i 's|private apiUrl = .*|private apiUrl = "https://cloud.dei.isep.ipp.pt/api";|' \
    src/app/services/vs.service.ts 2>/dev/null || true

echo "Installing frontend dependencies..."
npm ci

# Build de produção
echo "Building frontend..."
npm run build -- --configuration production

ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "mkdir -p $FRONTEND_PATH"

echo "Copying frontend files..."
rsync -avz -e "ssh -p $SERVER_PORT" \
    ./dist/frontend/browser/ $SERVER_USER@$SERVER_HOST:$FRONTEND_PATH/

ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "chown -R www-data:www-data $FRONTEND_PATH"

echo "Frontend deployed successfully!"