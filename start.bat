@echo off
chcp 65001 >nul
title WikiStock - Start

echo ===================================================
echo          WIKISTOCK - KHOI Dong HE THONG
echo ===================================================
echo.

docker compose up --build -d

if errorlevel 1 (
    echo.
    echo [ERROR] Docker compose failed! Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   KHOI DONG THANH CONG!
echo ===================================================
echo   Frontend:    http://localhost:3000
echo   Backend:     http://localhost:8080
echo   AI Service:  http://localhost:8000
echo ===================================================
echo.
echo Nhan phim bat ky de mo website...
pause >nul
start http://localhost:3000
