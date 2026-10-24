import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Info,
  Tag,
  Crosshair,
  Volume2,
  VolumeX
} from 'lucide-react';
import WeatherContext from './WeatherContext';
import speechService from '../../services/speechService';
import { getLanguageByCode } from '../../i18n/languages';

export default function PlantAnalysisResult({
  analysis,
  imageSource,
  currentWeather,
  dailyWeather,
  location,
  tempUnit,
  onReset
}) {
  const { t, i18n } = useTranslation();
  const [showHotspots, setShowHotspots] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!analysis || !analysis.diseaseInfo) return null;

  const { diseaseInfo, confidence, metrics, hotspots, modelProvider, analyzedAt } = analysis;
  const isHealthy = diseaseInfo.severity === 'HEALTHY';

  const currentLang = i18n.language || 'en';
  const currentLangMeta = getLanguageByCode(currentLang);

  // Severity color metadata
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          badge: 'bg-emerald-600 text-white',
          titleColor: 'text-emerald-900',
          statusText: 'Healthy Plant Foliage'
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-100 text-rose-950 border-rose-300',
          badge: 'bg-rose-600 text-white',
          titleColor: 'text-rose-950',
          statusText: 'Critical Disease Hazard'
        };
      case 'HIGH':
      case 'MODERATE_TO_HIGH':
        return {
          bg: 'bg-orange-100 text-orange-950 border-orange-300',
          badge: 'bg-orange-600 text-white',
          titleColor: 'text-orange-950',
          statusText: 'Active Disease Detected'
        };
      default:
        return {
          bg: 'bg-amber-100 text-amber-950 border-amber-300',
          badge: 'bg-amber-600 text-white',
          titleColor: 'text-amber-950',
          statusText: 'Moderate Foliar Symptoms'
        };
    }
  };

  const style = getSeverityStyle(diseaseInfo.severity);

  const handleToggleVoice = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    let speechText = '';
    if (currentLang === 'te') {
      speechText = isHealthy 
        ? `${diseaseInfo.cropName} ఆకు ఆరోగ్యంగా ఉంది. వ్యాధి లక్షణాలు లేవు.`
        : `${diseaseInfo.cropName} పంటలో ${diseaseInfo.diseaseName} గుర్తించబడింది. విశ్వసనీయత ${confidence} శాతం. తక్షణ చర్య: ${diseaseInfo.treatments.immediate}`;
    } else if (currentLang === 'hi') {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} की पत्तियां स्वस्थ हैं। कोई बीमारी नहीं पाई गई।`
        : `${diseaseInfo.cropName} में ${diseaseInfo.diseaseName} की पहचान हुई है। सटीकता ${confidence} प्रतिशत है। तत्काल कदम: ${diseaseInfo.treatments.immediate}`;
    } else if (currentLang === 'mr') {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} चे पान निरोगी आहे. कोणताही रोग नाही.`
        : `${diseaseInfo.cropName} पिकावर ${diseaseInfo.diseaseName} आढळला आहे. अचूकता ${confidence} टक्के आहे. त्वरित उपाय: ${diseaseInfo.treatments.immediate}`;
    } else if (currentLang === 'ta') {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} இலை ஆரோக்கியமாக உள்ளது.`
        : `${diseaseInfo.cropName} பயிரில் ${diseaseInfo.diseaseName} கண்டறியப்பட்டுள்ளது. துல்லியம் ${confidence} சதவீதம். உடனடி நடவடிக்கை: ${diseaseInfo.treatments.immediate}`;
    } else if (currentLang === 'kn') {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} ಎಲೆಯು ಆರೋಗ್ಯಕರವಾಗಿದೆ.`
        : `${diseaseInfo.cropName} ಬೆಳೆಯಲ್ಲಿ ${diseaseInfo.diseaseName} ರೋಗ ಕಂಡುಬಂದಿದೆ. ನಿಖರತೆ ${confidence} ಪ್ರತಿಶತ. ತಕ್ಷಣದ ಕ್ರಮ: ${diseaseInfo.treatments.immediate}`;
    } else if (currentLang === 'bn') {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} পাতা সুস্থ আছে।`
        : `${diseaseInfo.cropName} ফসলে ${diseaseInfo.diseaseName} শনাক্ত হয়েছে। নির্ভুলতা ${confidence} শতাংশ। তাৎক্ষণিক পদক্ষেপ: ${diseaseInfo.treatments.immediate}`;
    } else if (currentLang === 'pa') {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} ਪੱਤਾ ਸਿਹਤਮੰਦ ਹੈ।`
        : `${diseaseInfo.cropName} ਫ਼ਸਲ ਵਿੱਚ ${diseaseInfo.diseaseName} ਦੀ ਪਛਾਣ ਹੋਈ ਹੈ। ਸ਼ੁੱਧਤਾ ${confidence} ਪ੍ਰਤੀਸ਼ਤ ਹੈ।`;
    } else if (currentLang === 'gu') {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} પાંદડું તંદુરસ્ત છે.`
        : `${diseaseInfo.cropName} માં ${diseaseInfo.diseaseName} રોગ જણાયો છે. ચોકસાઈ ${confidence} ટકા છે. ત્વરિત પગલાં: ${diseaseInfo.treatments.immediate}`;
    } else if (currentLang === 'ur') {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} پتا صحت مند ہے۔`
        : `${diseaseInfo.cropName} میں ${diseaseInfo.diseaseName} کی تشخیص ہوئی ہے۔ فوری کارروائی: ${diseaseInfo.treatments.immediate}`;
    } else {
      speechText = isHealthy
        ? `${diseaseInfo.cropName} foliage is healthy with uniform tissue structure.`
        : `Diagnosis: ${diseaseInfo.diseaseName} detected in ${diseaseInfo.cropName} with ${confidence} percent confidence. Recommended immediate action: ${diseaseInfo.treatments.immediate}`;
    }

    setIsPlayingAudio(true);
    speechService.speak(speechText, currentLangMeta, () => {
      setIsPlayingAudio(false);
    });
  };

  return (
    <div data-testid="plant-analysis-results" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">{t('plantHealth.analysisCompleted', 'Analysis completed:')}</span>
          <span className="text-xs font-bold text-slate-800">
            {new Date(analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-emerald-700 font-mono font-medium truncate max-w-xs sm:max-w-md">
            {modelProvider}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio Diagnosis Button */}
          <button
            onClick={handleToggleVoice}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-amber-400 text-emerald-950 animate-pulse shadow-xs'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>{t('plantHealth.stopDiagnosis', 'Stop Audio')}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('plantHealth.listenDiagnosis', 'Audio Diagnosis')}</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('plantHealth.analyzeAnother', 'Analyze Another Specimen')}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout: Photo + Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Photograph with Visual Symptom Localization Overlay */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3 sticky top-24">
          <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 shadow-inner group">
            <img
              src={imageSource}
              alt="Analyzed Plant Leaf"
              className="w-full h-full object-cover"
            />

            {/* Visual Localization Hotspots & YOLO Bounding Boxes Overlay */}
            {showHotspots && hotspots && hotspots.map((spot) => {
              const isLeafBox = spot.label?.toLowerCase().includes('leaf');
              return (
                <div
                  key={spot.id}
                  className={`absolute rounded-xl pointer-events-none transition-all ${
                    isLeafBox
                      ? 'border-2 border-emerald-400 bg-emerald-500/20 shadow-md shadow-emerald-500/30'
                      : 'border-2 border-dashed border-rose-500 bg-rose-500/20'
                  }`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.width}%`,
                    height: `${spot.height}%`
                  }}
                >
                  <span
                    className={`absolute -top-5 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-xs ${
                      isLeafBox ? 'bg-emerald-800 text-white border border-emerald-500/40' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isLeafBox ? '🌿 ' : '⚠️ '}{spot.label}
                  </span>
                </div>
              );
            })}

            {isHealthy && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-emerald-950/90 to-transparent text-white text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">Tissue structure uniform and intact</span>
              </div>
            )}
          </div>

          {/* Hotspot Toggle & Image Metrics */}
          <div className="flex items-center justify-between pt-1">
            {hotspots && hotspots.length > 0 ? (
              <button
                onClick={() => setShowHotspots(!showHotspots)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  showHotspots
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                <span>{showHotspots ? 'Hide YOLO Bounding Boxes' : 'Show YOLO Bounding Boxes'}</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 font-medium">
                No focal necrotic lesions detected
              </span>
            )}

            <span className="text-[11px] text-slate-400 font-mono">
              {t('plantHealth.greenCoverage', 'Green Coverage:')} {metrics.chlorophyllCoverage}%
            </span>
          </div>

          {/* Extracted Leaf Crop Card (Demonstrating YOLO -> OpenCV Crop -> MobileNetV2 Pipeline) */}
          {analysis.croppedLeaf && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Focal Leaf Region Isolated by YOLOv8</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                  {analysis.cropBox ? `${analysis.cropBox.width}×${analysis.cropBox.height} px` : 'Auto-Cropped'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-emerald-300 shadow-xs shrink-0">
                  <img
                    src={analysis.croppedLeaf}
                    alt="Isolated Leaf Crop"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-[11px] text-emerald-900 space-y-1">
                  <p className="font-semibold text-emerald-950">
                    OpenCV Bounding Box Extracted
                  </p>
                  <p className="text-slate-600 leading-snug">
                    Standardized to 224×224 RGB tensor and processed by MobileNetV2 pathology classifier.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Diagnostic Intelligence */}
        <div className="lg:col-span-7 space-y-5">
          {/* Diagnostic Header Card */}
          <div className={`p-5 sm:p-6 rounded-3xl border ${style.bg} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${style.badge}`}>
                {style.statusText}
              </span>

              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 bg-white/80 px-3 py-1 rounded-full border border-slate-200">
                <span>{t('plantHealth.modelConfidence', 'Model Confidence:')}</span>
                <span className="text-emerald-700 font-mono">{confidence}%</span>
              </div>
            </div>

            <div>
              <h2 data-testid="diagnosed-condition-title" className={`text-xl sm:text-2xl font-black tracking-tight ${style.titleColor}`}>
                {diseaseInfo.diseaseName}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                {t('plantHealth.cropLabel', 'Crop:')} {diseaseInfo.cropName} • <em className="text-slate-500 font-normal">{diseaseInfo.botanicalName}</em>
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {t('plantHealth.etiologyLabel', 'Pathogen / Etiology:')} <strong>{diseaseInfo.pathogen}</strong>
              </p>

              {/* CV Model Identity Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {analysis.detectedPlant && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-800 text-white text-[11px] font-bold shadow-2xs">
                    <span>🌿 YOLOv8 Localized: {analysis.detectedPlant} Leaf</span>
                  </span>
                )}
                {analysis.rawClass && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-mono text-[11px] shadow-2xs">
                    <span className="text-slate-400">Class:</span>
                    <span>{analysis.rawClass}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Confidence Gauge Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>{t('plantHealth.confidenceMetric', 'Classification Confidence Metric')}</span>
                <span>{confidence}%</span>
              </div>
              <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    analysis.isLowConfidence ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 italic pt-0.5 leading-snug">
                * Statistical model confidence represents neural pattern correlation across 38 PlantVillage pathology classes; not a certified laboratory assay.
              </p>
            </div>

            {/* Real Neural Network Probabilities Breakdown */}
            {analysis.topPredictions && analysis.topPredictions.length > 1 && (
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Neural Classifier Probability Distribution</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">MobileNetV2 (PlantVillage 38-Class)</span>
                </div>
                <div className="space-y-1.5">
                  {analysis.topPredictions.slice(0, 4).map((pred, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className={`truncate max-w-[220px] sm:max-w-xs ${i === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {i + 1}. {pred.label}
                        </span>
                        <span className={`font-mono font-bold ${i === 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {pred.confidence_percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${i === 0 ? 'bg-emerald-600' : 'bg-slate-400'}`}
                          style={{ width: `${pred.confidence_percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Confidence Advisory */}
            {analysis.isLowConfidence && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Low Model Confidence ({confidence}%):</strong> Visual foliar symptoms are partially ambiguous. We advise capturing a clearer photo under diffuse natural light or consulting a local agricultural extension officer.
                </span>
              </div>
            )}

            {/* Optical Clarity Notice */}
            {analysis.clarityWarning && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Optical Focus Notice:</strong> {analysis.clarityWarning}
                </span>
              </div>
            )}
          </div>

          {/* Identified Visual Symptoms Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Tag className="w-4 h-4 text-emerald-700" />
              <span>{t('plantHealth.visibleSymptoms', 'Visible Foliar Symptoms')}</span>
            </h3>

            <div className="space-y-2">
              {diseaseInfo.symptoms.map((symptom, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed">{symptom}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Integrated Weather Context Component */}
          <WeatherContext
            diseaseInfo={diseaseInfo}
            currentWeather={currentWeather}
            dailyWeather={dailyWeather}
            location={location}
            tempUnit={tempUnit}
          />

          {/* Actionable Treatment & Management Protocol */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <span>{t('plantHealth.agronomicPlan', 'Agronomic Action Plan & Intervention Protocol')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-900 block">{t('plantHealth.immediateAction', 'Immediate Cultural Action:')}</span>
                <p className="text-slate-600 leading-relaxed">{diseaseInfo.treatments.immediate}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
                <span className="font-bold text-emerald-950 block">{t('plantHealth.organicControl', 'Organic / Bio-Control:')}</span>
                <p className="text-slate-700 leading-relaxed">{diseaseInfo.treatments.organic}</p>
              </div>
            </div>

            {/* Long-term Prevention */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                {t('plantHealth.preventionStrategies', 'Long-Term Cultural Prevention Strategies:')}
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {diseaseInfo.prevention.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>

            {/* Escalation Advisory */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{t('plantHealth.expertAdvisory', 'When to Seek Expert Agronomic Assessment:')}</span>
              </span>
              <p className="text-slate-700 leading-relaxed">
                {diseaseInfo.escalationAdvisory}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
