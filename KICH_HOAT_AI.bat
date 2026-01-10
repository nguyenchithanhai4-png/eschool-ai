@echo off
title E-SCHOOL AI - KHOI DONG TOAN BO
cd /d "%~dp0"

echo ---------------------------------------------------
echo       DANG KHOI DONG HE THONG E-SCHOOL AI
echo ---------------------------------------------------
echo.

:: 1. Thiet lap duong dan
set AI_DIR=AI
set LLAMA=%AI_DIR%\llama-server.exe
set MODEL=%AI_DIR%\Qwen_Qwen2.5-VL-7B-Instruct-Q4_K_M.gguf
set VISION=%AI_DIR%\mmproj-Qwen_Qwen2.5-VL-7B-Instruct-f16.gguf

:: 2. Khoi dong AI Engine (Bang den 1)
echo [1/3] Dang bat Dong co AI...
start "E-School AI Engine" "%LLAMA%" -m "%MODEL%" --mmproj "%VISION%" -c 6000 -b 512 -ngl 99 -t 6 --port 8080 --host 0.0.0.0
timeout /t 3

:: 3. Khoi dong Web Server (Bang den 2)
echo [2/3] Dang bat Web Server (Local)...
start "E-School Web Server" cmd /k "node server.js"
timeout /t 3

:: 4. Kich hoat Tunnel Ngrok (Bang den 3)
echo [3/3] Dang bat Ket noi Internet (Ngrok)...
echo.
echo * CHU Y: Giu bang nay de duy tri ket noi cho App Dien thoai.
echo.
ngrok http 8080 --domain=unimperative-unneurotic-calandra.ngrok-free.dev

pause
