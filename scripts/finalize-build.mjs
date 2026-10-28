import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

if (fs.existsSync(path.join(DIST, 'index.html'))) {
  const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'index.html'), distHtml);
  fs.writeFileSync(path.join(ROOT, '404.html'), distHtml);
  fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');
  
  // Copy all assets, images, and folders from DIST to ROOT
  copyRecursive(DIST, ROOT);
  copyRecursive(path.join(ROOT, 'public/audio'), path.join(ROOT, 'audio'));

  if (fs.existsSync(DOCS)) {
    fs.rmSync(DOCS, { recursive: true, force: true });
  }
  copyRecursive(DIST, DOCS);
  copyRecursive(path.join(ROOT, 'public/audio'), path.join(DOCS, 'audio'));
  fs.writeFileSync(path.join(DOCS, '404.html'), distHtml);
  fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
  console.log('✓ Finalized root and docs/ copies with production bundle for static GitHub Pages');
}
