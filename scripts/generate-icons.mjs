import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildDir = join(__dirname, '..', 'build');
const svgPath = join(buildDir, 'icon.svg');

async function generate() {
  const svg = readFileSync(svgPath);

  // Generate PNGs at various sizes
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  for (const size of sizes) {
    await sharp(svg).resize(size, size).png().toFile(join(buildDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  // Main icon.png (256x256 for electron-builder)
  await sharp(svg).resize(256, 256).png().toFile(join(buildDir, 'icon.png'));
  console.log('Generated icon.png (256x256)');

  // Generate .ico from 256px PNG
  const pngBuffer = readFileSync(join(buildDir, 'icon-256.png'));
  const icoBuffer = await pngToIco(pngBuffer);
  writeFileSync(join(buildDir, 'icon.ico'), icoBuffer);
  console.log('Generated icon.ico');

  // Tray icon (16x16 for system tray)
  await sharp(svg).resize(16, 16).png().toFile(join(buildDir, 'tray-icon.png'));
  await sharp(svg).resize(32, 32).png().toFile(join(buildDir, 'tray-icon@2x.png'));
  console.log('Generated tray icons');

  console.log('All icons generated!');
}

generate().catch(console.error);
