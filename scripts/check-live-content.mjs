async function checkAll() {
  const urls = [
    'https://mgurukalyani-cloud.github.io/AGRISENSE/index.html?v=' + Date.now(),
    'https://mgurukalyani-cloud.github.io/AGRISENSE/docs/index.html?v=' + Date.now(),
    'https://mgurukalyani-cloud.github.io/AGRISENSE/assets/index-DRvudh-y.js?v=' + Date.now()
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(u.split('?')[0], 'status:', res.status);
      if (res.status === 200 && u.includes('index.html')) {
        const text = await res.text();
        console.log('   Script tag:', text.match(/<script [^>]+>/)?.[0]);
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}
checkAll();
