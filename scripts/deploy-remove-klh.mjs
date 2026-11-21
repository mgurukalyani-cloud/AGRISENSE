import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');

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

console.log('1. Staging and committing cleanup to main...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "fix(branding): remove KLH Farms logo and cover landing page; direct launch into AgriSense The FOF dashboard"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on main.');
}

console.log('2. Pushing main...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('3. Switching to gh-pages...');
execSync('git checkout gh-pages', { stdio: 'inherit' });

console.log('4. Cleaning up KLH files on gh-pages...');
const filesToDelete = [
  'klh-farms-cover.jpg',
  'klh-farms-logo.png',
  'klh-farms-logo.jpg',
  'klh-logo.png',
  'cover-page.jpg',
  'assets/klh-logo-D2PxWICW-D2PxWICW.png',
  'assets/klh-logo-D2PxWICW.png',
  'assets/klh-farms-cover-B2VdOQEY.jpg',
  'docs/klh-farms-cover.jpg',
  'docs/klh-farms-logo.png',
  'docs/klh-farms-logo.jpg',
  'docs/klh-logo.png',
  'docs/cover-page.jpg',
  'docs/assets/klh-logo-D2PxWICW.png',
  'docs/assets/klh-farms-cover-B2VdOQEY.jpg'
];
for (const f of filesToDelete) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { force: true });
    console.log('Removed from gh-pages:', f);
  }
}

console.log('5. Syncing clean build directly to gh-pages...');
copyRecursive(DIST, ROOT);
copyRecursive(path.join(ROOT, 'public/audio'), path.join(ROOT, 'audio'));
const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'index.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '404.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: remove KLH Farms logo and cover landing page; direct launch into AgriSense dashboard"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on gh-pages.');
}

console.log('6. Pushing gh-pages...');
execSync('git push origin gh-pages', { stdio: 'inherit' });

console.log('7. Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });

console.log('\n=== UNIVERSAL DEPLOYMENT COMPLETED! ===');
