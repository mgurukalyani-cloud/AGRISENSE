async function pollUrls() {
  const urls = [
    'https://mgurukalyani-cloud.github.io/AGRISENSE/',
    'https://mgurukalyani-cloud.github.io/AGRISENSE/docs/',
    'https://mgurukalyani-cloud.github.io/AGRISENSE/index.html'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'manual', cache: 'no-store' });
      console.log(url, '=> Status:', res.status);
      const text = await res.text();
      const hasApp = text.includes('id="root"') || text.includes('AgriSense');
      const hasOldRedirect = text.includes("window.location.replace(base + '/docs/'");
      console.log('   Has AgriSense root app:', hasApp, '| Has Old Redirect:', hasOldRedirect);
    } catch (e) {
      console.log(url, '=> Error:', e.message);
    }
  }
}
pollUrls();
