# AgriSense — The FOF (Friends of Farmers)
> **Smarter Farming. Better Decisions. Higher Profits.**

A production-quality, premium smart agriculture web application powered by **The FOF — Friends of Farmers**.

AgriSense is an intelligent digital agricultural technology platform designed to help farmers make better, data-driven decisions using live weather intelligence, seasonal crop recommendations, historical and current mandi prices, statistical future market forecasts, soil nutrient intelligence, and an interactive multilingual AI Farming Assistant.

The platform is designed to be mobile-first, highly intuitive, accessible to rural farmers, and optimized for low-bandwidth environments.

---

## 🌟 Core Modules & Architecture

### 1. Homepage Dashboard (Command Center)
- **Personalized Farmer Greeting**: Real-time greeting customized with farmer name, village, district, and current date.
- **Current Agricultural Season Detection**: Automatically detects Kharif, Rabi, or Zaid seasons with sowing/harvest windows.
- **Prominent "Ask AgriSense AI" Bar**: Quick search with voice input in English, Telugu (తెలుగు), and Hindi (हिंदी).
- **4 Actionable Farmer Decision Cues**:
  1. **Rain Forecast**: Probability (%) and expected millimeters within 24 hours.
  2. **Irrigation Advisory**: Direct guidance to *Irrigate* or *Postpone* to prevent waterlogging and save electricity.
  3. **Spraying Feasibility**: Checks wind velocity (< 20 km/h) and rain risk to avoid pesticide wash-off and chemical drift.
  4. **Thermal & Wind Hazard Warning**: Immediate alerts for heat stress (> 35°C) or lodging winds.
- **Current Season Recommended Crops Preview**: Top 3 agro-climatic matches with suitability scores.
- **Today's Mandi Wholesale Rate Highlights**: Ticker showing modal price, daily trend (Rising/Stable/Softening), and min/max bands.
- **Priority Agricultural Early Warnings**: Disease, pest, and market fluctuations.
- **Quick-Access Precision Tools**: Instant shortcuts to all platform modules.

### 2. Live Weather Intelligence & Agro-Advisories
- **Live Microclimate & Observations**: Surface temperature, feels-like, relative humidity, dew point, atmospheric pressure, wind speed, wind gusts, cloud cover, and solar UV index.
- **24-Hour Hourly Operations Timeline**: Hourly temperature curve, precipitation risk percentage, and wind dynamics.
- **7-Day Numerical Weather Outlook**: Daily max/min temperatures, precipitation sum, rain chance, and day drill-down.
- **Historical Weather Records**: Physical surface station observations vs ECMWF ERA5-Land reanalysis estimates.
- **Agro-Meteorological Advisory Engine**: Field trafficability for tractors, foliar disease infection risk, and evapotranspiration ($ET_0$).
- **Data Source Transparency**: Verified provider Open-Meteo & WMO ground stations with last-updated timestamp.

### 3. Seasonal Crop Recommendation Engine
- **Agro-Climatic Multi-Factor Inputs**:
  - State & District
  - Agricultural Season (Kharif / Rabi / Zaid with auto-detection)
  - Soil Type (Alluvial Loam, Black Cotton / Regur, Red Lateritic, Sandy Loam, Clay Loam, Laterite)
  - Soil pH, Nitrogen, Phosphorus, Potassium
  - Water Availability & Irrigation Source (Canal, Borewell, Micro-irrigation, Rainfed)
  - Land Size & Previous Crop (Crop rotation compatibility)
- **Comprehensive Crop Knowledge Base (16 Major Indian Crops)**:
  - Wheat, Paddy Rice, Cotton, Dry Red Chilli, Mustard Seed, Gram / Chickpea, Maize, Soybean, Groundnut, Onion, Tomato, Potato, Pigeonpea / Red Gram, Green Gram / Moong, Pearl Millet / Bajra, Sugarcane.
- **Rich Agronomic Crop Cards**:
  - Crop image, botanical name, category, and suitability score (%)
  - Recommended sowing period and growing duration (days)
  - Water requirement (mm) and critical growth irrigation stages
  - State Agricultural University verified varieties (PAU, PJTSAU, TNAU, IARI)
  - Major pests, diseases, and IPM mitigation protocols
  - CACP baseline cultivation cost (₹/acre), expected yield range, and statutory MSP floor
  - "Why Recommended" AI rationale tailored to the farmer's plot
- **Side-by-Side Multi-Crop Comparator**: Side-by-side metric comparison across yield, cost, water, duration, and net profitability.

### 4. Agricultural Market Intelligence (Mandi Prices & Forecasting)
- **Search & Filter Across Crops**: Search all 16 crops across Telangana, Andhra Pradesh, Maharashtra, Punjab, Gujarat, Madhya Pradesh, Uttar Pradesh, and Karnataka.
- **Current Market Prices**:
  - Modal (reported average) price, Minimum price, Maximum price per quintal (₹/q)
  - Market location, primary APMC yard, district, and arrival volume in metric tons
  - Official data source: AGMARKNET (DMI) and National Agriculture Market (e-NAM) Portal
- **Multi-Period Historical Price Charts (Recharts)**:
  - **7 Days**: Daily price movements
  - **30 Days**: 3-day intervals
  - **90 Days**: Weekly wholesale trends
  - **6 Months**: Bi-weekly arrivals
  - **1 Year**: 12-month seasonal price envelope
  - **Multi-Year**: Annual modal prices (2022 to 2026)
- **Nearby Mandi Logistics & Realization Comparison**:
  - Compares prices across 4+ nearby mandis
  - Factors in transport freight (₹2.8 / km per quintal)
  - Highlights **"Best Selling Market"** for highest net profit realization
- **Statistical Future Price Forecasting Engine**:
  - Forecast horizons: **Next 7 Days**, **Next 15 Days**, **Next 30 Days**
  - Models: Holt-Winters Double Exponential Smoothing, Seasonal SARIMA, 14-Day Weighted Moving Average
  - Displays: Forecast price, expected direction (Bullish ↗, Bearish ↘, Range-bound ↔), and confidence uncertainty band (e.g., ± ₹140)
  - **Strict Data Accuracy Compliance**: Prominent `[FORECAST PREDICTION]` labeling indicating indicative mathematical trends, not guaranteed contractual rates.

### 5. Soil Health and Fertilizer Assistant
- **Soil Test Inputs**: Soil type, pH, Nitrogen (N kg/ha), Phosphorus (P kg/ha), Potassium (K kg/ha), Organic Carbon (OC %), Electrical Conductivity (EC dS/m).
- **Soil Health Vitality Score (0-100)**: Evaluates soil constraints (acidity, alkalinity, salinity, organic carbon deficiency).
- **Nutrient Deficiency Diagnostic Guide**:
  - Visual symptom cards with leaf photos for Nitrogen, Phosphorus, Potassium, Zinc ("Khaira"), and Iron/Boron deficiencies.
  - Chemical corrective sprays and organic management protocols.
- **Scientific Fertilizer Bag Calculator**:
  - Crop-specific NPK requirements adjusted for soil test nutrient availability.
  - Exact bag count for **Urea (45 kg)**, **DAP (50 kg)**, and **MOP Potash (50 kg)**.
  - **Stage-Wise Split Application Schedule**:
    1. Basal Dose (sowing / transplanting)
    2. 1st Top Dressing (tillering / vegetative, 25-30 days)
    3. 2nd Top Dressing (panicle initiation / flowering, 50-60 days)
- **Organic Soil Conditioning**: Recommended dosages for Farmyard Manure (FYM), Vermicompost, Green manuring (Dhaincha/Sunhemp), Biofertilizers (Azotobacter, PSB, KMB), and Neem cake.
- **Hardware Telemetry**: Option to toggle in-situ ESP32 capacitive root-zone sensor telemetry for hardware-equipped plots.

### 6. AI Farming Assistant ("AgriSense AI — Your Farming Companion")
- **Persistent Chatbot & Floating Voice Widget**: Available on all pages.
- **Multilingual Voice & Text**: Full support for **English**, **Telugu (తెలుగు)**, and **Hindi (हिंदी)**, plus scheduled Indian languages.
- **Speech-to-Text (STT) & Text-to-Speech (TTS)**: Web Speech API integration with live microphone animations and adjustable speech speed (slower pace for rural/elderly farmers).
- **Context-Aware Reasoning**: Directly references the farmer's current location, farm profile crops, active season, live weather observations, and current APMC mandi prices.
- **Farmer-Friendly Explanations**: Simple words, step-by-step guidance, and ready suggestion pills.

### 7. Farm Calculators Suite (All 7 Calculators)
1. **Land Area Multi-Unit Converter**: Acres, Guntas (1/40 acre), Bigha (Pucca & Kuchha), Hectares, Cents, Square Yards, Square Meters.
2. **Seed Requirement Calculator**: Computes certified seed kg based on crop seed rate, spacing, and germination test percentage.
3. **Fertilizer Bag Calculator**: Instant bag counts for Urea, DAP, and Potash based on acreage.
4. **Irrigation Water Calculator**: Calculates watering volumes (liters and cubic meters), pump run hours based on motor horsepower (HP), and water savings under drip/sprinkler systems.
5. **Crop Cultivation Investment & Budgeting Calculator**: Itemized costs for land prep, seeds, fertilizers, pesticides, labor, electricity/diesel, and harvesting.
6. **Expected Yield Estimator**: Estimates harvest ranges in Quintals and Metric Tons considering hybrid vigor and irrigation availability.
7. **Profit & Margin Calculator**: Revenue (Yield × Mandi price) minus Total costs = Net Profit, Net Profit per Acre, and Return on Investment (ROI %).

### 8. Agricultural Alerts & Early Warning System
- Real-time weather alerts (heavy rain, severe heat, high wind speeds).
- Pest & disease outbreak warnings (Pink bollworm in cotton, Yellow rust in wheat, Black thrips in chilli) with immediate action steps.
- Mandi price surge and dip alerts.
- Central and state government DBT scheme notices (PM-KISAN, PMFBY crop insurance deadlines).
- Categorized and filterable by crop and location.

### 9. My Farm Profile & Land Holdings
- Stores farmer name, village, district, state, acreage, soil type, irrigation source, currently grown crops, and farming methodology (Conventional, Natural Farming / ZBNF, Certified Organic).
- Persisted in localStorage and synchronizes across the entire application.

### 10. Farmer-Friendly UX & Accessibility
- **Quick 1-Click Language Switcher Pill**: English, తెలుగు, and हिंदी directly accessible in the header.
- **Simple Mode vs Advanced Mode**: Toggle between high-contrast, large-font simple farmer view and detailed agronomic analytics.
- **Touch-Friendly Controls**: Large buttons, high-contrast badges, micro-animations, and fast page loads.

---

## 🛠️ Technology Stack
- **Frontend Framework**: React 19, JavaScript (ES Modules, Vite)
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts (Area charts, Bar charts, Line charts)
- **Icons**: Lucide Icons
- **Internationalization (i18n)**: i18next & react-i18next (English, Telugu, Hindi, and 22 scheduled Indian languages)
- **Voice Intelligence**: Web Speech API (SpeechRecognition + SpeechSynthesisUtterance)
- **Weather API**: Open-Meteo & WMO Station Observation Network
- **Market Data Schema**: AGMARKNET (Directorate of Marketing & Inspection) & e-NAM

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/mgurukalyani-cloud/AGRISENSE.git
cd agrisense-weather

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

---

## 🏛️ Brand & Organization
- **Brand**: AgriSense
- **Organization**: The FOF — Friends of Farmers
- **Tagline**: *Smarter Farming. Better Decisions. Higher Profits.*
- **Mission**: Empowering farmers across India with genuine meteorological observations, agro-climatic crop matching, real mandi price discovery, future forecasting, and AI assistance.
