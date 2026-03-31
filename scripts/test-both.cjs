#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Testing Both Web and Desktop Apps...\n');

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
    console.log('🎯 Testing Web App...\n');
    
    // Test web app
    console.log('📦 Starting web development server...');
    const webProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      detached: true
    });
    
    // Wait a bit for web server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Web server started at http://localhost:5173\n');
    
    console.log('🎯 Testing Desktop App...\n');
    
    // Clean and build desktop
    execCommand('npm run clean', 'Cleaning previous builds');
    execCommand('npm run build:web', 'Building React renderer');
    execCommand('npx tsc -p tsconfig.electron.json', 'Building Electron main process');
    
    // Create package.json in dist
    console.log('📦 Creating package.json in dist folder...');
    const distPackageJson = {
      name: "sellx-desktop",
      version: "1.0.0",
      description: "SellX POS System - Desktop Application",
      author: "SellX Team",
      main: "main.js",
      scripts: {
        start: "electron ."
      },
      dependencies: {
        "electron-pos-printer": "^1.2.7",
        "electron-store": "^10.0.0",
        "node-hid": "^3.0.0",
        "serialport": "^12.0.0",
        "zod": "^3.23.8"
      }
    };
    fs.writeFileSync(path.join(__dirname, '..', 'dist', 'package.json'), JSON.stringify(distPackageJson, null, 2));
    console.log('✅ package.json created in dist folder\n');
    
    // Install dependencies in dist
    execCommand('cd dist && npm install', 'Installing dependencies in dist folder');
    
    // Start desktop app
    console.log('📦 Starting desktop app...');
    const desktopProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, '..', 'dist'),
      stdio: 'inherit',
      detached: true
    });
    
    console.log('\n🎉 Both apps are now running!');
    console.log('\n📋 Access Points:');
    console.log('   - Web App: http://localhost:5173');
    console.log('   - Desktop App: Should open automatically');
    console.log('\n📋 To stop:');
    console.log('   - Press Ctrl+C to stop this script');
    console.log('   - Or manually kill the processes');
    
    // Keep the script running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping both apps...');
      try {
        process.kill(-webProcess.pid);
        process.kill(-desktopProcess.pid);
      } catch (e) {
        // Ignore errors
      }
      process.exit(0);
    });
    
    // Keep alive
    await new Promise(() => {});
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

main();
