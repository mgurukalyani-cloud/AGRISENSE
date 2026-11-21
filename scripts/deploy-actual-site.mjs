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

console.log('1. Staging and committing restored actual site to main...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "fix(site): restore actual AgriSense 10-card dashboard layout without KLH logo and landing page"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on main.');
}

console.log('2. Pushing main...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('3. Switching to gh-pages...');
execSync('git checkout gh-pages', { stdio: 'inherit' });

console.log('4. Cleaning up previous obsolete assets on gh-pages...');
const obsoleteFiles = [
  'assets/index-BWEp7ZQe.js',
  'assets/index-D2nB_BCa.css',
  'assets/favicon-YitIFxGv.svg',
  'assets/index-_1k8ilKQ.js',
  'docs/assets/index-BWEp7ZQe.js',
  'docs/assets/index-D2nB_BCa.css',
  'docs/assets/favicon-YitIFxGv.svg'
];
for (const f of obsoleteFiles) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { force: true });
    console.log('Cleaned obsolete file on gh-pages:', f);
  }
}

console.log('5. Syncing build directly to gh-pages root...');
copyRecursive(DIST, ROOT);
copyRecursive(path.join(ROOT, 'public/audio'), path.join(ROOT, 'audio'));
copyRecursive(path.join(ROOT, 'public/crops'), path.join(ROOT, 'crops'));
copyRecursive(path.join(ROOT, 'public/samples'), path.join(ROOT, 'samples'));

const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'index.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '404.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: sync restored actual AgriSense dashboard to GitHub Pages"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on gh-pages.');
}

console.log('6. Pushing gh-pages...');
execSync('git push origin gh-pages', { stdio: 'inherit' });

console.log('7. Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });

console.log('\n=== UNIVERSAL DEPLOYMENT COMPLETED! ===');
