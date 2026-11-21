# AgriSense — Smart Agriculture Weather Monitoring

A modern, high-precision agrometeorological monitoring and decision support web application built as the foundation module of the **AgriSense Smart Agriculture Platform**.

AgriSense equips farmers, agronomists, and agricultural researchers with real-time microclimate intelligence, numerical hourly forecasts, 7-day outlooks, historical trends, and specialized agronomic advisories (irrigation water balance, crop thermal stress, agrochemical spray windows, and fungal infection risks).

---

## 🌾 Key Features

### 1. Real-Time Agrometeorological Monitoring
- **Prominent Temperature & Feels-Like**: High-visibility hero banner with dynamic atmospheric theming.
- **WMO 4677 Standard Interpretation**: Maps World Meteorological Organization codes directly into actionable agricultural notes (e.g., foliar wetness duration, seedbed conditions).
- **Comprehensive Atmospheric Metrics**:
  - Relative Humidity (%) and Dew Point (°C/°F)
  - Precipitation amount (mm/in) and peak probability (%)
  - 10-meter Wind Speed, Gusts, and Compass Direction (with interactive visual dial)
  - Cloud Cover (%) and Barometric Pressure (hPa) with pressure trend
  - Solar UV Index with photosynthesis / canopy protection ratings
  - Sunrise and Sunset solar onset tracking

### 2. Specialized Farm Weather Advisor (Decision Support Engine)
- **Irrigation Guidance**: Calculates water balance offsetting expected precipitation against FAO-56 Penman-Monteith reference evapotranspiration ($ET_0$). Recommends *Postpone*, *Reduce*, or *Irrigate*.
- **Crop Thermal Stress & Frost Hazard**: Monitors 3-day temperature envelopes to warn of critical heat stress ($>36^\circ\text{C}$ causing pollen abortion) or frost danger ($<2^\circ\text{C}$ causing intracellular freezing).
- **Agrochemical Spraying Feasibility Window**: Evaluates wind speed ($<15\text{ km/h}$ required to prevent drift) and foliar wash-off hazard ($>4\text{ hours}$ dry period needed after application).
- **Fungal Pathogen Threat Index**: Evaluates humidity ($>78\%$) and warm temperatures ($18\text{--}28^\circ\text{C}$) favorable for Downy Mildew, Rust, and Late Blight.
- **Soil Trafficability & Heavy Machinery Access**: Assesses soil saturation and rutting risk to protect soil structure from tractor compaction.
- **Field Activity Suitability Index**: Overall score ($0\text{--}100$) summarizing the day's fieldwork feasibility.

### 3. Hourly Forecast (Next 24 to 48 Hours)
- **Dual Presentation**: Toggle between a touch-friendly horizontal card strip and an interactive **Recharts Area & Bar Chart**.
- Shows hourly temperature curve, precipitation risk percentage, and wind dynamics.

### 4. 7-Day Numerical Weather Outlook
- Daily cards with max/min temperature ranges, precipitation sum (mm), probability (%), and wind speeds.
- Interactive day drill-down showing daylight duration, UV peak, and specific agronomic guidance for each date.
- Composed Trend Chart correlating thermal envelopes with daily rainfall.

### 5. Historical Weather Records: Station Observations vs Reanalysis Estimates
- Selectable timeframes: **Last 7 Days (Station)**, **Last 14 Days (Station)**, **Last 30 Days (Reanalysis)**, or **Custom Date Range (Archive)**.
- **Explicit Data Origin Classification**:
  - **Station Observations & Operational Analysis (Last 1–14 Days)**: Physical surface thermometer and rain gauge observations managed by national meteorological services (WMO Global Observing System).
  - **ECMWF ERA5-Land Reanalysis Estimates (30 Days & Custom Archive)**: Global 9 km physical reanalysis assimilating historical surface stations with atmospheric conservation physics.
- Summary statistics: Cumulative rainfall, peak high/low records with exact dates, rain day count, and average temperatures.
- Interactive historical max/min temperature envelope chart and rainfall distribution bar chart.

### 6. Automatic Refresh & Provider Transparency
- **Configurable Auto-Refresh**: Background timer refreshes data automatically every 15 minutes (with countdown timer in header).
- **Manual Refresh**: On-demand refresh button with active spinner.
- **Provider Transparency Notice**: Dedicated indicator explaining why weather readings may differ slightly across mobile weather apps due to differing station locations, forecast models (ECMWF vs GFS vs ICON), and assimilation grid resolutions.

### 7. AI Plant Health & Leaf Disease Analysis (Module Extension)
- **Option A: Live Camera Scanner**:
  - Live rear/front video preview with optical focus reticle and scanline animations.
  - Device camera permission handling and torch/flash toggle.
  - Capture, retake, and inspection before analysis.
  - Safe camera track cleanup on close/unmount.
- **Option B: Leaf Photograph Uploader**:
  - Drag-and-drop or file upload (JPG, PNG, WebP up to 10MB).
  - Validation of file size and MIME types.
  - Preloaded specimen palette of verified agricultural samples (Tomato Early/Late Blight, Potato Blight, Rice Blast, Apple Scab, Healthy leaves) for instant testing.
- **AI Computer Vision Pathology Engine**:
  - Extracts chlorophyll coverage, necrotic lesion clustering, and chlorotic yellowing ratios.
  - Matches pathology against validated agricultural databases (Solanaceae, Poaceae, Rosaceae).
  - Visual localization overlay highlighting suspected lesion zones on the leaf photograph.
  - Outputs plant identification, health status, pathogen etiology, confidence score, and symptom breakdown.
  - Multi-tier actionable recommendations: Immediate cultural controls, organic bio-fungicides, and long-term prevention.
- **Weather-Aware Pathogen Context**:
  - Directly synthesizes the farm's live ambient temperature, relative humidity, and 72-hour rainfall forecast.
  - Highlights environmental conditions accelerating fungal spore germination.
  - Adheres to the **Three-Tier Diagnostic Separation Principle** (Image Model Prediction vs. Weather Risk Assessment vs. General Agronomic Recommendations).

### 8. Global Agricultural Location Search & GPS
- **Worldwide Geocoding**: Search any village, town, district, or agricultural zone worldwide.
- **HTML5 Geolocation**: "Use My Location" requests GPS permission and resolves coordinates via reverse geocoding.
- **Quick Preset Belts**: Ludhiana Ag Belt (Punjab), Salinas Valley (California), Ames Corn Belt (Iowa), Nashik Grape Valley (Maharashtra), and Valencia Citrus Groves (Spain).
- Saved recent searches in `localStorage`.

### 9. Smart Agriculture Modular Architecture
Designed for cohesive extension across precision farming domains:
- **Module 1**: Weather Monitoring & Agro-Climatic Advisory *(Active & Live)*
- **Module 2**: IoT Soil & Root-Zone Telemetry (ESP32) *(Schema & webhook ready)*
- **Module 3**: AI Crop Recommendation Engine *(Pipeline ready)*
- **Module 4**: Automated Solenoid Valve Control *(Relay trigger ready)*
- **Module 5**: AI Plant Disease & Leaf Health Scanner *(Active & Integrated)*

---

## 🎨 Visual & Responsive Design

- **Agricultural Aesthetic**: Deep forest greens (`#0f291e`, `#1b4d3e`), fresh leaf greens (`#2d6a4f`, `#52b788`), warm amber accents, crisp cards, and subtle organic shadows.
- **Responsive Layout**:
  - **Desktop**: Spacious multi-column dashboard with side-by-side metric analytics and full-width trend graphs.
  - **Tablets**: 2-column adaptive flow with optimized touch targets.
  - **Mobile**: Single-column vertical stack with horizontal touch sliders, preventing horizontal page overflow.
- **Units Toggle**: Instant switching between Metric (°C, km/h, mm) and Imperial (°F, mph, in).

---

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts (ComposedChart, AreaChart, BarChart, LineChart)
- **Icons**: Lucide React
- **Meteorological Data**: Open-Meteo API (WMO 4677 standard, FAO-56 Penman-Monteith $ET_0$, Historical Archive, Geocoding)
- **Offline / Demo Resilience**: Built-in high-fidelity agricultural simulation dataset for offline or demo presentations.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or newer recommended, tested on v24)
- npm (v9 or newer)

### Installation
```bash
# Navigate to the project directory
cd agrisense-weather

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will start locally at `http://localhost:5173`.

### Production Build
```bash
npm run build
npm run preview
```

---

## ⚙️ Environment Variables

Open-Meteo operates **free of charge without requiring an API key** for non-commercial and agricultural research use. The application works immediately upon launch.

If you wish to configure custom endpoints or commercial API keys, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_OPEN_METEO_API_KEY` | Commercial API key for high-volume enterprise traffic | *None (Free tier)* |
| `VITE_DEFAULT_LATITUDE` | Default latitude on boot | `30.9010` (Ludhiana Ag Belt) |
| `VITE_DEFAULT_LONGITUDE` | Default longitude on boot | `75.8573` |
| `VITE_ESP32_WEBHOOK_URL` | Endpoint for physical ESP32 soil sensor telemetry | `http://localhost:5000/api/v1/telemetry/esp32` |

---

## 📂 Project Architecture

```
agrisense-weather/
├── public/
│   ├── favicon.svg                  # AgriSense sprout symbol
│   └── ...
├── src/
│   ├── components/
│   │   ├── Header.jsx               # App branding, search trigger, GPS, refresh, units toggle
│   │   ├── NavigationTabs.jsx       # 4 tabs: Live, Past, Forecast, Farm Advisor
│   │   ├── CurrentWeatherCard.jsx   # Hero card with prominent temperature & condition
│   │   ├── WeatherMetricsGrid.jsx   # 8-card agrometeorological metrics grid
│   │   ├── FarmWeatherAdvisor.jsx   # 5 agronomic decision cards & activity score
│   │   ├── HourlyForecastStrip.jsx  # 24-48h scrollable cards & interactive trend chart
│   │   ├── FutureForecastView.jsx   # 7-day outlook cards, day drill-down, and trend graph
│   │   ├── HistoricalWeatherView.jsx# Past weather filters (7d, 14d, 30d, custom), records, charts
│   │   ├── LocationSearchModal.jsx  # Global geocoding search & preset ag belts
│   │   ├── PlatformModulesDrawer.jsx# Smart Agriculture 5-module expansion roadmap & ESP32 simulator
│   │   ├── SettingsModal.jsx        # Units (°C/°F), Demo Mode toggle, custom coords
│   │   ├── WeatherAlertBanner.jsx   # Real-time agricultural alerts (frost, heat, gale, hail)
│   │   ├── WeatherIcon.jsx          # Lucide-based dynamic weather icon renderer
│   │   └── Footer.jsx               # Standards attribution & platform links
│   ├── services/
│   │   ├── weatherApi.js            # Open-Meteo forecast, archive, and geocoding fetchers
│   │   ├── agroAdvisor.js           # Agro-meteorological decision logic (irrigation, spraying, stress)
│   │   ├── weatherUtils.js          # WMO mapping, VPD calculations, unit conversions
│   │   └── demoData.js              # High-fidelity synthetic agricultural dataset for demo mode
│   ├── App.jsx                      # Main application orchestrator & state manager
│   ├── index.css                    # Tailwind CSS v4 styling & animations
│   └── main.jsx
├── .env.example
├── package.json
└── vite.config.js
```

---

## 📡 ESP32 Hardware Integration Roadmap (Module 2)

AgriSense includes a pre-defined webhook contract for IoT capacitive soil probes. When deploying ESP32 microcontrollers in farm sectors, flash them with code that sends JSON POST requests:

```json
{
  "node_id": "esp32-field-sector-01",
  "timestamp": "2026-10-16T11:00:00Z",
  "battery_voltage": 3.95,
  "soil_moisture_pct": 38.4,
  "soil_temperature_c": 21.8,
  "nitrogen_ppm": 48,
  "phosphorus_ppm": 19,
  "potassium_ppm": 37
}
```

The **Farm Weather Advisor** automatically synthesizes these physical soil readings with upcoming rainfall forecasts to prevent unnecessary irrigation cycles.

---

## 📜 Agronomic Notice
All recommendations produced by the Farm Weather Advisor are generated from numerical meteorological models and FAO-56 standards. Field operators should verify local soil physical state prior to chemical applications or critical irrigation shutdowns.
