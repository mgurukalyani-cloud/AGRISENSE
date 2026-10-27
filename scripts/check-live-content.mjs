async function checkFull() {
  const res = await fetch('https://mgurukalyani-cloud.github.io/AGRISENSE/?t=' + Date.now());
  const text = await res.text();
  console.log(text);
}
checkFull();
