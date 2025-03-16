// scripts/download_missing_images.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import stream from 'stream';
import { fileURLToPath } from 'url';

const pipeline = promisify(stream.pipeline);

// ES modules için __dirname oluşturma
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creating directories if they don't exist
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configuration
const imagesFolder = path.join(__dirname, '../public/assets/images/dance');
ensureDirExists(imagesFolder);

// Eksik görseller için alternatif Unsplash görselleri
const missingImages = [
  {
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
    filename: 'kurs8.jpg',
    alt: 'Bale dansçısı'
  },
  {
    url: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d',
    filename: 'kurs9.jpg',
    alt: 'Breakdance performansı'
  },
  {
    url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d',
    filename: 'kurs10.jpg',
    alt: 'Vals dans eden çift'
  },
  {
    url: 'https://images.unsplash.com/photo-1576485436509-a7d286952b65',
    filename: 'okul3.jpg',
    alt: 'Dans salonu'
  },
  {
    url: 'https://images.unsplash.com/photo-1567942712661-82b9b407abbf',
    filename: 'rozet1.jpg',
    alt: 'Dans başlangıç rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1567942713473-d2ec9995d53b',
    filename: 'rozet2.jpg',
    alt: 'Ritim ustası rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1567942712793-0f8083a4dd59',
    filename: 'rozet3.jpg',
    alt: 'Adım uzmanı rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1567942713163-0bfd74be2dd5',
    filename: 'rozet4.jpg',
    alt: 'Dans yıldızı rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1567942713298-2dd9e8c13f6d',
    filename: 'rozet5.jpg',
    alt: 'Dans şampiyonu rozeti'
  },
];

async function downloadImage(imageUrl, outputPath) {
  try {
    const response = await fetch(`${imageUrl}?q=80&w=800&auto=format`);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    await pipeline(response.body, fs.createWriteStream(outputPath));
    console.log(`Downloaded: ${outputPath}`);
  } catch (error) {
    console.error(`Error downloading ${imageUrl}:`, error.message);
  }
}

async function downloadAllImages() {
  console.log('Starting missing image downloads...');
  
  // Process images sequentially to avoid rate limits
  for (const image of missingImages) {
    const outputPath = path.join(imagesFolder, image.filename);
    await downloadImage(image.url, outputPath);
    // Small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('All missing images downloaded successfully!');
}

// Run the script
downloadAllImages().catch(console.error); 