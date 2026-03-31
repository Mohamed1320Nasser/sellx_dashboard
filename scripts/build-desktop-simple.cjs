#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Building SellX Desktop Application (Simple)...\n');

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

function listOutputFiles() {
  const distPath = path.resolve(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('❌ No dist directory found');
    return;
  }

  console.log('📁 Generated Files:');
  const files = fs.readdirSync(distPath);
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    
    if (stats.isDirectory()) {
      console.log(`   📁 ${file}/ (${size} MB)`);
    } else {
      const icon = file.endsWith('.exe') ? '💿' : '📄';
      console.log(`   ${icon} ${file} (${size} MB)`);
    }
  });
}

async function main() {
  try {
    // Set environment for desktop build
    process.env.VITE_TARGET = 'desktop';
    
    console.log('🎯 Starting desktop build process...\n');
    
    // Step 1: Clean previous builds
    execCommand('npm run clean', 'Cleaning previous builds');
    
    // Step 2: Install dependencies
    execCommand('npm install', 'Installing dependencies');
    
    // Step 3: Build React renderer for desktop (skip type checking for now)
    execCommand('VITE_TARGET=desktop vite build', 'Building React renderer');
    
    // Step 4: Build Electron main process
    execCommand('npm run build:electron', 'Building Electron main process');
    
    // Step 5: Package for distribution
    execCommand('npm run dist', 'Packaging for distribution');
    
    // Step 6: List output files
    listOutputFiles();
    
    console.log('🎉 Desktop build completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test the installer on a Windows machine');
    console.log('   2. Configure backend API URL in the app');
    console.log('   3. Test hardware devices (scanner/printer)');
    console.log('   4. Deploy to production devices');
    
  } catch (error) {
    console.log(`\n❌ Build failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check that all dependencies are installed');
    console.log('   - Verify Node.js version (18+ required)');
    console.log('   - Ensure you have write permissions to dist/ directory');
    process.exit(1);
  }
}

// Run the build
main();
