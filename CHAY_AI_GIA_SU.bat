@echo off
title E-School AI - He Thong Gia Su AI
chcp 65001 > nul

echo ======================================================
echo           KHỞI ĐỘNG ĐỘNG CƠ AI GIA SƯ
echo ======================================================
echo.

set AI_DIR=AI
set LLAMA=%AI_DIR%\llama-server.exe
set MODEL=%AI_DIR%\Qwen_Qwen2.5-VL-7B-Instruct-Q4_K_M.gguf
set VISION=%AI_DIR%\mmproj-Qwen_Qwen2.5-VL-7B-Instruct-f16.gguf

:: Kiểm tra file
if not exist "%LLAMA%" (
    echo [LOI] Khong tim thay file %LLAMA%
    echo Vui long kiem tra lai thu muc AI.
    pause
    exit /b
)

echo [INFO] Dang nap mo hinh AI... (Vui long cho khoang 30-60 giay)
echo [Luu y] Khong duoc dong cua so nay khi dang su dung web.
echo.

:: Khởi động AI Server
"%LLAMA%" -m "%MODEL%" --mmproj "%VISION%" -c 6000 -b 512 -ngl 99 -t 6 --port 8080 --host 0.0.0.0

pause
