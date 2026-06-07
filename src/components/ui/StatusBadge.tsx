// StatusBadge.tsx — Pill semántico con dot
import React from 'react';

interface StatusBadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'violet';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const styleMap = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  danger: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  neutral: 'bg-slate-100 border-slate-200 text-slate-600',
  violet: 'bg-violet-50 border-violet-200 text-violet-700',
};

const dotMap = {
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
  violet: 'bg-violet-500',
};

export default function StatusBadge({ variant, children, className = '', dot = true }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5 rounded-full border
        text-xs font-semibold uppercase tracking-wider
        ${styleMap[variant]}
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotMap[variant]} shrink-0`} />}
      {children}
    </span>
  );
}
