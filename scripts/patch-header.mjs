import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Header.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add import for klhLogoImg
if (!code.includes("import klhLogoImg from '../assets/klh-farms-logo.png';")) {
  code = "import klhLogoImg from '../assets/klh-farms-logo.png';\n" + code;
}

// 2. Replace the button and search block
const startMarker = '{/* Logo & Platform Title (Clickable -> Redirects to Home) */}';
const endMarker = '{/* Right Header Actions */}';

const sIdx = code.indexOf(startMarker);
const eIdx = code.indexOf(endMarker);

if (sIdx === -1 || eIdx === -1) {
  console.error('Could not find markers in Header.jsx');
  process.exit(1);
}

const replacement = `{/* Logo & Platform Title (Clickable -> Redirects to Home) */}
          <button
            onClick={onNavigateHome}
            type="button"
            className="flex items-center space-x-2.5 sm:space-x-3 text-left group cursor-pointer transition-transform hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-2xl p-1 -m-1 shrink-0"
            title={t('app.returnHome', 'Return to Home Page')}
          >
            {/* KLH Farms Logo */}
            <div className="flex items-center justify-center bg-white p-0.5 rounded-full shadow-xs border border-emerald-900/10 shrink-0 overflow-hidden ring-2 ring-emerald-500/25 group-hover:ring-emerald-600 group-hover:scale-105 transition-all">
              <img
                src={klhLogoImg || \`\${import.meta.env.BASE_URL}klh-farms-logo.png\`}
                alt="KLH Farms Logo"
                className="h-11 sm:h-13 w-11 sm:w-13 object-cover rounded-full"
                onError={(e) => {
                  if (e.currentTarget.src !== './klh-farms-logo.png') {
                    e.currentTarget.src = './klh-farms-logo.png';
                  }
                }}
              />
            </div>

            <div className="shrink-0 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 group-hover:text-emerald-800 transition-colors whitespace-nowrap">
                  {t('app.title', 'AgriSense')}
                </span>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
                  {t('app.subtitle', 'Smart Agriculture')}
                </span>
              </div>
              <p className="text-xs text-emerald-700/80 font-medium hidden md:block whitespace-nowrap">
                {t('app.tagline', 'Real-World Weather Monitoring & Agro-Advisory')}
              </p>
            </div>
          </button>

          {/* Center Search / Location Quick Display (Desktop) */}
          <div className="hidden md:flex items-center flex-1 min-w-0 max-w-xs lg:max-w-md mx-2 lg:mx-4">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 hover:border-emerald-300 rounded-xl text-slate-700 transition-all shadow-xs group cursor-pointer min-w-0"
            >
              <div className="flex items-center space-x-2.5 truncate min-w-0">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-slate-900 truncate">
                  {location.name}
                  {location.admin1 ? \`, \${location.admin1}\` : ''}
                </span>
                {location.country_code && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 font-mono shrink-0">
                    {location.country_code}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-medium shrink-0 ml-2">
                <Search className="w-3.5 h-3.5" />
                <span>{t('app.search', 'Search')}</span>
              </div>
            </button>
          </div>

          `;

code = code.substring(0, sIdx) + replacement + code.substring(eIdx);
fs.writeFileSync(file, code);
console.log('✓ Successfully patched Header.jsx');
