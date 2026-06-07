// GradientToast.tsx — Notificación glassmorphism con auto-dismiss
'use client';

import React, { useEffect } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
}

interface GradientToastProps {
  alerts: Alert[];
  onRemove: (id: string) => void;
}

const styleMap: Record<AlertType, { wrapper: string; icon: React.ReactNode; label: string }> = {
  success: {
    wrapper: 'bg-emerald-50/90 border-emerald-200 text-emerald-800',
    icon: (
      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Éxito',
  },
  error: {
    wrapper: 'bg-red-50/90 border-red-200 text-red-800',
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Error',
  },
  warning: {
    wrapper: 'bg-amber-50/90 border-amber-200 text-amber-800',
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    label: 'Advertencia',
  },
  info: {
    wrapper: 'bg-blue-50/90 border-blue-200 text-blue-800',
    icon: (
      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Info',
  },
};

function Toast({ alert, onRemove }: { alert: Alert; onRemove: (id: string) => void }) {
  const styles = styleMap[alert.type];

  useEffect(() => {
    const timer = setTimeout(() => onRemove(alert.id), alert.type === 'error' || alert.type === 'warning' ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [alert.id, alert.type, onRemove]);

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 max-w-sm w-full
        px-4 py-3 rounded-xl border shadow-lg shadow-slate-200/50
        backdrop-blur-md
        animate-fade-in-up
        ${styles.wrapper}
      `}
    >
      <span className="flex-shrink-0 mt-0.5">{styles.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{alert.message}</p>
      </div>
      <button
        onClick={() => onRemove(alert.id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 text-xs font-bold leading-none p-1 transition-colors"
        aria-label="Cerrar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function GradientToast({ alerts, onRemove }: GradientToastProps) {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      <div className="flex flex-col gap-2 w-full pointer-events-auto">
        {alerts.map((alert) => (
          <Toast key={alert.id} alert={alert} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
