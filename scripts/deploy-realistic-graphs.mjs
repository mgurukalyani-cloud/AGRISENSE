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

console.log('1. Staging and committing to main...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "feat: realistic high-resolution agrometeorological graphs with actual telemetry and dynamic parameter modes"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on main.');
}

console.log('2. Pushing main...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('3. Switching to gh-pages...');
execSync('git checkout gh-pages', { stdio: 'inherit' });

console.log('4. Syncing build directly to gh-pages root...');
copyRecursive(DIST, ROOT);
if (fs.existsSync(path.join(ROOT, 'public/audio'))) copyRecursive(path.join(ROOT, 'public/audio'), path.join(ROOT, 'audio'));
if (fs.existsSync(path.join(ROOT, 'public/crops'))) copyRecursive(path.join(ROOT, 'public/crops'), path.join(ROOT, 'crops'));
if (fs.existsSync(path.join(ROOT, 'public/samples'))) copyRecursive(path.join(ROOT, 'public/samples'), path.join(ROOT, 'samples'));

const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'index.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '404.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: realistic high-resolution agrometeorological graphs with actual telemetry and dynamic parameter modes"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on gh-pages.');
}

console.log('5. Pushing gh-pages...');
execSync('git push origin gh-pages', { stdio: 'inherit' });

console.log('6. Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });

console.log('\n=== REALISTIC GRAPHS DEPLOYED TO GITHUB PAGES! ===');
