@echo off
echo 🚀 Building SellX Desktop Application...
echo.

REM Set environment for desktop build
set VITE_TARGET=desktop

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔨 Building React renderer...
call npm run build:web
if %errorlevel% neq 0 (
    echo ❌ Failed to build React renderer
    pause
    exit /b 1
)

echo.
echo ⚡ Building Electron main process...
call npm run build:electron
if %errorlevel% neq 0 (
    echo ❌ Failed to build Electron main process
    pause
    exit /b 1
)

echo.
echo 📦 Packaging for distribution...
call npm run dist
if %errorlevel% neq 0 (
    echo ❌ Failed to package application
    pause
    exit /b 1
)

echo.
echo ✅ Build completed successfully!
echo.
echo 📁 Check the 'dist' folder for the installer files:
dir dist\*.exe /b 2>nul
if %errorlevel% neq 0 (
    echo No .exe files found in dist folder
)

echo.
echo 🎉 Ready for deployment!
echo.
echo Next steps:
echo 1. Test the installer on a Windows machine
echo 2. Configure backend API URL in the app
echo 3. Test hardware devices (scanner/printer)
echo 4. Deploy to production devices
echo.
pause
