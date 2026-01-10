@echo off
title E-School AI - Khoi Tao App Android
chcp 65001 > nul

echo ======================================================
echo           KHỞI TẠO DỰ ÁN ANDROID (CAPACITOR 6)
echo ======================================================
echo.

:: 1. Kiểm tra node_modules
if not exist "node_modules" (
    echo [INFO] Dang cai dat thu vien...
    call npm install
)

:: 2. Cài đặt Capacitor 6 (Tương thích với Node 18 của bạn)
echo [1/3] Dang cai dat Capacitor 6 (phien ban on dinh)...
call npm install @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6

:: 3. Thêm nền tảng Android (nếu chưa có thư mục android)
if not exist "android" (
    echo [2/3] Dang khoi tao thu muc Android...
    call npx cap add android
) else (
    echo [OK] Thu muc Android da ton tai.
)

:: 4. Đồng bộ code
echo [3/3] Dang dong bo code vao Android...
call npx cap sync android

echo.
echo ======================================================
echo [THANH CONG] Da khoi tao xong du an Android!
echo.
echo BUOC TIEP THEO:
echo 1. Mo Android Studio.
echo 2. Chon 'Open' va tro den thu muc 'android' trong du an nay.
echo 3. Vao menu 'Build' -> 'Build Bundle(s) / APK(s)' -> 'Build APK(s)'.
echo ======================================================
echo.
pause
