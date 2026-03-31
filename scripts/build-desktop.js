#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Building SellX Desktop Application...\n');

try {
  // Set environment for desktop build
  process.env.VITE_TARGET = 'desktop';
  
  // Step 1: Build the renderer (React app)
  console.log('📦 Building React renderer...');
  execSync('npm run build:web', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  // Step 2: Build Electron app
  console.log('\n⚡ Building Electron application...');
  execSync('npm run build:electron', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  // Step 3: Package for distribution
  console.log('\n📦 Packaging for distribution...');
  execSync('npm run dist', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('\n✅ Desktop build completed successfully!');
  console.log('\n📁 Output files:');
  
  // List output files
  const distPath = path.resolve(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    files.forEach(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   - ${file} (${size} MB)`);
    });
  }
  
  console.log('\n🎉 Ready for deployment!');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
