import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
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

// Ensure root index.html is the source template before building
const sourceIndexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="./klh-logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>AgriSense — Smart Agriculture Weather Monitoring & Advisory</title>
    <meta name="description" content="Professional agricultural weather monitoring system with live observations, 7-day numerical forecasts, historical trends, and agro-meteorological advisories for smart irrigation and crop health." />
    <meta name="theme-color" content="#1b4d3e" />
    <link rel="preconnect" href="https://api.open-meteo.com" />
    <link rel="preconnect" href="https://geocoding-api.open-meteo.com" />
  </head>
  <body class="bg-[#f7faf7] text-slate-800 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'index.html'), sourceIndexHtml);

console.log('1. Rebuilding with Vite to ensure latest bundle from src/main.jsx...');
execSync('npm run build', { stdio: 'inherit' });

console.log('2. Preparing docs/ folder with production assets...');
const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

// Ensure docs/ has identical production assets for GitHub Pages (docs folder)
if (fs.existsSync(DOCS)) {
  fs.rmSync(DOCS, { recursive: true, force: true });
}
copyRecursive(DIST, DOCS);
copyRecursive(path.join(ROOT, 'public/audio'), path.join(DOCS, 'audio'));
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
fs.writeFileSync(path.join(DOCS, '404.html'), distHtml);

// Also copy dist assets and public audio to root assets & audio for fallback
copyRecursive(path.join(DIST, 'assets'), path.join(ROOT, 'assets'));
copyRecursive(path.join(DIST, 'crops'), path.join(ROOT, 'crops'));
copyRecursive(path.join(ROOT, 'public/audio'), path.join(ROOT, 'audio'));
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

console.log('3. Staging and committing to main...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "feat(animal-sound): add instant client-side bio-acoustic classifier and feedback to test sound buttons"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on main.');
}

console.log('4. Pushing main...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('5. Switching to gh-pages...');
execSync('git checkout gh-pages', { stdio: 'inherit' });

console.log('6. Copying dist build directly to root of gh-pages...');
// On gh-pages branch, root index.html MUST be distHtml
copyRecursive(DIST, ROOT);
copyRecursive(path.join(ROOT, 'public/audio'), path.join(ROOT, 'audio'));
fs.writeFileSync(path.join(ROOT, 'index.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '404.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');
if (fs.existsSync(DOCS)) {
  fs.rmSync(DOCS, { recursive: true, force: true });
}
copyRecursive(DIST, DOCS);
copyRecursive(path.join(ROOT, 'public/audio'), path.join(DOCS, 'audio'));
fs.writeFileSync(path.join(DOCS, '404.html'), distHtml);
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');

console.log('7. Staging and committing to gh-pages...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: sync animal sound test sound results to gh-pages"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on gh-pages.');
}

console.log('8. Pushing gh-pages...');
execSync('git push origin gh-pages', { stdio: 'inherit' });

console.log('9. Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });

// Verify main has the source index.html
fs.writeFileSync(path.join(ROOT, 'index.html'), sourceIndexHtml);

console.log('\n=== UNIVERSAL DEPLOYMENT COMPLETED! ===');
