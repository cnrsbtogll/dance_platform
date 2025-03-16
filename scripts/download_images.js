// scripts/download_images.js
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

// Unsplash API for dance-related images (replace with your actual Unsplash API key if you have one)
// For demo purposes, we'll use direct links to free stock images
const danceImages = [
  {
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    filename: 'kurs1.jpg',
    alt: 'Salsa dans eden çift'
  },
  {
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad',
    filename: 'kurs2.jpg',
    alt: 'Modern dans performansı'
  },
  {
    url: 'https://images.unsplash.com/photo-1547153760-18fc86324498',
    filename: 'kurs3.jpg',
    alt: 'Hip hop dansçı'
  },
  {
    url: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4',
    filename: 'kurs4.jpg',
    alt: 'Tango dans eden çift'
  },
  {
    url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434',
    filename: 'kurs5.jpg',
    alt: 'Jazz dans performansı'
  },
  {
    url: 'https://images.unsplash.com/photo-1545959570-a94084071b5d',
    filename: 'kurs6.jpg',
    alt: 'Flamenko dansçısı'
  },
  {
    url: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2',
    filename: 'kurs7.jpg',
    alt: 'Bachata dans eden çift'
  },
  {
    url: 'https://images.unsplash.com/photo-1561121631-d7b0e7f5c3b2',
    filename: 'kurs8.jpg',
    alt: 'Bale dansçısı'
  },
  {
    url: 'https://images.unsplash.com/photo-1546427660-eb2a6b5df784',
    filename: 'kurs9.jpg',
    alt: 'Breakdance performansı'
  },
  {
    url: 'https://images.unsplash.com/photo-1566853024045-c2a6b11189c9',
    filename: 'kurs10.jpg',
    alt: 'Vals dans eden çift'
  },
  {
    url: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913',
    filename: 'okul1.jpg',
    alt: 'Dans stüdyosu'
  },
  {
    url: 'https://images.unsplash.com/photo-1508215302842-8a015a452a20',
    filename: 'okul2.jpg',
    alt: 'Dans stüdyosu içi'
  },
  {
    url: 'https://images.unsplash.com/photo-1526473096655-5b97b8df5c97',
    filename: 'okul3.jpg',
    alt: 'Dans salonu'
  },
  {
    url: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c',
    filename: 'okul4.jpg',
    alt: 'Dans merkezi'
  },
  {
    url: 'https://images.unsplash.com/photo-1509963906410-fceef97f22f8',
    filename: 'okul5.jpg',
    alt: 'Dans ve müzik salonu'
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    filename: 'egitmen1.jpg',
    alt: 'Kadın dans eğitmeni'
  },
  {
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
    filename: 'egitmen2.jpg',
    alt: 'Erkek dans eğitmeni'
  },
  {
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    filename: 'egitmen3.jpg',
    alt: 'Hip hop eğitmeni'
  },
  {
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    filename: 'egitmen4.jpg',
    alt: 'Kadın dans öğretmeni'
  },
  {
    url: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf',
    filename: 'egitmen5.jpg',
    alt: 'Erkek dans öğretmeni'
  },
  {
    url: 'https://images.unsplash.com/photo-1554151228-14d9def656e4',
    filename: 'egitmen6.jpg',
    alt: 'Kadın dans koçu'
  },
  {
    url: 'https://images.unsplash.com/photo-1607923432780-7a9c30adcb5b',
    filename: 'rozet1.jpg',
    alt: 'Dans başlangıç rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1579169825453-8d4b4d665a3f',
    filename: 'rozet2.jpg',
    alt: 'Ritim ustası rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1589486380017-3023e030e592',
    filename: 'rozet3.jpg',
    alt: 'Adım uzmanı rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1567564936490-704d92c26f8b',
    filename: 'rozet4.jpg',
    alt: 'Dans yıldızı rozeti'
  },
  {
    url: 'https://images.unsplash.com/photo-1589486378173-44386d77fab2',
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
  console.log('Starting image downloads...');
  
  // Process images sequentially to avoid rate limits
  for (const image of danceImages) {
    const outputPath = path.join(imagesFolder, image.filename);
    await downloadImage(image.url, outputPath);
    // Small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('All images downloaded successfully!');
}

// Run the script
downloadAllImages().catch(console.error);