#!/bin/bash

# Script to deploy backend on cloud.dei.isep.ipp.pt
# This script is called by GitHub Actions via SSH

BACKEND_DIR="/opt/dei-backend"
LOG_FILE="/var/log/dei-backend-deploy.log"

echo "=========================================" >> $LOG_FILE
echo "Deploy started at $(date)" >> $LOG_FILE
echo "=========================================" >> $LOG_FILE

# Navigate to backend directory
cd $BACKEND_DIR || exit 1

# Install dependencies
echo "Installing dependencies..." >> $LOG_FILE
npm install --production >> $LOG_FILE 2>&1

# Copy production environment file
if [ -f .env.production ]; then
    cp .env.production .env
    echo "Production environment file copied" >> $LOG_FILE
fi

# Stop existing PM2 process (if running)
pm2 stop dei-backend >> $LOG_FILE 2>&1 || echo "No existing process found" >> $LOG_FILE

# Start or restart the application
pm2 start server.js --name dei-backend >> $LOG_FILE 2>&1
pm2 save >> $LOG_FILE 2>&1

# Verify process is running
pm2 list >> $LOG_FILE

echo "Deploy completed at $(date)" >> $LOG_FILE
echo "" >> $LOG_FILE

exit 0