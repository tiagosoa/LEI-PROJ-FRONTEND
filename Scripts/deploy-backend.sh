#!/bin/bash
set -e

SERVER_HOST="$1"
SERVER_PORT="$2"
SERVER_USER="$3"
BACKEND_PATH="$4"

echo "=== Deploying Backend ==="

# Criar pasta no servidor se não existir
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "mkdir -p $BACKEND_PATH"

# Copiar backend (excluindo node_modules e .env)
rsync -avz -e "ssh -p $SERVER_PORT" \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude '.git' \
    ./Backend/ $SERVER_USER@$SERVER_HOST:$BACKEND_PATH/

# Executar comandos remotos
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << ENDSSH
    cd $BACKEND_PATH
    

echo "Installing dependencies..."
npm ci --production
    
    # Criar .env se não existir
    if [ ! -f .env ]; then
        echo "Creating .env file..."
        cat > .env << 'EOF'
        PORT=3000
        NODE_ENV=production
        BASE_FOLDER=/vs_cloud
        LDAP_URL=ldap://192.168.62.4
        LDAP_BASE_DN=ou=users,dc=dei,dc=isep,dc=ipp,dc=pt
        LDAP_USER_ATTR=uid
        JWT_SECRET=production-secret-key-$(openssl rand -hex 32)
        JWT_EXPIRES_IN=8h
        CORS_ORIGIN=http://cloud.dei.isep.ipp.pt,https://cloud.dei.isep.ipp.pt
        EOF
    fi
    
    # Reiniciar com PM2
    echo "Restarting PM2 process..."
    pm2 stop dei-backend 2>/dev/null || true
    pm2 start server.js --name dei-backend
    pm2 save
    pm2 startup 2>/dev/null || true
    
    echo "Backend deployed successfully!"
ENDSSH