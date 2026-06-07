// GradientButton.tsx — Botón con degradado naranja-ámbar y variantes modernas
import React from 'react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantMap = {
  primary:
    'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:from-orange-400 hover:to-amber-300 focus:ring-orange-500/40',
  secondary:
    'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-slate-300 focus:ring-slate-400/40',
  ghost:
    'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:ring-slate-400/30',
  danger:
    'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 focus:ring-red-500/30',
  success:
    'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-800 focus:ring-emerald-500/30',
};

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2',
};

export default function GradientButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        rounded-lg font-medium
        transition-all duration-150 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
