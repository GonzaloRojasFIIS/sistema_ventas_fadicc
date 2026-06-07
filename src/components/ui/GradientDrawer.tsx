// GradientDrawer.tsx — Panel lateral deslizable con glassmorphism
'use client';

import React, { useEffect } from 'react';

interface GradientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export default function GradientDrawer({ isOpen, onClose, title, children, size = 'md', footer }: GradientDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in-up"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`
          relative w-full ${sizeMap[size]} h-full
          bg-white border-l border-slate-200/80
          shadow-2xl shadow-black/10
          overflow-y-auto
          animate-[fade-in-up_0.3s_ease-out]
          transform transition-transform duration-300 ease-out
        `}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
