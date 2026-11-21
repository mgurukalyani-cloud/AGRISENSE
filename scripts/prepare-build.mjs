import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const sourceHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>AgriSense — The FOF (Friends of Farmers) | Smarter Farming. Better Decisions. Higher Profits.</title>
    <meta name="description" content="AgriSense: Intelligent digital agricultural platform powered by The FOF (Friends of Farmers). Live weather, seasonal crop recommendations, AGMARKNET mandi prices, statistical price forecasting, soil nutrient intelligence, and AI farming assistance." />
    <meta name="theme-color" content="#064e3b" />
    <link rel="preconnect" href="https://api.open-meteo.com" />
    <link rel="preconnect" href="https://geocoding-api.open-meteo.com" />
  </head>
  <body class="bg-[#f7faf7] text-slate-800 antialiased selection:bg-emerald-200 selection:text-emerald-950">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), sourceHtml);
console.log('✓ Prepared root index.html with /src/main.jsx source entry for Vite');
