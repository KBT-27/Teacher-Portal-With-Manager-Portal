import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  CalendarCheck,
  Link as LinkIcon,
  Clock,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BroadcastQR, AttendanceTimeSettings } from '../types';
import { storage } from '../lib/storage';
import { audioAlerts } from '../lib/audioAlerts';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string, method?: 'qr' | 'link') => boolean | void;
  alreadyScannedToday: boolean;
  todayDateFormatted?: string;
  activeBroadcastQR?: BroadcastQR | null;
  attendanceRules?: AttendanceTimeSettings;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  alreadyScannedToday,
  todayDateFormatted = 'August 21, 2026',
  activeBroadcastQR,
  attendanceRules
}) => {
  const [modalMode, setModalMode] = useState<'camera' | 'manual_link'>('camera');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedStatus, setScannedStatus] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [invalidQrWarning, setInvalidQrWarning] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Manual link entry state
  const [manualLinkInput, setManualLinkInput] = useState('');
  const [manualLinkError, setManualLinkError] = useState<string | null>(null);
  const [manualLinkSuccess, setManualLinkSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestAnimationId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastInvalidCodeRef = useRef<string>('');
  const invalidTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to extract clean token from URL or raw string
  const extractTokenFromInput = (raw: string): string => {
    if (!raw) return '';
    let trimmed = raw.trim();
    
    // Check if it's a full URL containing '?code=' or '&code='
    if (trimmed.includes('code=')) {
      try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com/${trimmed}`);
        const codeParam = urlObj.searchParams.get('code');
        if (codeParam) return decodeURIComponent(codeParam);
      } catch {
        const match = trimmed.match(/[?&]code=([^&]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]);
      }
    }

    // Strip dynamic slot extensions
    const clean = trimmed.split('#')[0];
    return clean;
  };

  const getEffectiveQR = (): BroadcastQR | null => {
    if (activeBroadcastQR && activeBroadcastQR.isActive) return activeBroadcastQR;
    const stored = storage.getBroadcastQR();
    if (stored && stored.isActive) return stored;
    return activeBroadcastQR || null;
  };

  useEffect(() => {
    if (!isOpen) {
      if (requestAnimationId.current) {
        cancelAnimationFrame(requestAnimationId.current);
        requestAnimationId.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setScannedStatus(null);
      setDuplicateWarning(null);
      setInvalidQrWarning(null);
      setCameraError(null);
      setManualLinkError(null);
      setManualLinkSuccess(null);
      setManualLinkInput('');
      return;
    }

    if (alreadyScannedToday) {
      setDuplicateWarning(`You have already recorded attendance for today (${todayDateFormatted}). Only 1 check-in per day is permitted.`);
    }

    if (modalMode !== 'camera') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    setIsScanning(true);
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: facingMode, 
              width: { ideal: 1280 }, 
              height: { ideal: 720 } 
            }
          });
        } catch {
          // Fallback to basic video constraint if specific facingMode or dimensions are not supported
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setHasCameraPermission(true);
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('muted', 'true');
          videoRef.current.play().catch(console.warn);
        }
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setHasCameraPermission(false);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera access denied. Please allow camera permissions in browser settings or use Manual link entry below.'
            : 'Camera scanner is currently unavailable in this environment. Please use Manual link entry.'
        );
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (requestAnimationId.current) {
        cancelAnimationFrame(requestAnimationId.current);
        requestAnimationId.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, modalMode, facingMode, alreadyScannedToday, todayDateFormatted]);

  // Frame processing for camera scanning with jsQR & Native BarcodeDetector
  useEffect(() => {
    if (!isOpen || modalMode !== 'camera' || !hasCameraPermission) return;
    let isActive = true;

    // Optional Native BarcodeDetector check
    let barcodeDetector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        barcodeDetector = null;
      }
    }

    const scanFrame = async () => {
      if (!isActive) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        // 1. Try Native BarcodeDetector if available for fastest hardware scan
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleDetectedCode(barcodes[0].rawValue);
              return;
            }
          } catch {
            // Fall through to canvas jsQR
          }
        }

        // 2. High-precision canvas frame processing with jsQR
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const width = Math.min(video.videoWidth, 800);
            const scale = width / video.videoWidth;
            const height = Math.floor(video.videoHeight * scale);

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video, 0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, width, height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth'
            });
            if (qrCode && qrCode.data) {
              handleDetectedCode(qrCode.data);
              return;
            }
          }
        }
      }
      requestAnimationId.current = requestAnimationFrame(scanFrame);
    };

    requestAnimationId.current = requestAnimationFrame(scanFrame);

    return () => {
      isActive = false;
      if (requestAnimationId.current) {
        cancelAnimationFrame(requestAnimationId.current);
      }
    };
  }, [isOpen, modalMode, hasCameraPermission, activeBroadcastQR, alreadyScannedToday]);

  const validateIsManagerToken = (codeString: string): boolean => {
    if (!codeString || typeof codeString !== 'string') return false;
    const raw = codeString.trim();
    const extracted = extractTokenFromInput(raw);
    const effectiveQR = getEffectiveQR();

    // If active QR broadcast exists
    if (effectiveQR && effectiveQR.isActive) {
      const baseToken = effectiveQR.token.split('#')[0];
      if (
        extracted === baseToken ||
        extracted.includes(baseToken) ||
        baseToken.includes(extracted) ||
        raw.includes(baseToken) ||
        (effectiveQR.id && (raw.includes(effectiveQR.id) || extracted.includes(effectiveQR.id)))
      ) {
        return true;
      }
    }

    // Accepts any authorized manager or mentor QR token format
    if (
      extracted.startsWith('EDUSCHOOL-MGR-') || 
      extracted.startsWith('EDUSCHOOL-') || 
      extracted.startsWith('ABUNE-') || 
      extracted.startsWith('ATT-') ||
      extracted.includes('-MGR-') ||
      raw.includes('EDUSCHOOL-MGR-') ||
      raw.includes('attendance?code=')
    ) {
      return true;
    }

    return false;
  };

  const handleDetectedCode = (codeString: string) => {
    if (alreadyScannedToday) {
      setDuplicateWarning(`Attendance already recorded for today (${todayDateFormatted}). Only 1 scan per day is allowed.`);
      return;
    }

    const isValid = validateIsManagerToken(codeString);

    if (!isValid) {
      if (lastInvalidCodeRef.current !== codeString) {
        lastInvalidCodeRef.current = codeString;
        audioAlerts.playInvalidCodeTone();
        setInvalidQrWarning('⚠️ ACCESS DENIED: Unrecognized QR Code. Only the official entrance QR code generated for today or an authorized manual link is accepted.');
        if (invalidTimeoutRef.current) clearTimeout(invalidTimeoutRef.current);
        invalidTimeoutRef.current = setTimeout(() => {
          setInvalidQrWarning(null);
          lastInvalidCodeRef.current = '';
        }, 4000);
      }

      requestAnimationId.current = requestAnimationFrame(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }
      });
      return;
    }

    // Valid Manager QR Detected
    setInvalidQrWarning(null);
    setIsScanning(false);
    setScannedStatus('Verified');
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.6 }
    });

    const cleanToken = extractTokenFromInput(codeString);

    setTimeout(() => {
      const result = onScanSuccess(cleanToken, 'qr');
      if (result === false) {
        setDuplicateWarning(`Attendance already recorded for today. Only 1 scan per day is allowed.`);
        setIsScanning(true);
        setScannedStatus(null);
      } else {
        onClose();
      }
    }, 1200);
  };

  const handleManualLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualLinkError(null);
    setManualLinkSuccess(null);

    const input = manualLinkInput.trim();
    if (!input) {
      setManualLinkError('Please paste the attendance link or code.');
      return;
    }

    if (alreadyScannedToday) {
      setManualLinkError(`Attendance already recorded for today (${todayDateFormatted}). Only 1 check-in per day is permitted.`);
      return;
    }

    const isValid = validateIsManagerToken(input);
    if (!isValid) {
      audioAlerts.playInvalidCodeTone();
      setManualLinkError('⚠️ ACCESS DENIED: Unrecognized attendance link or code. Only the official daily QR code or verified authorized manual link is permitted.');
      return;
    }

    const cleanToken = extractTokenFromInput(input);
    setManualLinkSuccess('Attendance link verified! Recording check-in...');
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      const result = onScanSuccess(cleanToken, 'link');
      if (result === false) {
        setManualLinkError('Attendance already recorded for today.');
        setManualLinkSuccess(null);
      } else {
        onClose();
      }
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (alreadyScannedToday) {
      setDuplicateWarning(`Attendance already recorded for today (${todayDateFormatted}). Only 1 scan per day is allowed.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode && qrCode.data) {
            handleDetectedCode(qrCode.data);
          } else {
            alert('No valid QR code detected in the uploaded image. Please ensure the QR code is clear.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <canvas ref={canvasRef} className="hidden" />
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload} 
        />

        {/* Modal Top Header Bar */}
        <div className="p-4 flex items-center justify-between z-10 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              {modalMode === 'camera' ? <Camera className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Faculty Attendance Check-in</h3>
              <p className="text-[11px] text-slate-400">Official Manager & Mentor Verification</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs: Camera Scanner vs Manual link entry */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 border-b border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setModalMode('camera')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              modalMode === 'camera' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setModalMode('manual_link')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              modalMode === 'manual_link' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Manual Link Entry</span>
          </button>
        </div>

        {/* Invalid Warnings & Alerts */}
        {invalidQrWarning && modalMode === 'camera' && (
          <div className="bg-rose-500/25 border-b border-rose-500/40 px-4 py-2.5 flex items-center gap-2 text-rose-200 text-xs font-semibold animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{invalidQrWarning}</span>
          </div>
        )}

        {alreadyScannedToday && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2 text-amber-300 text-xs">
            <CalendarCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Today's attendance is already completed. (1 check-in/day limit)</span>
          </div>
        )}

        {duplicateWarning && !alreadyScannedToday && (
          <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2.5 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW A: CAMERA SCANNER */}
        {/* ========================================================================= */}
        {modalMode === 'camera' && (
          <>
            <div className="relative w-full h-80 bg-black flex items-center justify-center overflow-hidden">
              {hasCameraPermission ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center mb-3">
                    <Camera className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium max-w-xs">
                    {cameraError || "Initializing camera scanner viewfinder..."}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setModalMode('manual_link')}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Use Manual Link Entry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload QR</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Reticle Frame */}
              <div className="absolute w-56 h-56 border-2 border-blue-400/70 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] flex flex-col justify-between p-2 pointer-events-none">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl-md -mt-2 -ml-2" />
                  <div className="w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr-md -mt-2 -mr-2" />
                </div>
                {isScanning && !alreadyScannedToday && (
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
                )}
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl-md -mb-2 -ml-2" />
                  <div className="w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br-md -mb-2 -mr-2" />
                </div>
              </div>

              {/* Success Overlay */}
              {scannedStatus && (
                <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20 animate-in zoom-in-95">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
                  <h4 className="text-lg font-bold text-white">QR Code Verified!</h4>
                  <p className="text-xs text-emerald-200 mt-1">Recording attendance for today...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Manager & Mentor Signature Verified</span>
                </span>
                {hasCameraPermission && (
                  <button
                    type="button"
                    onClick={() => setFacingMode((prev) => prev === 'environment' ? 'user' : 'environment')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Flip Camera</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upload QR Image</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW B: MANUAL LINK ENTRY (Requested format) */}
        {/* ========================================================================= */}
        {modalMode === 'manual_link' && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Manual link entry
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Paste the attendance link your mentor shared to check in.
              </p>
            </div>

            {manualLinkError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{manualLinkError}</span>
              </div>
            )}

            {manualLinkSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{manualLinkSuccess}</span>
              </div>
            )}

            <form onSubmit={handleManualLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Attendance Link / Code:
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={manualLinkInput}
                    onChange={(e) => setManualLinkInput(e.target.value)}
                    placeholder="https://…/attendance?code=…"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={alreadyScannedToday}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Check in with link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Attendance Rules Box */}
            {(() => {
              const lateMinutes = activeBroadcastQR?.lateAfterMinutes !== undefined
                ? activeBroadcastQR.lateAfterMinutes
                : (attendanceRules?.lateAfterMinutes ?? 15);
              const stopTimeStr = activeBroadcastQR?.stopTime || attendanceRules?.stopTime || '09:30';
              const lateTimeStr = activeBroadcastQR?.lateTime || attendanceRules?.lateTime || '08:15';

              return (
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider pb-1 border-b border-slate-800/80">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Attendance Verification Window Rules</span>
                  </div>
                  <div className="space-y-1.5 pt-1 text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span><strong>Present:</strong> within the first {lateMinutes} minutes.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span><strong>Late:</strong> after {lateMinutes} minutes ({lateTimeStr}) but before the session closes ({stopTimeStr}).</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span><strong>Absent:</strong> no valid scan before closing ({stopTimeStr}).</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

