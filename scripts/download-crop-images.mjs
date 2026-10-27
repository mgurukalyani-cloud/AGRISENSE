import fs from 'fs';
import path from 'path';

const CROPS_IMAGES = {
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  mustard: 'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?auto=format&fit=crop&w=600&q=80',
  gram_chickpea: 'https://images.unsplash.com/photo-1589135233689-d56d953d6118?auto=format&fit=crop&w=600&q=80',
  cotton: 'https://images.unsplash.com/photo-1594488518063-e3c3b0eb6885?auto=format&fit=crop&w=600&q=80',
  paddy_rice: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
  soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80',
  pigeonpea_redgram: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
  groundnut: 'https://images.unsplash.com/photo-1567892328221-1c22937e1b5a?auto=format&fit=crop&w=600&q=80',
  green_gram: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80',
  pearl_millet: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
  sugarcane: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=600&q=80',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80'
};

const TARGET_DIR = path.resolve('public/crops');

async function downloadAll() {
  console.log('Downloading real authentic crop images into public/crops/...\n');
  for (const [id, url] of Object.entries(CROPS_IMAGES)) {
    const dest = path.join(TARGET_DIR, `${id}.jpg`);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(dest, Buffer.from(buffer));
        console.log(`✓ [${id}] Saved ${buffer.byteLength} bytes`);
      } else {
        console.warn(`✗ [${id}] Failed with HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(`✗ [${id}] Error: ${e.message}`);
    }
  }
  console.log('\nFinished downloading crop images.');
}

downloadAll();
