async function pollUntilLive() {
  const targetScript = 'index-DRvudh-y.js';
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const res = await fetch('https://mgurukalyani-cloud.github.io/AGRISENSE/?nocache=' + Date.now());
      const text = await res.text();
      const hasBundle = text.includes(targetScript);
      console.log(`[Attempt ${attempt}/12] Live index contains ${targetScript}: ${hasBundle}`);
      if (hasBundle) {
        console.log('SUCCESS: Live deployment completed!');
        process.exit(0);
      }
    } catch (e) {
      console.log(`[Attempt ${attempt}] Error:`, e.message);
    }
    await new Promise(r => setTimeout(r, 8000));
  }
  console.log('Timed out waiting for CDN propagation.');
  process.exit(0);
}
pollUntilLive();
