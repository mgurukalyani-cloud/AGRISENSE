import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');

console.log('1. Rebuilding with Vite (prebuild -> vite build -> postbuild)...');
execSync('npm run build', { stdio: 'inherit' });

console.log('2. Staging and committing to main...');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "feat(animal-sound): add instant client-side bio-acoustic classifier and feedback to test sound buttons"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on main.');
}

console.log('3. Pushing main...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('4. Switching to gh-pages...');
execSync('git checkout gh-pages', { stdio: 'inherit' });

console.log('5. Syncing build directly to gh-pages...');
const distHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'index.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '404.html'), distHtml);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: sync animal sound test sound results to gh-pages"', { stdio: 'inherit' });
} catch (e) {
  console.log('No new changes to commit on gh-pages.');
}

console.log('6. Pushing gh-pages...');
execSync('git push origin gh-pages', { stdio: 'inherit' });

console.log('7. Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });

console.log('\n=== UNIVERSAL DEPLOYMENT COMPLETED! ===');
