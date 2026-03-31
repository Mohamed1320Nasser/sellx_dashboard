#!/bin/bash

# =============================================================================
# SellX POS - macOS Cleanup Script
# =============================================================================
# This script removes all traces of SellX POS from your Mac
# Run this before installing a fresh version
# =============================================================================

echo "========================================"
echo "SellX POS - macOS Cleanup Script"
echo "========================================"
echo ""

# Kill any running instances
echo "Stopping any running SellX processes..."
pkill -f "SellX" 2>/dev/null || true
pkill -f "sellx" 2>/dev/null || true
sleep 2

# Remove from /Applications
echo ""
echo "Removing applications from /Applications..."
sudo rm -rf "/Applications/SellX POS.app" 2>/dev/null || true
sudo rm -rf "/Applications/sellx-pos.app" 2>/dev/null || true
sudo rm -rf "/Applications/SellX.app" 2>/dev/null || true

# Remove from user Applications
echo "Removing from user Applications folder..."
rm -rf ~/Applications/SellX* 2>/dev/null || true

# Remove app data
echo ""
echo "Removing application data..."
rm -rf ~/Library/Application\ Support/SellX\ POS 2>/dev/null || true
rm -rf ~/Library/Application\ Support/sellx-pos 2>/dev/null || true
rm -rf ~/Library/Application\ Support/com.sellx.pos 2>/dev/null || true

# Remove preferences
echo "Removing preferences..."
rm -rf ~/Library/Preferences/com.sellx.pos.plist 2>/dev/null || true
rm -rf ~/Library/Preferences/sellx-pos.plist 2>/dev/null || true

# Remove caches
echo "Removing caches..."
rm -rf ~/Library/Caches/SellX\ POS 2>/dev/null || true
rm -rf ~/Library/Caches/sellx-pos 2>/dev/null || true
rm -rf ~/Library/Caches/com.sellx.pos 2>/dev/null || true
rm -rf ~/Library/Caches/com.sellx.pos.ShipIt 2>/dev/null || true

# Remove logs
echo "Removing logs..."
rm -rf ~/Library/Logs/SellX* 2>/dev/null || true
rm -rf ~/Library/Logs/sellx* 2>/dev/null || true

# Remove saved state
echo "Removing saved application state..."
rm -rf ~/Library/Saved\ Application\ State/com.sellx.pos.savedState 2>/dev/null || true

# Remove electron-store data
echo "Removing electron-store data..."
rm -rf ~/Library/Application\ Support/sellx-pos/*.json 2>/dev/null || true

# Clear Spotlight index for the app (forces re-indexing)
echo ""
echo "Resetting Spotlight index for Applications..."
sudo mdutil -E /Applications 2>/dev/null || true

# Clear Launch Services database (fixes duplicate app icons)
echo "Rebuilding Launch Services database..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user 2>/dev/null || true

# Restart Dock to refresh Launchpad
echo "Restarting Dock..."
killall Dock 2>/dev/null || true

echo ""
echo "========================================"
echo "Cleanup complete!"
echo "========================================"
echo ""
echo "The following items have been removed:"
echo "  - All SellX POS applications"
echo "  - Application preferences and settings"
echo "  - Caches and logs"
echo "  - Saved application state"
echo ""
echo "You may need to log out and log back in"
echo "for all changes to take effect."
echo ""
echo "To install fresh, run:"
echo "  npm run build:mac"
echo ""
