const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');
const distWebPath = path.join(__dirname, '../dist-web');

console.log('Post-build script for Electron...');

// Step 1: Copy Vite build output (React app) to dist folder
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
  console.log('[OK] Created dist/ directory');
}

// Check if dist-web exists (Vite output)
if (fs.existsSync(distWebPath)) {
  console.log('[OK] Found Vite build output in dist-web/');

  // Copy all files from dist-web to dist
  const entries = fs.readdirSync(distWebPath, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(distWebPath, entry.name);
    const destPath = path.join(distPath, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
      console.log(`  [OK] Copied directory: ${entry.name}/`);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  [OK] Copied file: ${entry.name}`);
    }
  }

  console.log('[OK] Copied Vite build output to dist/');
} else {
  // Check if index.html already exists in dist (VITE_TARGET=desktop worked)
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('[OK] Vite build output already in dist/');
  } else {
    console.error('[ERROR] No Vite build output found!');
    console.error('  Expected either dist-web/ or dist/index.html');
    process.exit(1);
  }
}

// Step 2: Create package.json that tells Node.js to treat files as CommonJS
const packageJsonPath = path.join(distPath, 'package.json');
const packageJson = {
  "name": "sellx-pos-dist",
  "type": "commonjs",
  "main": "main.js"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('[OK] Created dist/package.json with type: commonjs');

// Step 3: Fix paths in index.html for Electron (file:// protocol needs relative paths)
const indexHtmlPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  // Replace absolute paths with relative paths
  // /assets/ -> ./assets/
  // /vite.svg -> ./vite.svg
  indexHtml = indexHtml.replace(/href="\/assets\//g, 'href="./assets/');
  indexHtml = indexHtml.replace(/src="\/assets\//g, 'src="./assets/');
  indexHtml = indexHtml.replace(/href="\/vite\.svg/g, 'href="./vite.svg');
  indexHtml = indexHtml.replace(/href="\/icon/g, 'href="./icon');

  // Also fix any remaining absolute paths
  indexHtml = indexHtml.replace(/="\/([^"\/])/g, '="./$1');

  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('[OK] Fixed asset paths in index.html for Electron');
}

// Step 4: Verify critical files exist
const criticalFiles = ['main.js', 'preload.js', 'index.html'];
const missingFiles = criticalFiles.filter(file => !fs.existsSync(path.join(distPath, file)));

if (missingFiles.length > 0) {
  console.error('[ERROR] Missing critical files:', missingFiles.join(', '));
  console.error('  Make sure to run tsc -p tsconfig.electron.json before this script');
  process.exit(1);
}

console.log('[OK] All critical files present (main.js, preload.js, index.html)');

// Step 5: Copy public assets if they exist
const publicPath = path.join(__dirname, '../public');
const distPublicPath = path.join(distPath, 'public');

if (fs.existsSync(publicPath)) {
  copyDir(publicPath, distPublicPath);
  console.log('[OK] Copied public/ assets to dist/public/');
}

// Step 6: Verify IPC handlers directory was compiled
const ipcPath = path.join(distPath, 'ipc');
if (!fs.existsSync(ipcPath)) {
  console.warn('[WARN] IPC handlers directory not found in dist/');
  console.warn('  This may cause IPC communication to fail');
}

// Step 7: Verify devices directory was compiled
const devicesPath = path.join(distPath, 'devices');
if (!fs.existsSync(devicesPath)) {
  console.warn('[WARN] Devices directory not found in dist/');
  console.warn('  Hardware features may not work');
}

console.log('');
console.log('Post-build completed successfully!');
console.log(`   Output directory: ${distPath}`);

// List final dist contents
const distContents = fs.readdirSync(distPath);
console.log(`   Contents: ${distContents.join(', ')}`);
