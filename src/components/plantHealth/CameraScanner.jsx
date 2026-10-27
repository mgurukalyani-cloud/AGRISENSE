import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Sparkles,
  AlertCircle,
  Check,
  Zap,
  ZapOff,
  UploadCloud,
  RefreshCw,
  VideoOff,
  ShieldAlert,
  ScanLine
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { analyzePlantImage, detectPlantLeaves } from '../../services/plantDiseaseService';

export default function CameraScanner({ onCapture, onClose, onSwitchToUpload }) {
  const { t } = useTranslation();
  
  // DOM & Media Refs
  const videoRef = useRef(null);
  const activeStreamRef = useRef(null);
  const isMountedRef = useRef(true);
  const initIdRef = useRef(0);
  const isDetectingRef = useRef(false);
  const isAnalyzingRef = useRef(false);

  // Component State
  // Status: 'requesting' | 'starting' | 'ready' | 'error'
  const [cameraStatus, setCameraStatus] = useState('requesting');
  // Error types: 'permission_denied' | 'not_found' | 'in_use' | 'insecure_context' | 'unsupported' | 'generic'
  const [errorType, setErrorType] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) | 'user' (front)
  const [capturedImage, setCapturedImage] = useState(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [availableCamerasCount, setAvailableCamerasCount] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [analysisStep, setAnalysisStep] = useState(1);

  // Real-Time YOLOv8 & On-Device Object Detection State
  const [liveDetections, setLiveDetections] = useState([]);
  const [isLiveDetectEnabled, setIsLiveDetectEnabled] = useState(true);
  const [personWarning, setPersonWarning] = useState(null);

  // Auto-Scan & Reticle Center Detection State
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [isLeafCentered, setIsLeafCentered] = useState(false);
  const [autoScanProgress, setAutoScanProgress] = useState(0);
  const centeredStartTimeRef = useRef(null);
  const autoScanTriggeredRef = useRef(false);

  // Stop all active camera tracks cleanly without triggering re-render loops
  const stopActiveStream = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('AgriSense: Error stopping media track:', e);
        }
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  // Map camera hardware / browser errors to human-friendly feedback
  const categorizeCameraError = useCallback((err) => {
    if (!err) {
      setErrorType('generic');
      setErrorMessage(t('plantHealth.cameraGenericError', 'Unable to access device camera. Please check camera settings or try uploading a photo.'));
      return;
    }

    const errName = err.name || '';
    const rawMessage = err.message || '';

    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      setErrorType('permission_denied');
      setErrorMessage(t('plantHealth.cameraPermissionDenied', 'Camera permission was blocked. Please tap the lock/camera icon in your browser address bar and grant camera access for this site.'));
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      setErrorType('not_found');
      setErrorMessage(t('plantHealth.cameraNotFound', 'No camera hardware detected on this device. Please connect a camera or choose the image upload option.'));
    } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
      setErrorType('in_use');
      setErrorMessage(t('plantHealth.cameraInUse', 'Camera is currently locked or in use by another application or browser tab. Please close conflicting apps and retry.'));
    } else if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
      setErrorType('generic');
      setErrorMessage(t('plantHealth.cameraOverconstrained', 'The requested camera resolution or lens is unavailable. Switching to default camera mode.'));
    } else {
      setErrorType('generic');
      setErrorMessage(rawMessage || t('plantHealth.cameraFailed', 'Failed to initialize camera video feed.'));
    }
  }, [t]);

  // Start real camera using navigator.mediaDevices.getUserMedia with fallback tiers
  const startCamera = useCallback(async (preferredFacing) => {
    const thisInitId = ++initIdRef.current;

    if (!isMountedRef.current) return;

    // Cleanly stop any existing stream first
    stopActiveStream();

    setCameraStatus('requesting');
    setErrorType(null);
    setErrorMessage(null);
    setVideoDimensions({ width: 0, height: 0 });

    // 1. Insecure Context Check (Camera requires HTTPS or localhost)
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      if (thisInitId !== initIdRef.current || !isMountedRef.current) return;
      setCameraStatus('error');
      setErrorType('insecure_context');
      setErrorMessage(
        t('plantHealth.insecureContext', 'Camera access requires a secure connection (HTTPS) or localhost. Please access AgriSense via HTTPS or use the file upload option.')
      );
      return;
    }

    // 2. MediaDevices API Availability Check
    if (!navigator?.mediaDevices?.getUserMedia) {
      if (thisInitId !== initIdRef.current || !isMountedRef.current) return;
      setCameraStatus('error');
      setErrorType('unsupported');
      setErrorMessage(
        t('plantHealth.unsupportedBrowser', 'Camera access is not supported by your current browser. Please update your browser or upload a leaf photograph directly.')
      );
      return;
    }

    // 3. Multi-Tier Constraint Negotiation
    const constraintTiers = [
      {
        video: {
          facingMode: { ideal: preferredFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: {
          facingMode: { ideal: preferredFacing }
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let mediaStream = null;
    let finalError = null;

    for (let i = 0; i < constraintTiers.length; i++) {
      if (thisInitId !== initIdRef.current || !isMountedRef.current) return;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraintTiers[i]);
        if (mediaStream) break;
      } catch (err) {
        finalError = err;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          break;
        }
      }
    }

    if (thisInitId !== initIdRef.current || !isMountedRef.current) {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      return;
    }

    if (!mediaStream) {
      setCameraStatus('error');
      categorizeCameraError(finalError);
      return;
    }

    activeStreamRef.current = mediaStream;
    setCameraStatus('starting');

    try {
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack?.getCapabilities ? videoTrack.getCapabilities() : {};
      setHasTorch(Boolean(capabilities?.torch));
    } catch {
      setHasTorch(false);
    }

    try {
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        if (isMountedRef.current) {
          setAvailableCamerasCount(videoInputs.length);
        }
      }
    } catch {
      // Ignore enumeration failure
    }

    const video = videoRef.current;
    if (!video) return;

    video.srcObject = mediaStream;

    const markVideoReady = () => {
      if (thisInitId !== initIdRef.current || !isMountedRef.current) return;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight
        });
        setCameraStatus('ready');
      }
    };

    try {
      await video.play();
      if (video.videoWidth > 0) {
        markVideoReady();
      }
    } catch (playErr) {
      if (playErr.name !== 'AbortError') {
        console.warn('AgriSense: Video element play notice:', playErr);
      }
    }
  }, [categorizeCameraError, stopActiveStream, t]);

  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight
      });
      setCameraStatus('ready');
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    startCamera(facingMode);

    return () => {
      isMountedRef.current = false;
      initIdRef.current++;
      stopActiveStream();
    };
  }, [facingMode, startCamera, stopActiveStream]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopActiveStream();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, stopActiveStream]);

  // Instant High-Resolution Capture and Direct Disease Diagnosis
  const handleInstantScan = useCallback(async (forceAnalysis = false) => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || isAnalyzingRef.current) return;

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setScanError(null);
    setAnalysisStep(1);

    try {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      setCapturedImage(dataUrl);

      // Stop camera hardware stream cleanly during analysis
      stopActiveStream();

      const timer1 = setTimeout(() => setAnalysisStep(2), 300);
      const timer2 = setTimeout(() => setAnalysisStep(3), 600);

      const result = await analyzePlantImage(dataUrl, null, { forceAnalysis });
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (result && result.success) {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
        onCapture(dataUrl, result);
        onClose();
      } else {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
        setScanError(result?.error || t('plantHealth.cameraGenericError', 'Failed to assess leaf specimen. Please ensure leaf is in sharp focus.'));
      }
    } catch (err) {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setScanError(err.message || 'Image analysis failed. Please retry.');
    }
  }, [facingMode, onCapture, onClose, stopActiveStream, t]);

  // Real-Time YOLO & On-Device Plant Leaf Detection Loop with Auto-Scan Trigger
  useEffect(() => {
    if (cameraStatus !== 'ready' || capturedImage || !isLiveDetectEnabled) {
      setLiveDetections([]);
      setPersonWarning(null);
      setIsLeafCentered(false);
      centeredStartTimeRef.current = null;
      setAutoScanProgress(0);
      return;
    }

    const intervalId = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || isDetectingRef.current || isAnalyzingRef.current) return;

      isDetectingRef.current = true;
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 480 / Math.max(width, height));
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.65);

        const res = await detectPlantLeaves(frameDataUrl);
        if (res && res.success) {
          setLiveDetections(res.detections || []);
          if (res.has_person && !res.has_leaves) {
            setPersonWarning(t('plantHealth.personAlert', 'Person detected in viewfinder. Please aim camera at a plant leaf.'));
            setIsLeafCentered(false);
            centeredStartTimeRef.current = null;
            setAutoScanProgress(0);
          } else {
            setPersonWarning(null);

            // Check if leaf is centered in the central reticle
            const isCentered = Boolean(res.is_centered) || (res.has_leaves && res.detections?.some(d => !d.is_person && d.is_centered));

            if (isCentered) {
              setIsLeafCentered(true);
              const now = Date.now();
              if (!centeredStartTimeRef.current) {
                centeredStartTimeRef.current = now;
                autoScanTriggeredRef.current = false;
                setAutoScanProgress(20);
              } else {
                const elapsed = now - centeredStartTimeRef.current;
                const progress = Math.min(100, Math.round((elapsed / 1100) * 100));
                setAutoScanProgress(progress);

                // Auto-scan fires after holding steady for ~1.1 seconds!
                if (autoScanEnabled && elapsed >= 1100 && !autoScanTriggeredRef.current && !isAnalyzingRef.current) {
                  autoScanTriggeredRef.current = true;
                  handleInstantScan(false);
                }
              }
            } else {
              setIsLeafCentered(false);
              centeredStartTimeRef.current = null;
              setAutoScanProgress(0);
            }
          }
        }
      } catch (err) {
        // Frame drop tolerance
      } finally {
        isDetectingRef.current = false;
      }
    }, 450);

    return () => clearInterval(intervalId);
  }, [cameraStatus, capturedImage, isLiveDetectEnabled, autoScanEnabled, facingMode, handleInstantScan, t]);

  const handleToggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleToggleTorch = async () => {
    if (!activeStreamRef.current) return;
    const track = activeStreamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('AgriSense: Torch constraint application failed:', e);
    }
  };

  // High-precision leaf frame capture for still review mode
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    try {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      if (!dataUrl || dataUrl.length < 500) return;

      stopActiveStream();
      setCapturedImage(dataUrl);
      setScanError(null);

      detectPlantLeaves(dataUrl).then(res => {
        if (res && res.success) {
          setLiveDetections(res.detections || []);
          if (res.has_person && !res.has_leaves) {
            setPersonWarning(t('plantHealth.personAlert', 'Person detected in photo. Please aim at a crop leaf.'));
          } else {
            setPersonWarning(null);
          }
        }
      }).catch(() => {});
    } catch (err) {
      console.error('AgriSense: Frame capture error:', err);
    }
  };

  // Retake photo: clear captured frame and restart camera
  const handleRetake = () => {
    setCapturedImage(null);
    setLiveDetections([]);
    setPersonWarning(null);
    setScanError(null);
    setIsAnalyzing(false);
    isAnalyzingRef.current = false;
    setIsLeafCentered(false);
    centeredStartTimeRef.current = null;
    autoScanTriggeredRef.current = false;
    setAutoScanProgress(0);
    startCamera(facingMode);
  };

  // Analyze already captured leaf photo
  const handleAnalyzeLeaf = async (forceAnalysis = false) => {
    if (!capturedImage || isAnalyzingRef.current) return;

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setScanError(null);
    setAnalysisStep(1);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 350);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 750);

    try {
      const result = await analyzePlantImage(capturedImage, null, { forceAnalysis });
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!result.success && !forceAnalysis) {
        setScanError(result.error || t('plantHealth.cameraGenericError', 'Failed to assess leaf specimen.'));
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      } else {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
        stopActiveStream();
        onCapture(capturedImage, result);
        onClose();
      }
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setScanError(err.message || 'Image analysis failed. Please retry.');
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  };

  const handleClose = () => {
    stopActiveStream();
    onClose();
  };

  const handleSwitchToUpload = () => {
    stopActiveStream();
    if (onSwitchToUpload) {
      onSwitchToUpload();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-emerald-900/40 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 text-white z-20">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold">
                  {t('plantHealth.liveScanner', 'Live Leaf Disease Scanner')}
                </h3>
                {cameraStatus === 'ready' && !capturedImage && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-400 hidden xs:block">
                {t('plantHealth.holdPhone', 'Hold phone steady 15-25cm above affected leaf blade')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Auto-Scan Toggle Switch */}
            {!capturedImage && cameraStatus === 'ready' && (
              <button
                onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  autoScanEnabled
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
                title={autoScanEnabled ? 'Auto-Scan enabled: Scans automatically when leaf is centered' : 'Auto-Scan paused: Tap scan button manually'}
              >
                <span className={`w-2 h-2 rounded-full ${autoScanEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span>Auto-Scan: {autoScanEnabled ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* YOLOv8 Live Detection Toggle */}
            {!capturedImage && cameraStatus === 'ready' && (
              <button
                onClick={() => setIsLiveDetectEnabled(!isLiveDetectEnabled)}
                className={`hidden md:flex px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer items-center space-x-1 ${
                  isLiveDetectEnabled
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-800/60'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
                title={isLiveDetectEnabled ? 'YOLO Live Detection Active' : 'YOLO Detection Paused'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveDetectEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>YOLO</span>
              </button>
            )}

            {/* Torch toggle button */}
            {hasTorch && !capturedImage && cameraStatus === 'ready' && (
              <button
                onClick={handleToggleTorch}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  torchOn ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Toggle Torch / Flashlight"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Switch Camera Button (Front / Rear) */}
            {!capturedImage && availableCamerasCount > 1 && (
              <button
                onClick={handleToggleFacingMode}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title={`Switch Camera (Currently: ${facingMode === 'environment' ? 'Rear' : 'Front'})`}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close Scanner (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden">
          {/* 1. Requesting Permission State */}
          {cameraStatus === 'requesting' && !capturedImage && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center space-y-4 z-10 animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <Camera className="w-7 h-7 animate-pulse text-emerald-400" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-base font-bold text-white">
                  {t('plantHealth.requestingPermTitle', 'Requesting Camera Access')}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t('plantHealth.requestingPermDesc', 'Please select "Allow" when prompted by your browser to view the live optical feed.')}
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{t('plantHealth.awaitingAccess', 'Awaiting camera permission...')}</span>
              </div>
            </div>
          )}

          {/* 2. Starting Camera State */}
          {cameraStatus === 'starting' && !capturedImage && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center space-y-3 z-10 animate-in fade-in duration-150">
              <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-300">
                  {t('plantHealth.startingCameraTitle', 'Connecting Video Stream')}
                </h4>
                <p className="text-xs text-slate-400">
                  {t('plantHealth.startingCameraDesc', 'Synchronizing sensor resolution and optical parameters...')}
                </p>
              </div>
            </div>
          )}

          {/* 3. Camera Error / Blocked States */}
          {cameraStatus === 'error' && (
            <div className="p-6 text-center max-w-md text-white space-y-4 z-10 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                {errorType === 'permission_denied' ? (
                  <ShieldAlert className="w-7 h-7 text-rose-400" />
                ) : errorType === 'not_found' ? (
                  <VideoOff className="w-7 h-7 text-amber-400" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-rose-400" />
                )}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">
                  {errorType === 'permission_denied'
                    ? t('plantHealth.permDeniedTitle', 'Camera Permission Denied')
                    : errorType === 'not_found'
                    ? t('plantHealth.noCameraTitle', 'No Camera Detected')
                    : errorType === 'in_use'
                    ? t('plantHealth.cameraBusyTitle', 'Camera In Use')
                    : errorType === 'insecure_context'
                    ? t('plantHealth.insecureTitle', 'Secure Connection Required')
                    : t('plantHealth.cameraUnavailableTitle', 'Camera Unavailable')}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('plantHealth.retryCamera', 'Try Again')}</span>
                </button>

                <button
                  onClick={handleSwitchToUpload}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('plantHealth.uploadInstead', 'Upload Photo Instead')}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Live Video Preview with Target Viewfinder Reticle */}
          {!capturedImage && (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                onLoadedMetadata={handleVideoMetadata}
                onCanPlay={handleVideoMetadata}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  cameraStatus === 'ready' ? 'opacity-100' : 'opacity-0'
                } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Real-Time YOLOv8 & On-Device Plant & Leaf Bounding Boxes */}
              {cameraStatus === 'ready' && isLiveDetectEnabled && liveDetections && liveDetections.length > 0 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                  {liveDetections.map((det, idx) => {
                    const box = det.box_percent || {
                      x: det.x || 0,
                      y: det.y || 0,
                      width: det.width || 0,
                      height: det.height || 0
                    };
                    const isPerson = det.is_person || det.class_name === 'person';
                    return (
                      <div
                        key={det.id || idx}
                        className={`absolute rounded-2xl transition-all duration-150 pointer-events-none ${
                          isPerson
                            ? 'border-2 border-amber-400 bg-amber-500/10'
                            : 'border-2 border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/30'
                        }`}
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.width}%`,
                          height: `${box.height}%`
                        }}
                      >
                        <div
                          className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center space-x-1 ${
                            isPerson
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-700 text-emerald-100 border border-emerald-400/40'
                          }`}
                        >
                          <span>{isPerson ? '⚠️ Person' : `🌿 ${det.label || det.class_name}`}</span>
                          <span className="opacity-80">({det.confidence}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Person Warning Notification Banner */}
              {cameraStatus === 'ready' && personWarning && (
                <div className="absolute top-14 inset-x-4 z-20 flex items-center justify-center pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-amber-950/95 border border-amber-500/80 text-amber-200 text-xs px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-xl backdrop-blur-md">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold">{personWarning}</span>
                  </div>
                </div>
              )}

              {/* Agronomic Target Reticle with Auto-Scan Lock & Progress Feedback */}
              {cameraStatus === 'ready' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 select-none">
                  <div className={`relative w-64 h-64 sm:w-76 sm:h-76 rounded-3xl transition-all duration-200 ${
                    isLeafCentered
                      ? 'border-3 border-emerald-400 ring-4 ring-emerald-500/40 shadow-2xl shadow-emerald-500/50 scale-[1.02]'
                      : 'border-2 border-emerald-400/40'
                  }`}>
                    {/* Corner Target Markers */}
                    <div className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl transition-all ${
                      isLeafCentered ? 'border-emerald-300 shadow-md shadow-emerald-400/80' : 'border-emerald-400'
                    }`} />
                    <div className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl transition-all ${
                      isLeafCentered ? 'border-emerald-300 shadow-md shadow-emerald-400/80' : 'border-emerald-400'
                    }`} />
                    <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl transition-all ${
                      isLeafCentered ? 'border-emerald-300 shadow-md shadow-emerald-400/80' : 'border-emerald-400'
                    }`} />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-xl transition-all ${
                      isLeafCentered ? 'border-emerald-300 shadow-md shadow-emerald-400/80' : 'border-emerald-400'
                    }`} />

                    {/* Auto-Scan Progress Bar (fills up when leaf is centered) */}
                    {isLeafCentered && autoScanEnabled && autoScanProgress > 0 && (
                      <div className="absolute -top-3.5 inset-x-6 h-2 bg-slate-950/90 rounded-full overflow-hidden border border-emerald-400/60 shadow-lg">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-200 transition-all duration-100 ease-out"
                          style={{ width: `${autoScanProgress}%` }}
                        />
                      </div>
                    )}

                    {/* Scanning Laser Line */}
                    <div className={`absolute inset-x-3 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-md shadow-emerald-400/50 ${
                      isLeafCentered ? 'animate-bounce' : 'animate-pulse'
                    }`} />

                    {/* Centered Crosshair */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${
                      isLeafCentered ? 'opacity-80' : 'opacity-40'
                    }`}>
                      <div className="w-7 h-0.5 bg-emerald-400" />
                      <div className="h-7 w-0.5 bg-emerald-400 -ml-3.5" />
                    </div>

                    {/* Reticle Status Badge */}
                    {isLeafCentered ? (
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-emerald-950/95 text-emerald-200 border border-emerald-400/80 px-4 py-1.5 rounded-full shadow-2xl whitespace-nowrap text-xs font-bold animate-in zoom-in-95 duration-150">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-spin" />
                        <span>
                          {autoScanEnabled
                            ? `🌿 Leaf Locked • Scanning in ${Math.max(1, Math.ceil((100 - autoScanProgress) / 70))}s...`
                            : '🌿 Leaf Locked • Ready to Diagnose'}
                        </span>
                      </div>
                    ) : (
                      <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-emerald-300 bg-slate-900/90 px-3.5 py-1 rounded-full whitespace-nowrap border border-emerald-500/30 shadow-md">
                        {t('plantHealth.centerLeaf', 'Center Leaf in Frame')}
                      </span>
                    )}
                  </div>

                  {/* Prominent Floating "Scan Leaf Now" Shutter Button (Right in Viewport) */}
                  <div className="mt-14 pointer-events-auto z-20">
                    <button
                      onClick={() => handleInstantScan(false)}
                      className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/50 border border-emerald-300/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                      <span>{t('plantHealth.scanDiagnoseNow', 'Scan & Diagnose Leaf Now')}</span>
                    </button>
                  </div>

                  {/* Hardware Stream Resolution Badge */}
                  {videoDimensions.width > 0 && (
                    <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-xs text-[10px] font-mono text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>
                        {videoDimensions.width} × {videoDimensions.height} • {facingMode === 'environment' ? 'Rear' : 'Front'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 5. Captured Leaf Inspection Review / Analyzing State */}
          {capturedImage && (
            <div className="relative w-full h-full flex items-center justify-center bg-black animate-in fade-in duration-200 overflow-hidden">
              <div className="relative max-h-[70vh] flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Captured Leaf Specimen"
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl block"
                />

                {/* YOLO / On-Device Bounding Boxes Over Captured Leaf */}
                {liveDetections && liveDetections.map((det, idx) => {
                  const box = det.box_percent || {
                    x: det.x || 0,
                    y: det.y || 0,
                    width: det.width || 0,
                    height: det.height || 0
                  };
                  const isPerson = det.is_person || det.class_name === 'person';
                  return (
                    <div
                      key={det.id || idx}
                      className={`absolute rounded-xl pointer-events-none transition-all ${
                        isPerson
                          ? 'border-2 border-amber-400 bg-amber-500/15'
                          : 'border-2 border-emerald-400 bg-emerald-500/20 shadow-md shadow-emerald-500/30'
                      }`}
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`
                      }}
                    >
                      <div
                        className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow flex items-center space-x-1 ${
                          isPerson ? 'bg-amber-600 text-white' : 'bg-emerald-700 text-emerald-100 border border-emerald-400/40'
                        }`}
                      >
                        <span>{isPerson ? '⚠️ Person' : `🌿 ${det.label || det.class_name}`}</span>
                        <span className="opacity-80">({det.confidence}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Header Badge */}
              {!isAnalyzing && !scanError && (
                <div className="absolute top-4 left-4 bg-emerald-900/95 text-emerald-100 text-xs px-3.5 py-1.5 rounded-full border border-emerald-500/50 font-semibold flex items-center space-x-2 shadow-lg backdrop-blur-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>
                    {liveDetections && liveDetections.filter(d => !d.is_person && d.class_name !== 'person').length > 0
                      ? `${liveDetections.filter(d => !d.is_person && d.class_name !== 'person').length} Leaf Region(s) Localized — Ready for Diagnosis`
                      : t('plantHealth.sampleCaptured', 'Sample Captured — Ready for Inspection')}
                  </span>
                </div>
              )}

              {/* In-Modal Analyzing Overlay with Real-Time Step Feedback */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center space-y-4 z-30 animate-in fade-in duration-150">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-emerald-300 absolute inset-0 m-auto animate-pulse" />
                  </div>

                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="text-base font-bold text-white">
                      Analyzing Leaf Pathology
                    </h4>
                    <p className="text-xs text-emerald-300 font-medium">
                      {analysisStep === 1 && 'Checking image clarity & leaf structure...'}
                      {analysisStep === 2 && 'Scanning foliar tissue for necrotic & chlorotic lesions...'}
                      {analysisStep >= 3 && 'Evaluating against plant disease classification model...'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Running Agro-Vision Inference Engine...</span>
                  </div>
                </div>
              )}

              {/* Diagnostic Error Notice Overlay */}
              {scanError && !isAnalyzing && (
                <div className="absolute inset-x-4 bottom-4 p-4 rounded-2xl bg-rose-950/95 border border-rose-500/80 text-rose-100 text-xs shadow-2xl backdrop-blur-md space-y-3 z-30 animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-start space-x-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-white text-sm">Image Assessment Notice:</strong>
                      <p className="text-rose-200 mt-0.5 leading-relaxed">{scanError}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-800/60">
                    <button
                      onClick={handleRetake}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('plantHealth.retakePhoto', 'Retake Photo')}</span>
                    </button>

                    <button
                      onClick={handleSwitchToUpload}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t('plantHealth.uploadInstead', 'Upload Photo Instead')}</span>
                    </button>

                    <button
                      onClick={() => handleAnalyzeLeaf(true)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors cursor-pointer underline"
                    >
                      <span>Analyze Anyway</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between z-20">
          {!capturedImage ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-400 hidden sm:inline">
                {t('plantHealth.daylightHint', 'Hold leaf centered in box to auto-scan or tap Scan button')}
              </span>
              <div className="flex items-center space-x-2.5 mx-auto sm:mx-0">
                <button
                  onClick={handleCapture}
                  disabled={cameraStatus !== 'ready'}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                  title="Capture Still Frame First"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xs:inline">Snap Still</span>
                </button>

                <button
                  onClick={() => handleInstantScan(false)}
                  disabled={cameraStatus !== 'ready' || isAnalyzing}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-700/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>{t('plantHealth.scanDiagnoseNow', 'Scan & Diagnose Leaf')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between space-x-3">
              <button
                onClick={handleRetake}
                disabled={isAnalyzing}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('plantHealth.retakePhoto', 'Retake Photo')}</span>
              </button>

              <button
                onClick={() => handleAnalyzeLeaf(false)}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Leaf...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>{t('plantHealth.analyzeCaptured', 'Analyze Captured Leaf')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
