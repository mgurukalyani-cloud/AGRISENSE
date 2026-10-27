import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');

console.log('1. Building production assets with Vite...');
execSync('npm run build', { stdio: 'inherit' });

console.log('2. Syncing dist to docs/...');
if (fs.existsSync(DOCS)) {
  fs.rmSync(DOCS, { recursive: true, force: true });
}
fs.mkdirSync(DOCS, { recursive: true });

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(DIST, DOCS);

// Ensure .nojekyll in docs and dist
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');

// Ensure 404.html in docs and dist for SPA routing fallback
fs.writeFileSync(path.join(DOCS, '404.html'), distHtml);
fs.writeFileSync(path.join(DIST, '404.html'), distHtml);

console.log('3. docs/ and dist/ updated successfully!');
