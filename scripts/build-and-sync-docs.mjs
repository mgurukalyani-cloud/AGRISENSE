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

// Ensure .nojekyll in docs
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// In docs/index.html, strip out any root redirect so docs/ can be served as root or subpath cleanly
const docsIndexPath = path.join(DOCS, 'index.html');
let docsHtml = fs.readFileSync(docsIndexPath, 'utf-8');
docsHtml = docsHtml.replace(/<script>[\s\S]*?window\.location\.replace[\s\S]*?<\/script>/, '');
fs.writeFileSync(docsIndexPath, docsHtml);

// Create 404.html in docs and dist for SPA routing fallback
fs.writeFileSync(path.join(DOCS, '404.html'), docsHtml);
fs.writeFileSync(path.join(DIST, '404.html'), docsHtml);

console.log('3. docs/ and dist/ updated successfully!');
