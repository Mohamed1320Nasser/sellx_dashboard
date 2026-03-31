#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Building SellX Desktop Installer...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n📦 ${description}...`, 'blue');
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    throw error;
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024 / 1024).toFixed(2);
  } catch {
    return 'N/A';
  }
}

function listOutputFiles() {
  const distPath = path.resolve(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ No dist directory found', 'red');
    return;
  }

  log('\n📁 Generated Files:', 'cyan');
  const files = fs.readdirSync(distPath);
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const size = getFileSize(filePath);
    
    if (stats.isDirectory()) {
      log(`   📁 ${file}/ (${size} MB)`, 'yellow');
    } else {
      const icon = file.endsWith('.exe') ? '💿' : '📄';
      log(`   ${icon} ${file} (${size} MB)`, 'yellow');
    }
  });
}

function createInstallationInstructions() {
  const instructionsPath = path.resolve(__dirname, '..', 'dist', 'INSTALLATION_INSTRUCTIONS.txt');
  const instructions = `
SellX Desktop Application - Installation Instructions
========================================================

📋 SYSTEM REQUIREMENTS:
- Windows 10/11 (64-bit)
- 4GB RAM minimum
- 500MB free disk space
- Internet connection (for backend API)

🚀 INSTALLATION STEPS:

1. INSTALL THE APPLICATION:
   - Run "SellX Setup X.X.X.exe" as Administrator
   - Follow the installation wizard
   - Choose installation directory (default: C:\\Program Files\\SellX)
   - Create desktop shortcut (recommended)

2. FIRST-TIME SETUP:
   - Launch SellX from Start Menu or Desktop
   - Go to Settings → App Configuration
   - Enter your backend API URL (e.g., https://api.yourcompany.com/api)
   - Click "Test Connection" to verify
   - Click "Save" to apply settings

3. HARDWARE CONFIGURATION (Optional):
   - Go to Settings → Devices
   - Configure barcode scanner (HID or Serial mode)
   - Configure receipt printer (ESC/POS thermal)
   - Test devices using the Debug → Hardware Test page

4. LOGIN:
   - Use your company credentials to login
   - Start using the POS system!

🔧 TROUBLESHOOTING:

Common Issues:
- "Cannot connect to backend": Check API URL and network connection
- "Scanner not detected": Check USB connection and device drivers
- "Printer not working": Verify ESC/POS compatibility and drivers

Debug Mode:
- Enable debug mode in Settings → App Configuration
- Check logs in: %APPDATA%\\SellX\\logs\\
- Use Debug → Hardware Test for device diagnostics

📞 SUPPORT:
- Check the debug logs for detailed error information
- Export configuration for troubleshooting
- Contact your system administrator

🔄 UPDATES:
- The app will check for updates automatically
- Manual updates: Download new installer and run
- Configuration is preserved during updates

========================================================
Generated on: ${new Date().toLocaleString()}
Build Version: ${process.env.npm_package_version || '1.0.0'}
========================================================
`;

  try {
    fs.writeFileSync(instructionsPath, instructions);
    log(`📄 Created installation instructions: ${instructionsPath}`, 'green');
  } catch (error) {
    log(`⚠️  Could not create instructions file: ${error.message}`, 'yellow');
  }
}

function createDeploymentPackage() {
  const packagePath = path.resolve(__dirname, '..', 'dist', 'deployment-package');
  
  try {
    if (!fs.existsSync(packagePath)) {
      fs.mkdirSync(packagePath, { recursive: true });
    }

    // Copy installer
    const installerFiles = fs.readdirSync(path.resolve(__dirname, '..', 'dist'))
      .filter(file => file.endsWith('.exe') && file.includes('Setup'));
    
    installerFiles.forEach(file => {
      const src = path.resolve(__dirname, '..', 'dist', file);
      const dest = path.resolve(packagePath, file);
      fs.copyFileSync(src, dest);
    });

    // Copy instructions
    const instructionsSrc = path.resolve(__dirname, '..', 'dist', 'INSTALLATION_INSTRUCTIONS.txt');
    const instructionsDest = path.resolve(packagePath, 'INSTALLATION_INSTRUCTIONS.txt');
    if (fs.existsSync(instructionsSrc)) {
      fs.copyFileSync(instructionsSrc, instructionsDest);
    }

    // Create deployment manifest
    const manifest = {
      version: process.env.npm_package_version || '1.0.0',
      buildDate: new Date().toISOString(),
      files: fs.readdirSync(packagePath),
      requirements: {
        os: 'Windows 10/11 (64-bit)',
        ram: '4GB minimum',
        disk: '500MB free space',
        network: 'Internet connection required'
      },
      features: [
        'Barcode scanner support (HID & Serial)',
        'ESC/POS thermal printer support',
        'Configurable backend API URL',
        'Professional POS workflows',
        'Hardware device management',
        'Debug and testing tools'
      ]
    };

    const manifestPath = path.resolve(packagePath, 'deployment-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    log(`📦 Created deployment package: ${packagePath}`, 'green');
  } catch (error) {
    log(`⚠️  Could not create deployment package: ${error.message}`, 'yellow');
  }
}

async function main() {
  try {
    // Set environment for desktop build
    process.env.VITE_TARGET = 'desktop';
    
    log('🎯 Starting desktop build process...', 'magenta');
    
    // Step 1: Clean previous builds
    execCommand('npm run clean || echo "No clean script found"', 'Cleaning previous builds');
    
    // Step 2: Install dependencies (if needed)
    execCommand('npm install', 'Installing dependencies');
    
    // Step 3: Build React renderer for desktop
    execCommand('npm run build:web', 'Building React renderer');
    
    // Step 4: Build Electron main process
    execCommand('npm run build:electron', 'Building Electron main process');
    
    // Step 5: Package for distribution
    execCommand('npm run dist', 'Packaging for distribution');
    
    // Step 6: List output files
    listOutputFiles();
    
    // Step 7: Create installation instructions
    createInstallationInstructions();
    
    // Step 8: Create deployment package
    createDeploymentPackage();
    
    log('\n🎉 Desktop build completed successfully!', 'green');
    log('\n📋 Next Steps:', 'cyan');
    log('   1. Test the installer on a Windows machine', 'yellow');
    log('   2. Configure backend API URL in the app', 'yellow');
    log('   3. Test hardware devices (scanner/printer)', 'yellow');
    log('   4. Deploy to production devices', 'yellow');
    
    log('\n💡 Tips for Testing:', 'cyan');
    log('   - Use the Debug → Hardware Test page to verify devices', 'yellow');
    log('   - Check Settings → App Configuration for backend setup', 'yellow');
    log('   - Export configuration for backup/restore', 'yellow');
    
  } catch (error) {
    log(`\n❌ Build failed: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting:', 'cyan');
    log('   - Check that all dependencies are installed', 'yellow');
    log('   - Verify Node.js version (18+ required)', 'yellow');
    log('   - Ensure you have write permissions to dist/ directory', 'yellow');
    log('   - Check for any TypeScript or build errors above', 'yellow');
    process.exit(1);
  }
}

// Run the build
main();
