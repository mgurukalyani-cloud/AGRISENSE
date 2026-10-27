import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('1. Rebuilding with Vite to ensure latest bundle...');
execSync('npm run build', { stdio: 'inherit' });

console.log('2. Preparing root and docs/ copies...');
const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

// Ensure root has production assets
copyRecursive(path.join(DIST, 'assets'), path.join(ROOT, 'assets'));
copyRecursive(path.join(DIST, 'crops'), path.join(ROOT, 'crops'));
fs.writeFileSync(path.join(ROOT, 'index.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '404.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

// Ensure docs/ has identical production assets
if (fs.existsSync(DOCS)) {
  fs.rmSync(DOCS, { recursive: true, force: true });
}
copyRecursive(DIST, DOCS);
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
fs.writeFileSync(path.join(DOCS, '404.html'), distHtml);

console.log('3. Staging and committing to main...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: universal production bundle across root and docs"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on main.');
}

console.log('4. Pushing main...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('5. Switching to gh-pages...');
execSync('git checkout gh-pages', { stdio: 'inherit' });

console.log('6. Checking out docs, assets, crops, index.html from main into gh-pages...');
execSync('git checkout main -- index.html 404.html .nojekyll assets docs crops', { stdio: 'inherit' });

console.log('7. Staging and committing to gh-pages...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: sync universal bundle on gh-pages"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on gh-pages.');
}

console.log('8. Pushing gh-pages...');
execSync('git push origin gh-pages', { stdio: 'inherit' });

console.log('9. Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });

console.log('\n=== UNIVERSAL DEPLOYMENT COMPLETED! ===');
