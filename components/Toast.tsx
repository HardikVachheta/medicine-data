'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { formatErrorMessage } from '@/lib/formatError';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number; // ms, default 4000
}

export const Toast: React.FC<ToastProps> = ({
  toast,
  onDismiss,
  duration = 4000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const intervalTime = 50;
    const decrement = (100 / (duration / intervalTime));

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(interval);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  const formattedMsg = toast.type === 'error' 
    ? formatErrorMessage(toast.message)
    : toast.message;

  const defaultTitle = 
    toast.title || 
    (toast.type === 'success' 
      ? 'Success' 
      : toast.type === 'error' 
      ? 'Action Failed' 
      : 'System Notice');

  return (
    <div className="fixed top-5 left-4 right-4 sm:left-auto sm:right-6 z-[9999] max-w-md w-full pointer-events-none transition-all duration-300">
      <div 
        role="alert"
        aria-live="assertive"
        className={`pointer-events-auto rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-950/95 text-emerald-50 border-emerald-500/40 shadow-emerald-950/40'
            : toast.type === 'error'
            ? 'bg-rose-950/95 text-rose-50 border-rose-500/40 shadow-rose-950/40'
            : 'bg-slate-900/95 text-slate-50 border-teal-500/40 shadow-slate-950/40'
        }`}
      >
        <div className="p-4 flex items-start gap-3">
          {/* Distinct Medical UI Icon */}
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            {toast.type === 'error' && (
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            {toast.type === 'info' && (
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              toast.type === 'success' 
                ? 'text-emerald-300' 
                : toast.type === 'error' 
                ? 'text-rose-300' 
                : 'text-teal-300'
            }`}>
              {defaultTitle}
            </h4>
            <p className="text-xs sm:text-sm font-medium mt-0.5 leading-snug break-words opacity-95">
              {formattedMsg}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close notification"
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Second Auto Dismiss Progress Bar */}
        <div className="h-1 w-full bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              toast.type === 'success'
                ? 'bg-emerald-400'
                : toast.type === 'error'
                ? 'bg-rose-400'
                : 'bg-teal-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
