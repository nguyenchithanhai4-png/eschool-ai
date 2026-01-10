@echo off
title E-School AI
cd /d "%~dp0"

set AI_DIR=AI
set LLAMA=%AI_DIR%\llama-server.exe
set MODEL=%AI_DIR%\Qwen_Qwen2.5-VL-7B-Instruct-Q4_K_M.gguf
set VISION=%AI_DIR%\mmproj-Qwen_Qwen2.5-VL-7B-Instruct-f16.gguf

echo.
echo  E-SCHOOL AI - Khoi dong he thong
echo  =================================
echo.

:: Kiem tra file
if not exist "%LLAMA%" (
    echo  [LOI] Khong tim thay: %LLAMA%
    pause
    exit /b
)

:: Kiem tra AI da chay chua
curl -s http://127.0.0.1:8080/health 2>nul | findstr /i "ok" >nul
if %errorlevel%==0 (
    echo  [OK] AI Server da san sang
    goto start_web
)

:: Khoi dong AI
echo  [1/2] Dang khoi dong AI Server...
start "" /min "%LLAMA%" -m "%MODEL%" --mmproj "%VISION%" -c 6000 -b 512 -ngl 99 -t 6 --port 8080 --host 0.0.0.0

echo  [*] Dang cho AI load model...
:wait
timeout /t 3 /nobreak >nul
curl -s http://127.0.0.1:8080/health 2>nul | findstr /i "ok" >nul
if errorlevel 1 (
    echo  [*] Chua san sang, dang cho...
    goto wait
)
echo  [OK] AI Server san sang!

:start_web
echo.

:: Kiem tra web da chay chua
curl -s http://127.0.0.1:3000 >nul 2>&1
if %errorlevel%==0 (
    echo  [OK] Web Server da chay
    goto done
)

:: Khoi dong web
echo  [2/2] Dang khoi dong Web Server...
start "" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 4 /nobreak >nul

:done
echo.
echo  =================================
echo  HE THONG SAN SANG!
echo  Web: http://localhost:3000
echo  =================================
echo.
pause