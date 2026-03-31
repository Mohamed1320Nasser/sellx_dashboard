#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Building SellX Desktop Application (Minimal)...\n');

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
    
    console.log('🎯 Starting minimal desktop build process...\n');
    
    // Step 1: Clean previous builds
    execCommand('npm run clean', 'Cleaning previous builds');
    
    // Step 2: Build React renderer for desktop only
    execCommand('VITE_TARGET=desktop vite build', 'Building React renderer');
    
    // Step 3: Copy electron files to dist
    console.log('📦 Copying Electron files...');
    const electronSrc = path.resolve(__dirname, '..', 'electron');
    const electronDest = path.resolve(__dirname, '..', 'dist', 'electron');
    
    if (fs.existsSync(electronSrc)) {
      execCommand(`cp -r ${electronSrc} ${electronDest}`, 'Copying Electron main process files');
    }
    
    // Step 4: Create package.json for electron
    const packageJson = {
      name: "sellx-desktop",
      version: "1.0.0",
      main: "electron/main.js",
      scripts: {
        start: "electron ."
      }
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, '..', 'dist', 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Step 5: List output files
    listOutputFiles();
    
    console.log('🎉 Minimal desktop build completed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Navigate to the dist/ folder');
    console.log('   2. Run: npm install electron');
    console.log('   3. Run: npm start');
    console.log('   4. Test the application');
    
    console.log('\n⚠️  Note: This is a minimal build for testing');
    console.log('   For production, use the full build with electron-builder');
    
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
