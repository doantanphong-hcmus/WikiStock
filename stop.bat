@echo off
chcp 65001 >nul
title WikiStock - Stop

echo ===================================================
echo          WIKISTOCK - DUNG HE THONG
echo ===================================================
echo.

docker compose down

echo.
echo Da dung tat ca containers.
pause
