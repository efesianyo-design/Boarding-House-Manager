import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, QrCode, RefreshCw, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { Student } from '../types';

interface ScannerModalProps {
  isOpen: boolean;
  students: Student[];
  onScan: (studentId: string) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  students,
  onScan,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        startBarcodeDetection();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Permission denied or camera unavailable';
      setCameraError(errorMsg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startBarcodeDetection = () => {
    // Check if BarcodeDetector is supported in Chromium/Android
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: new (options?: { formats: string[] }) => { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;

    if (!BarcodeDetectorClass) {
      return;
    }

    try {
      const detector = new BarcodeDetectorClass({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a']
      });

      const detectFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animationFrameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue.trim();
            handleSuccessfulScan(rawVal);
            return;
          }
        } catch {
          // ignore detection frame errors
        }

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    } catch {
      // unsupported format
    }
  };

  const handleSuccessfulScan = (code: string) => {
    soundManager.playButtonClick();
    stopCamera();
    onScan(code);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Digital Gate Scanner</h3>
              <p className="text-[11px] text-slate-400">Scan Student ID Barcode or QR Tag</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {cameraActive && (
              <button
                onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
                title="Switch Camera"
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Overlay Targeting Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-48 h-48 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] flex items-center justify-center">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-sm" />
              
              {/* Laser scanning bar animation */}
              <div className="w-full h-0.5 bg-emerald-400/90 shadow-[0_0_12px_#10b981] animate-bounce" />
            </div>
          </div>

          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-sm font-medium text-slate-200 mb-1">Camera Stream Notice</p>
              <p className="text-xs text-slate-400 mb-3 max-w-xs">{cameraError}</p>
              <p className="text-xs text-emerald-400 font-medium">Use the Quick Barcode selector below</p>
            </div>
          )}
        </div>

        {/* Manual Barcode Entry & Kiosk Quick Select */}
        <div className="p-4 bg-slate-900 overflow-y-auto space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Enter Student ID (e.g. BH-2026-014)"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5"
            >
              Verify
            </button>
          </form>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Simulated Gate Kiosk Test Cards
              </span>
              <span className="text-[10px] text-slate-500">Tap to instantly scan</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {students.slice(0, 6).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSuccessfulScan(s.id)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-left transition flex items-center justify-between group"
                >
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-200 group-hover:text-emerald-400 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.id} • {s.room}</p>
                  </div>
                  <CheckCircle className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
