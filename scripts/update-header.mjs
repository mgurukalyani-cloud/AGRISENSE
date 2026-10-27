import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Header.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add onNavigateHome to prop list
code = code.replace(
  'onOpenVoiceAssistant,',
  'onOpenVoiceAssistant,\n  onNavigateHome,'
);

// 2. Locate and replace Logo & Platform Title
const startMarker = '{/* Logo & Platform Title */}';
const endMarker = '{/* Center Search / Location Quick Display (Desktop) */}';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* Logo & Platform Title (Clickable -> Redirects to Home) */}
          <button
            onClick={onNavigateHome}
            type="button"
            className="flex items-center space-x-2.5 sm:space-x-3 text-left group cursor-pointer transition-transform hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-2xl p-1 -m-1"
            title={t('app.returnHome', 'Return to Home Page')}
          >
            {/* KLH Farms Logo */}
            <div className="flex items-center bg-white p-0.5 rounded-full shadow-xs border border-emerald-900/10 shrink-0 overflow-hidden ring-2 ring-emerald-500/25 group-hover:ring-emerald-600 group-hover:scale-105 transition-all">
              <img
                src={\`\${import.meta.env.BASE_URL}klh-farms-logo.png\`}
                alt="KLH Farms Logo"
                className="h-11 sm:h-13 w-11 sm:w-13 object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.src = './klh-farms-logo.png';
                }}
              />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 group-hover:text-emerald-800 transition-colors">
                  {t('app.title', 'AgriSense')}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {t('app.subtitle', 'Smart Agriculture')}
                </span>
              </div>
              <p className="text-xs text-emerald-700/80 font-medium hidden sm:block">
                {t('app.tagline', 'Real-World Weather Monitoring & Agro-Advisory')}
              </p>
            </div>
          </button>
        </div>

        `;

  code = code.slice(0, startIndex) + replacement + code.slice(endIndex);
  fs.writeFileSync(file, code);
  console.log('✓ Header.jsx updated successfully: Extra icon removed & Logo made clickable!');
} else {
  console.error('Could not find markers in Header.jsx');
}
