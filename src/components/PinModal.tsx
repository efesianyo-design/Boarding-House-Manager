import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, X, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface PinModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  title = 'Housemaster Security Verification',
  description = 'Enter Senior Housemaster 4-digit security PIN to authorize this administrative action.',
  correctPin,
  onSuccess,
  onClose
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    soundManager.playButtonClick();
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      validatePin(newPin);
    }
  };

  const handleBackspace = () => {
    soundManager.playButtonClick();
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const validatePin = (inputPin: string) => {
    if (inputPin === correctPin) {
      soundManager.playDepartureClick();
      onSuccess();
      onClose();
    } else {
      soundManager.playErrorBuzzer();
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setTimeout(() => setPin(''), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl text-slate-100 transition-all ${
          shake ? 'translate-x-[-10px] animate-pulse ring-2 ring-rose-500' : ''
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100 text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          {description}
        </p>

        {/* PIN dots display */}
        <div className="my-6 flex justify-center gap-4">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                idx < pin.length
                  ? error
                    ? 'border-rose-500 bg-rose-500 scale-110'
                    : 'border-emerald-500 bg-emerald-500 scale-110 shadow-sm shadow-emerald-500/50'
                  : 'border-slate-600 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Incorrect PIN. Default is 1234.</span>
          </div>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-13 rounded-xl bg-slate-800 text-lg font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-700/50"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-13 rounded-xl bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-700/80 active:scale-95 transition flex items-center justify-center border border-slate-800"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-13 rounded-xl bg-slate-800 text-lg font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-700/50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-13 rounded-xl bg-slate-800/60 text-xs font-semibold text-slate-300 hover:bg-slate-700/80 active:scale-95 transition flex items-center justify-center border border-slate-800"
          >
            ⌫ Del
          </button>
        </div>

        <div className="mt-4 text-center">
          <span className="text-[11px] text-slate-500">
            Authorized Housemaster Gate • Default PIN: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">1234</code>
          </span>
        </div>
      </div>
    </div>
  );
};
