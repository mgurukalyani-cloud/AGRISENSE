import fs from 'fs';
import path from 'path';

// 1. Update src/components/Header.jsx
const headerPath = path.resolve('src/components/Header.jsx');
let headerCode = fs.readFileSync(headerPath, 'utf8');

// Remove import klhLogoImg
headerCode = headerCode.replace(/import klhLogoImg[^\n]*\n?/, '');

// Replace KLH Farms Logo block with AgriSense Emblem
const oldLogoMarker = '{/* KLH Farms Logo */}';
const endLogoMarker = '<div className="shrink-0 min-w-0">';

const sLogoIdx = headerCode.indexOf(oldLogoMarker);
const eLogoIdx = headerCode.indexOf(endLogoMarker);

if (sLogoIdx !== -1 && eLogoIdx !== -1) {
  const newLogoBlock = `{/* AgriSense Emblem */}
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-emerald-800 via-emerald-700 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/20 ring-2 ring-emerald-500/30 group-hover:ring-emerald-600 group-hover:scale-105 transition-all shrink-0">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-100" />
            </div>

            `;
  headerCode = headerCode.substring(0, sLogoIdx) + newLogoBlock + headerCode.substring(eLogoIdx);
  fs.writeFileSync(headerPath, headerCode);
  console.log('✓ Successfully updated Header.jsx with AgriSense Emblem');
} else {
  console.error('Could not find logo markers in Header.jsx');
}

// 2. Update src/App.jsx
const appPath = path.resolve('src/App.jsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// Remove CoverPage & SplashScreen imports
appCode = appCode.replace(/import SplashScreen[^\n]*\n?/, '');
appCode = appCode.replace(/import CoverPage[^\n]*\n?/, '');

// Remove showSplash & showCoverPage states
appCode = appCode.replace(/\s*const \[showSplash, setShowSplash\] = useState\(false\);/, '');
appCode = appCode.replace(/\s*const \[showCoverPage, setShowCoverPage\] = useState\(true\);/, '');

// Replace KLH Farms pill in Overview hero
appCode = appCode.replace('KLH Farms Precision Agriculture', 'AgriSense Precision Agriculture');

// Remove "View Cover Page" button
const btnMarker = '<button\n                        onClick={() => setShowCoverPage(true)}';
const btnEndMarker = '</button>';
const sBtnIdx = appCode.indexOf(btnMarker);
if (sBtnIdx !== -1) {
  const eBtnIdx = appCode.indexOf(btnEndMarker, sBtnIdx) + btnEndMarker.length;
  appCode = appCode.substring(0, sBtnIdx) + appCode.substring(eBtnIdx);
  console.log('✓ Removed View Cover Page button');
} else {
  // Try CRLF
  const btnMarkerCRLF = '<button\r\n                        onClick={() => setShowCoverPage(true)}';
  const sBtnIdxCRLF = appCode.indexOf(btnMarkerCRLF);
  if (sBtnIdxCRLF !== -1) {
    const eBtnIdxCRLF = appCode.indexOf(btnEndMarker, sBtnIdxCRLF) + btnEndMarker.length;
    appCode = appCode.substring(0, sBtnIdxCRLF) + appCode.substring(eBtnIdxCRLF);
    console.log('✓ Removed View Cover Page button (CRLF)');
  }
}

// Remove the CoverPage and SplashScreen render blocks at bottom
const bottomRenderMarker = '{/* KLH Farms Welcome / Splash Screen (Opens First) */}';
const bottomEndMarker = '</div>\n  );\n}';
const bottomEndMarkerCRLF = '</div>\r\n  );\r\n}';

const sBottom = appCode.indexOf(bottomRenderMarker);
if (sBottom !== -1) {
  let eBottom = appCode.indexOf(bottomEndMarker, sBottom);
  if (eBottom === -1) eBottom = appCode.indexOf(bottomEndMarkerCRLF, sBottom);
  if (eBottom !== -1) {
    appCode = appCode.substring(0, sBottom) + appCode.substring(eBottom);
    console.log('✓ Removed CoverPage and SplashScreen render blocks at bottom');
  }
}

fs.writeFileSync(appPath, appCode);
console.log('✓ Successfully updated App.jsx to directly render actual dashboard');
