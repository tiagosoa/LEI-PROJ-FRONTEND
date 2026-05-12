@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Deploying DEI Cloud Backend + Frontend
echo ========================================
echo.

set SSH_KEY=C:\Users\%USERNAME%\.ssh\cloud.pem
set REMOTE_USER=root
set REMOTE_HOST=cloud.dei.isep.ipp.pt
set REMOTE_PORT=922
set REMOTE_BACKEND_PATH=/opt/dei-backend
set REMOTE_FRONTEND_PATH=/var/www/html
set LOCAL_PATH=C:\Users\%USERNAME%\OneDrive\Desktop\LEI-PROJ\projeto

echo [INFO] SSH Key: %SSH_KEY%
echo [INFO] Local path: %LOCAL_PATH%
echo [INFO] Remote backend: %REMOTE_BACKEND_PATH%
echo [INFO] Remote frontend: %REMOTE_FRONTEND_PATH%
echo.

REM ========================================
REM PART 1: CHECK VPN CONNECTION
REM ========================================
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

REM ========================================
REM PART 2: BACKEND DEPLOYMENT
REM ========================================
echo ========================================
echo BACKEND DEPLOYMENT
echo ========================================
echo.

echo 2. Creating backend directories on server...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "mkdir -p %REMOTE_BACKEND_PATH%"
echo [OK] Directory ready
echo.

echo 3. Uploading backend files...
cd %LOCAL_PATH%\Backend
echo Uploading src folder...
scp -i %SSH_KEY% -P %REMOTE_PORT% -r src %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BACKEND_PATH%/
echo Uploading root files...
scp -i %SSH_KEY% -P %REMOTE_PORT% *.js *.json %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BACKEND_PATH%/
echo [OK] Backend files uploaded
echo.

echo 4. Installing backend dependencies on server...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_BACKEND_PATH% && npm install --production"
echo [OK] Dependencies installed
echo.

echo 5. Creating .env file (PORT=80 for backend)...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'PORT=80' > %REMOTE_BACKEND_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'NODE_ENV=production' >> %REMOTE_BACKEND_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'BASE_FOLDER=/vs_cloud' >> %REMOTE_BACKEND_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'LDAP_URL=ldap://192.168.62.4' >> %REMOTE_BACKEND_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'LDAP_BASE_DN=ou=users,dc=dei,dc=isep,dc=ipp,dc=pt' >> %REMOTE_BACKEND_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'LDAP_USER_ATTR=uid' >> %REMOTE_BACKEND_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'JWT_SECRET=dei-cloud-secret-key-2026' >> %REMOTE_BACKEND_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'JWT_EXPIRES_IN=8h' >> %REMOTE_BACKEND_PATH%/.env"
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "echo 'LOG_LEVEL=info' >> %REMOTE_BACKEND_PATH%/.env"
echo [OK] .env created with PORT=80
echo.

echo 6. Verifying .env content...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "cat %REMOTE_BACKEND_PATH%/.env"
echo.

echo 7. Preparing frontend folder on server...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "mkdir -p %REMOTE_FRONTEND_PATH%"
echo [OK] Frontend directory ready
echo.

echo 8. Stopping old backend process...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "pm2 stop dei-backend 2>/dev/null; pkill -f 'node server.js' 2>/dev/null; echo 'Old process stopped'"
echo.

echo 9. Installing PM2 (if needed)...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "npm install -g pm2 2>/dev/null"
echo.

REM ========================================
REM PART 3: FRONTEND DEPLOYMENT
REM ========================================
echo ========================================
echo FRONTEND DEPLOYMENT
echo ========================================
echo.

echo 10. Building Angular frontend...
cd %LOCAL_PATH%\frontend
echo Running ng build...
call ng build
if errorlevel 1 (
    echo [ERROR] Frontend build failed!
    echo Please fix compilation errors and try again.
    pause
    exit /b 1
)
echo [OK] Frontend built successfully
echo.

echo 11. Uploading frontend files to server (from browser folder)...
scp -i %SSH_KEY% -P %REMOTE_PORT% -r dist/frontend/browser/* %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_FRONTEND_PATH%/
if errorlevel 1 (
    echo [ERROR] Frontend upload failed!
    pause
    exit /b 1
)
echo [OK] Frontend files uploaded
echo.

REM ========================================
REM PART 4: START BACKEND (now serves both)
REM ========================================
echo ========================================
echo STARTING BACKEND
echo ========================================
echo.

echo 12. Starting backend with PM2 on port 80...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_BACKEND_PATH% && pm2 start server.js --name dei-backend && pm2 save"
echo.

echo 13. Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak > nul
echo.

echo 14. Testing API (health check)...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "curl -s http://localhost:80/health"
echo.

echo 15. Testing frontend access...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "curl -s -o nul -w 'HTTP Status: %%{http_code}\n' http://localhost:80/"
echo.

echo 16. Checking PM2 status...
ssh -i %SSH_KEY% -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "pm2 status"
echo.

echo ========================================
echo DEPLOY COMPLETED!
echo ========================================
echo.
echo [SUCCESS] Backend running on port 80
echo [SUCCESS] Frontend served from /var/www/html
echo.
echo Access the application at:
echo http://cloud.dei.isep.ipp.pt
echo.
echo To view logs:
echo ssh -i %SSH_KEY% -p %REMOTE_PORT% root@%REMOTE_HOST% "pm2 logs dei-backend"
echo.
echo To check Apache is stopped:
echo ssh -i %SSH_KEY% -p %REMOTE_PORT% root@%REMOTE_HOST% "systemctl status apache2"
echo.
pause