@echo off
title E-School AI Tunnel (ngrok)
cd /d "%~dp0"

echo.
echo  E-SCHOOL AI - KET NOI SERVER (TUNNELING)
echo  ========================================
echo.
echo  Tac dung: Dua AI tren may ban (cong 8080) len Internet
echo  de Web tren Render co the goi ve duoc.
echo.

:: Kiem tra ngrok
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo  [!] Chua cai dat ngrok hoac chua them vao PATH.
    echo      Vui long tai ngrok tai: https://ngrok.com/download
    echo      Sau do chay lenh: ngrok config add-authtoken <TOKEN_CUA_BAN>
    echo.
    pause
    exit /b
)

echo  [*] Dang khoi tao duong ham ngrok cho port 8080...
echo.
echo  HUONG DAN:
echo  1. Copy dong "Forwarding" hien ra (vi du: https://xxxx.ngrok-free.app)
echo  2. Len Render.com -> Dashboard -> E-School Service -> Environment
echo  3. Them bien: LOCAL_AI_ENDPOINT = https://xxxx.ngrok-free.app/v1
echo.
echo  Luu y: Giu cua so nay MO khi muon Web online dung duoc AI.
echo.

ngrok http 8080
pause
