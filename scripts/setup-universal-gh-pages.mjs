import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(ROOT, 'docs');
const DOCS_DOCS = path.join(DOCS, 'docs');

// 1. In docs/, create docs/docs/index.html that redirects to ../
if (!fs.existsSync(DOCS_DOCS)) {
  fs.mkdirSync(DOCS_DOCS, { recursive: true });
}

const redirectHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>AgriSense — Redirecting</title>
    <script>
      // Automatically redirect into the repository root where AgriSense is mounted
      var target = window.location.pathname.replace(/\\/docs\\/?$/, '/');
      window.location.replace(target + window.location.search + window.location.hash);
    </script>
  </head>
  <body>
    Redirecting to <a href="../">AgriSense</a>...
  </body>
</html>`;

fs.writeFileSync(path.join(DOCS_DOCS, 'index.html'), redirectHtml);
fs.writeFileSync(path.join(DOCS_DOCS, '404.html'), redirectHtml);

// 2. Universal 404.html for docs/ and root
const distIndex = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

// Inject smart 404 recovery script into 404.html
const smart404 = distIndex.replace('</head>', `  <script>
    (function() {
      var path = window.location.pathname;
      if (path.includes('/docs/')) {
        var clean = path.replace(/\\/docs\\/?/, '/');
        window.location.replace(clean + window.location.search + window.location.hash);
      }
    })();
  </script>
</head>`);

fs.writeFileSync(path.join(DOCS, '404.html'), smart404);
fs.writeFileSync(path.join(DIST, '404.html'), smart404);
fs.writeFileSync(path.join(ROOT, '404.html'), smart404);

// 3. Ensure .nojekyll in all folders
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
fs.writeFileSync(path.join(DOCS_DOCS, '.nojekyll'), '');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

console.log('Universal GitHub Pages multi-mount structure created successfully!');
