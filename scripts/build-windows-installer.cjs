#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Building SellX Desktop Windows Installer from macOS...\n');

function execCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.log(`❌ ${description} failed: ${error.message}\n`);
    throw error;
  }
}

async function main() {
  try {
    process.env.VITE_TARGET = 'desktop';
    
    console.log('🎯 Building Windows installer from macOS...\n');
    
    // Clean previous builds
    execCommand('npm run clean', 'Cleaning previous builds');
    
    // Build React renderer for desktop
    execCommand('VITE_TARGET=desktop vite build --outDir dist', 'Building React renderer');
    
    // Build Electron main process (CommonJS)
    execCommand('tsc -p tsconfig.electron.json', 'Building Electron main process');
    
    // Build Windows installer (x64 only to avoid native module cross-compile issues)
    execCommand('npx electron-builder --win --x64', 'Creating Windows installer');
    
    console.log('\n🎉 Windows installer built successfully!');
    console.log('\n📦 Output files:');
    console.log('   - dist-installer/SellX POS Setup X.X.X.exe (installer)');
    console.log('   - dist-installer/win-unpacked/ (portable version)');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Transfer the installer to a Windows machine');
    console.log('   2. Run the installer as Administrator');
    console.log('   3. Configure backend API URL in Settings → App Configuration');
    console.log('   4. Test hardware devices');
    
  } catch (error) {
    console.log(`\n❌ Build failed: ${error.message}`);
    process.exit(1);
  }
}

main();
