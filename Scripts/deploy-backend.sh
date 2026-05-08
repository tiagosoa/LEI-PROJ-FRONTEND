#!/bin/bash

BACKEND_DIR="/opt/dei-backend"
LOG_FILE="/var/log/dei-backend.log"

echo "[$(date)] Starting deployment..." | tee -a $LOG_FILE

cd $BACKEND_DIR || exit 1

echo "[$(date)] Installing dependencies..." | tee -a $LOG_FILE
npm install --production >> $LOG_FILE 2>&1

echo "[$(date)] Setting up environment..." | tee -a $LOG_FILE
if [ -f .env.production ]; then
    cp .env.production .env
fi

echo "[$(date)] Restarting application..." | tee -a $LOG_FILE
pm2 stop dei-backend >> $LOG_FILE 2>&1 || true
pm2 delete dei-backend >> $LOG_FILE 2>&1 || true
pm2 start server.js --name dei-backend >> $LOG_FILE 2>&1
pm2 save >> $LOG_FILE 2>&1

echo "[$(date)] Deployment completed!" | tee -a $LOG_FILE