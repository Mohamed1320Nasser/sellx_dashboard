#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Checking Status of Both Apps...\n');

function checkWebApp() {
  try {
    console.log('📱 Checking Web App...');
    const response = execSync('curl -s http://localhost:5173 | head -3', { encoding: 'utf8' });
    if (response.includes('<!doctype html>')) {
      console.log('✅ Web App: RUNNING at http://localhost:5173');
      return true;
    } else {
      console.log('❌ Web App: NOT RESPONDING');
      return false;
    }
  } catch (error) {
    console.log('❌ Web App: NOT RUNNING');
    return false;
  }
}

function checkDesktopApp() {
  try {
    console.log('🖥️  Checking Desktop App...');
    const processes = execSync('ps aux | grep -i electron | grep -v grep | grep -i sellx', { encoding: 'utf8' });
    if (processes.includes('Electron.app')) {
      console.log('✅ Desktop App: RUNNING');
      return true;
    } else {
      console.log('❌ Desktop App: NOT RUNNING');
      return false;
    }
  } catch (error) {
    console.log('❌ Desktop App: NOT RUNNING');
    return false;
  }
}

function main() {
  const webRunning = checkWebApp();
  const desktopRunning = checkDesktopApp();
  
  console.log('\n📊 Summary:');
  console.log(`   Web App: ${webRunning ? '✅ RUNNING' : '❌ NOT RUNNING'}`);
  console.log(`   Desktop App: ${desktopRunning ? '✅ RUNNING' : '❌ NOT RUNNING'}`);
  
  if (webRunning && desktopRunning) {
    console.log('\n🎉 Both apps are working correctly!');
    console.log('\n📋 Access Points:');
    console.log('   - Web App: http://localhost:5173');
    console.log('   - Desktop App: Should be visible on your screen');
  } else {
    console.log('\n⚠️  Some apps are not running. Check the output above.');
  }
}

main();

