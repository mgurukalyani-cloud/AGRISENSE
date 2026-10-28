import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');

console.log('1. Staging and committing to main...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "fix(voice-assistant): resolve HTTP 405 on GitHub Pages and enable offline agricultural reasoning engine"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on main.');
}

console.log('2. Pushing main...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('3. Switching to gh-pages...');
execSync('git checkout gh-pages', { stdio: 'inherit' });

console.log('4. Syncing build directly to gh-pages...');
const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'index.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '404.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

// Copy dist/assets to gh-pages assets/
const distAssets = path.join(DIST, 'assets');
const rootAssets = path.join(ROOT, 'assets');
if (fs.existsSync(distAssets)) {
  if (!fs.existsSync(rootAssets)) fs.mkdirSync(rootAssets, { recursive: true });
  const files = fs.readdirSync(distAssets);
  for (const f of files) {
    fs.copyFileSync(path.join(distAssets, f), path.join(rootAssets, f));
  }
}

execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: update voice assistant client-side engine on gh-pages"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on gh-pages.');
}

console.log('5. Pushing gh-pages...');
execSync('git push origin gh-pages', { stdio: 'inherit' });

console.log('6. Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });

console.log('\n=== UNIVERSAL DEPLOYMENT COMPLETED! ===');
