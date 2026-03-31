#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Desktop App on macOS...\n');

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
    
    // Build for testing
    execCommand('npm run clean', 'Cleaning');
    execCommand('VITE_TARGET=desktop vite build --outDir dist', 'Building renderer');
    execCommand('tsc -p tsconfig.electron.json', 'Building Electron');
    
    // Install dependencies in dist
    execCommand('cd dist && npm install', 'Installing dependencies');
    
    // Run the app
    console.log('\n🚀 Starting desktop app...\n');
    execCommand('cd dist && npm start', 'Running desktop app');
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

main();
