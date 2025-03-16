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

// Son eksik görseller için alternatif Unsplash görselleri
const finalMissingImages = [
  {
    url: 'https://images.unsplash.com/photo-1504609813442-a9924e2e4f5b',
    filename: 'okul3.jpg',
    alt: 'Dans salonu'
  },
  {
    url: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233',
    filename: 'rozet2.jpg',
    alt: 'Ritim ustası rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11',
    filename: 'rozet3.jpg',
    alt: 'Adım uzmanı rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11',
    filename: 'rozet4.jpg',
    alt: 'Dans yıldızı rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11',
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
  console.log('Starting final missing image downloads...');
  
  // Process images sequentially to avoid rate limits
  for (const image of finalMissingImages) {
    const outputPath = path.join(imagesFolder, image.filename);
    await downloadImage(image.url, outputPath);
    // Small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('All final missing images downloaded successfully!');
}

// Run the script
downloadAllImages().catch(console.error); 