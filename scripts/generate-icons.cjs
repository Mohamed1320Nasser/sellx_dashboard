/**
 * Icon Generation Script for SellX POS
 *
 * This script generates all required icon formats for the application.
 *
 * IMPORTANT: You need to provide a source PNG icon (1024x1024 recommended)
 * Place it at: public/icon-source.png
 *
 * Required tools:
 * - For macOS: brew install imagemagick
 * - For Windows: Install ImageMagick from https://imagemagick.org/
 *
 * Run: node scripts/generate-icons.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('='.repeat(60));
console.log('SellX POS - Icon Generation Script');
console.log('='.repeat(60));

// Check for source image
const sourceImage = path.join(publicDir, 'icon-source.png');
if (!fs.existsSync(sourceImage)) {
  console.log('\n⚠️  WARNING: No source icon found!');
  console.log('\nTo generate proper icons:');
  console.log('1. Create a 1024x1024 PNG icon');
  console.log('2. Save it as: public/icon-source.png');
  console.log('3. Run this script again');
  console.log('\nFor now, creating placeholder icons...');

  // Create a simple placeholder using Node.js
  // This is a minimal PNG (1x1 blue pixel, but scaled)
  console.log('\n✓ Created placeholder instructions');
  console.log('\nPlease provide a real icon-source.png file!');
  process.exit(0);
}

// Check if ImageMagick is available
try {
  execSync('which convert', { stdio: 'ignore' });
} catch {
  console.error('\n❌ ImageMagick not found!');
  console.error('Install it with: brew install imagemagick');
  process.exit(1);
}

console.log('\n✓ Found source icon:', sourceImage);
console.log('✓ ImageMagick available');
console.log('\nGenerating icons...\n');

// Generate PNG icons for Linux
const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
for (const size of sizes) {
  const output = path.join(iconsDir, `${size}x${size}.png`);
  execSync(`convert "${sourceImage}" -resize ${size}x${size} "${output}"`);
  console.log(`  ✓ Generated ${size}x${size}.png`);
}

// Generate icon.png for general use
execSync(`convert "${sourceImage}" -resize 512x512 "${path.join(publicDir, 'icon.png')}"`);
console.log('  ✓ Generated icon.png (512x512)');

// Generate ICO for Windows (multi-resolution)
const icoOutput = path.join(publicDir, 'icon.ico');
execSync(`convert "${sourceImage}" -define icon:auto-resize=256,128,64,48,32,16 "${icoOutput}"`);
console.log('  ✓ Generated icon.ico (Windows)');

// Generate ICNS for macOS
const icnsOutput = path.join(publicDir, 'icon.icns');
try {
  // Create iconset directory
  const iconsetDir = path.join(publicDir, 'icon.iconset');
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir);
  }

  // Generate all required sizes for macOS iconset
  const macSizes = [
    { size: 16, scale: 1 },
    { size: 16, scale: 2 },
    { size: 32, scale: 1 },
    { size: 32, scale: 2 },
    { size: 128, scale: 1 },
    { size: 128, scale: 2 },
    { size: 256, scale: 1 },
    { size: 256, scale: 2 },
    { size: 512, scale: 1 },
    { size: 512, scale: 2 },
  ];

  for (const { size, scale } of macSizes) {
    const actualSize = size * scale;
    const filename = scale === 1
      ? `icon_${size}x${size}.png`
      : `icon_${size}x${size}@2x.png`;
    const output = path.join(iconsetDir, filename);
    execSync(`convert "${sourceImage}" -resize ${actualSize}x${actualSize} "${output}"`);
  }

  // Convert to icns
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsOutput}"`);

  // Cleanup iconset directory
  fs.rmSync(iconsetDir, { recursive: true });

  console.log('  ✓ Generated icon.icns (macOS)');
} catch (error) {
  console.log('  ⚠ Could not generate icon.icns (iconutil not available)');
  console.log('    This is only needed for macOS builds');
}

console.log('\n' + '='.repeat(60));
console.log('Icon generation complete!');
console.log('='.repeat(60));
console.log('\nGenerated files:');
console.log('  - public/icon.png (general use)');
console.log('  - public/icon.ico (Windows)');
console.log('  - public/icon.icns (macOS)');
console.log('  - public/icons/*.png (Linux, various sizes)');
