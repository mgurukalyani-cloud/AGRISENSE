async function inspectLiveJs() {
  const url = 'https://mgurukalyani-cloud.github.io/AGRISENSE/assets/index-B2LfuNuq.js?t=' + Date.now();
  console.log('Fetching:', url);
  const res = await fetch(url);
  const js = await res.text();
  console.log('File size:', js.length);
  const hasOldBug = js.includes('.seasons.map');
  const hasFix = js.includes('displaySeason') || js.includes('SEASONAL') || js.includes('Unsuitable to Sow');
  console.log('Has old .seasons.map bug:', hasOldBug);
  console.log('Has new fix/text:', hasFix);
}
inspectLiveJs();
