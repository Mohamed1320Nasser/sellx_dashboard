@echo off
REM =============================================================================
REM SellX POS - Windows Cleanup Script
REM =============================================================================
REM This script removes all traces of SellX POS from your Windows PC
REM Run this as Administrator before installing a fresh version
REM =============================================================================

echo ========================================
echo SellX POS - Windows Cleanup Script
echo ========================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires Administrator privileges!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Stopping any running SellX processes...
taskkill /F /IM "SellX POS.exe" 2>nul
taskkill /F /IM "sellx-pos.exe" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Removing installed applications...

REM Uninstall via standard uninstaller
if exist "%LOCALAPPDATA%\Programs\SellX POS\Uninstall SellX POS.exe" (
    echo Running uninstaller...
    "%LOCALAPPDATA%\Programs\SellX POS\Uninstall SellX POS.exe" /S
    timeout /t 5 /nobreak >nul
)

REM Remove program files
echo Removing program files...
rmdir /S /Q "%LOCALAPPDATA%\Programs\SellX POS" 2>nul
rmdir /S /Q "%LOCALAPPDATA%\Programs\sellx-pos" 2>nul
rmdir /S /Q "%ProgramFiles%\SellX POS" 2>nul
rmdir /S /Q "%ProgramFiles(x86)%\SellX POS" 2>nul

REM Remove app data
echo.
echo Removing application data...
rmdir /S /Q "%APPDATA%\SellX POS" 2>nul
rmdir /S /Q "%APPDATA%\sellx-pos" 2>nul
rmdir /S /Q "%APPDATA%\com.sellx.pos" 2>nul
rmdir /S /Q "%LOCALAPPDATA%\SellX POS" 2>nul
rmdir /S /Q "%LOCALAPPDATA%\sellx-pos" 2>nul

REM Remove desktop shortcuts
echo Removing shortcuts...
del /F /Q "%USERPROFILE%\Desktop\SellX POS.lnk" 2>nul
del /F /Q "%PUBLIC%\Desktop\SellX POS.lnk" 2>nul

REM Remove start menu entries
echo Removing Start Menu entries...
rmdir /S /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SellX" 2>nul
rmdir /S /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SellX POS" 2>nul
rmdir /S /Q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\SellX" 2>nul

REM Remove registry entries
echo Removing registry entries...
reg delete "HKCU\Software\SellX POS" /f 2>nul
reg delete "HKCU\Software\sellx-pos" /f 2>nul
reg delete "HKCU\Software\com.sellx.pos" /f 2>nul
reg delete "HKLM\Software\SellX POS" /f 2>nul
reg delete "HKLM\Software\WOW6432Node\SellX POS" /f 2>nul

REM Remove uninstall registry entries
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\{com.sellx.pos}" /f 2>nul
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\{com.sellx.pos}" /f 2>nul

REM Clear icon cache
echo.
echo Clearing icon cache...
ie4uinit.exe -show 2>nul
ie4uinit.exe -ClearIconCache 2>nul

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo The following items have been removed:
echo   - SellX POS application files
echo   - Application preferences and settings
echo   - Desktop and Start Menu shortcuts
echo   - Registry entries
echo.
echo You may need to restart your computer
echo for all changes to take effect.
echo.
echo To install fresh, run:
echo   npm run build:win
echo.
pause
