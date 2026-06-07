// GlassInput.tsx — Input con fondo translúcido y focus degradado
import React, { forwardRef } from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: boolean;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ iconLeft, iconRight, error, className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full
            bg-white/80 backdrop-blur-sm
            border rounded-lg
            text-sm text-slate-800 placeholder:text-slate-400
            outline-none
            transition-all duration-150
            focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${iconLeft ? 'pl-10' : 'pl-3.5'}
            ${iconRight ? 'pr-10' : 'pr-3.5'}
            ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}
            py-2.5
            ${className}
          `}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none">
            {iconRight}
          </span>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
export default GlassInput;
