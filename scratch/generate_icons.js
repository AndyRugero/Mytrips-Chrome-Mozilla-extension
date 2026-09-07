import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';

async function createIcons() {
  const sizes = [16, 48, 128];
  const publicDir = path.resolve('public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const size of sizes) {
    // Create blue rounded icon canvas
    const image = new Jimp(size, size, 0x2563ebff); // #2563eb blue
    
    // Draw white center accent dot/square
    const margin = Math.max(1, Math.floor(size / 4));
    for (let x = margin; x < size - margin; x++) {
      for (let y = margin; y < size - margin; y++) {
        image.setPixelColor(0xffffffff, x, y); // white center
      }
    }

    const iconPath = path.join(publicDir, `icon${size}.png`);
    await image.writeAsync(iconPath);
    console.log(`Created ${iconPath}`);
  }

  console.log('All icons generated successfully!');
}

createIcons().catch(console.error);
