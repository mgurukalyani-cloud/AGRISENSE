import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const sourceHtml = `<!doctype html>
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

fs.writeFileSync(path.join(ROOT, 'index.html'), sourceHtml);
console.log('✓ Prepared root index.html with /src/main.jsx source entry for Vite');
