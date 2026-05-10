@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Deploying DEI Cloud Backend
echo ========================================
echo.

set SSH_KEY=C:\Users\%USERNAME%\.ssh\cloud.pem
set REMOTE_USER=root
set REMOTE_HOST=cloud.dei.isep.ipp.pt
set REMOTE_PORT=922
set REMOTE_PATH=/opt/dei-backend
set LOCAL_PATH=C:\Users\%USERNAME%\OneDrive\Desktop\LEI-PROJ\projeto\Backend

echo 1. Checking VPN connection...
ping -n 1 %REMOTE_HOST% > nul
if errorlevel 1 (
    echo [ERROR] Cannot reach %REMOTE_HOST%
    echo Please connect to DEI VPN first!
    pause
    exit /b 1
)
echo [OK] VPN connected!
echo.

echo 2. Creating directories on server...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "mkdir -p %REMOTE_PATH%"
echo [OK] Directory ready
echo.

echo 3. Uploading files...
cd %LOCAL_PATH%
echo Uploading src folder...
scp -i %SSH_KEY% -P %REMOTE_PORT% -r src %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%/
echo Uploading root files...
scp -i %SSH_KEY% -P %REMOTE_PORT% *.js *.json %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%/
echo [OK] Files uploaded
echo.

echo 4. Installing dependencies on server...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_PATH% && npm install --production"
echo [OK] Dependencies installed
echo.

echo 5. Creating .env file (line by line)...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'PORT=3000' > %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'NODE_ENV=development' >> %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'BASE_FOLDER=/vs_cloud' >> %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'LDAP_URL=ldap://192.168.62.4' >> %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'LDAP_BASE_DN=ou=users,dc=dei,dc=isep,dc=ipp,dc=pt' >> %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'LDAP_USER_ATTR=uid' >> %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'JWT_SECRET=dei-cloud-secret-key-2026' >> %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'JWT_EXPIRES_IN=8h' >> %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'CORS_ORIGIN=http://localhost:4200,http://127.0.0.1:4200,http://cloud.dei.isep.ipp.pt' >> %REMOTE_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'LOG_LEVEL=info' >> %REMOTE_PATH%/.env"
echo [OK] .env created
echo.

echo 6. Verifying .env content...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "cat %REMOTE_PATH%/.env"
echo.

echo 7. Stopping old process...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "pm2 stop dei-backend 2>/dev/null; pkill -f 'node server.js' 2>/dev/null; echo 'Old process stopped'"
echo.

echo 8. Installing PM2 (if needed)...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "npm install -g pm2 2>/dev/null"
echo.

echo 9. Starting backend with PM2...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_PATH% && pm2 start server.js --name dei-backend && pm2 save"
echo.

echo 10. Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak > nul
echo.

echo 11. Testing API...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "curl -s http://localhost:3000/health"
echo.

echo 12. Checking PM2 status...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "pm2 status"
echo.

echo ========================================
echo Deploy completed!
echo ========================================
echo.
echo If you see {"status":"OK",...} the backend is running!
echo.
echo To view logs: ssh -i %SSH_KEY% -p %REMOTE_PORT% root@%REMOTE_HOST% "pm2 logs dei-backend"
echo.
pause