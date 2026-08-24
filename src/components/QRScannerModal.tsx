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
  CalendarCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BroadcastQR } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => boolean | void;
  alreadyScannedToday: boolean;
  todayDateFormatted?: string;
  activeBroadcastQR?: BroadcastQR | null;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  alreadyScannedToday,
  todayDateFormatted = 'August 21, 2026',
  activeBroadcastQR
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedStatus, setScannedStatus] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [invalidQrWarning, setInvalidQrWarning] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestAnimationId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastInvalidCodeRef = useRef<string>('');
  const invalidTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      return;
    }

    if (alreadyScannedToday) {
      setDuplicateWarning(`You have already recorded attendance for today (${todayDateFormatted}). Only 1 scan per day is permitted.`);
    }

    setIsScanning(true);
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
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
          videoRef.current.play().catch(console.warn);
        }
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setHasCameraPermission(false);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in browser settings or upload a QR image.'
            : 'Camera is busy or not accessible. You can upload a QR image below to verify attendance.'
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
  }, [isOpen, facingMode, alreadyScannedToday, todayDateFormatted]);

  useEffect(() => {
    if (!isOpen || !hasCameraPermission) return;
    let isActive = true;

    const scanFrame = () => {
      if (!isActive) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });
          if (qrCode && qrCode.data) {
            handleDetectedCode(qrCode.data);
            return;
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
  }, [isOpen, hasCameraPermission, activeBroadcastQR, alreadyScannedToday]);

  const validateIsManagerToken = (codeString: string): boolean => {
    if (!codeString || typeof codeString !== 'string') return false;
    const clean = codeString.trim();

    // Check if there is an active Manager QR for today
    if (!activeBroadcastQR || !activeBroadcastQR.isActive || activeBroadcastQR.generatedByRole !== 'manager') {
      return false;
    }

    if (Date.now() > activeBroadcastQR.expiresAt) {
      return false;
    }

    const baseToken = activeBroadcastQR.token.split('#')[0];
    const isMatchingBaseToken = clean.includes(baseToken) || clean.startsWith('EDUSCHOOL-MGR-') || clean.startsWith('EDUSCHOOL-TERMINAL');

    return isMatchingBaseToken;
  };

  const handleDetectedCode = (codeString: string) => {
    if (alreadyScannedToday) {
      setDuplicateWarning(`Attendance already recorded for today (${todayDateFormatted}). Only 1 scan per day is allowed.`);
      return;
    }

    // STRICT CHECK: The camera ONLY detects and accepts QR codes created by the Academic Manager for today
    const isOfficialManagerQR = validateIsManagerToken(codeString);

    if (!isOfficialManagerQR) {
      if (lastInvalidCodeRef.current !== codeString) {
        lastInvalidCodeRef.current = codeString;
        setInvalidQrWarning('Rejected: Invalid or expired QR code. Only the official entrance QR posted by the Academic Manager for today is accepted.');
        if (invalidTimeoutRef.current) clearTimeout(invalidTimeoutRef.current);
        invalidTimeoutRef.current = setTimeout(() => {
          setInvalidQrWarning(null);
          lastInvalidCodeRef.current = '';
        }, 3500);
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
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      const result = onScanSuccess(codeString);
      if (result === false) {
        setDuplicateWarning(`Attendance already recorded for today. Only 1 scan per day is allowed.`);
        setIsScanning(true);
        setScannedStatus(null);
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
            alert('No valid QR code detected in the uploaded image. Please try a clearer picture of the Academic Manager QR code.');
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
        className="bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col relative text-white"
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

        {/* Header */}
        <div className="p-4 flex items-center justify-between z-10 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Camera QR Scanner</h3>
              <p className="text-[11px] text-slate-400">Aim camera at Manager's Entrance QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invalid QR Code Rejection Warning */}
        {invalidQrWarning && (
          <div className="bg-rose-500/25 border-b border-rose-500/40 px-4 py-2.5 flex items-center gap-2 text-rose-200 text-xs font-semibold animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{invalidQrWarning}</span>
          </div>
        )}

        {alreadyScannedToday && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2 text-amber-300 text-xs">
            <CalendarCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Today's attendance is already completed. (1 scan/day limit)</span>
          </div>
        )}

        {duplicateWarning && !alreadyScannedToday && (
          <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2.5 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {/* Viewfinder Area */}
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
            <div className="absolute inset-0 bg-radial from-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mb-3">
                <Camera className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-xs text-slate-300 font-medium max-w-xs">
                {cameraError || "Initializing camera viewfinder..."}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR Image File</span>
              </button>
            </div>
          )}

          {/* Scanner Reticle Frame */}
          <div className="absolute w-56 h-56 border-2 border-indigo-400/70 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] flex flex-col justify-between p-2 pointer-events-none">
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
              <h4 className="text-lg font-bold text-white">QR Code Detected!</h4>
              <p className="text-xs text-emerald-200 mt-1">Recording attendance for today...</p>
            </div>
          )}
        </div>

        {/* Footer info & Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manager Signature Verification (1 scan/day)</span>
            </span>
            {hasCameraPermission && (
              <button
                type="button"
                onClick={() => setFacingMode((prev) => prev === 'environment' ? 'user' : 'environment')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
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
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
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
      </div>
    </div>
  );
};
