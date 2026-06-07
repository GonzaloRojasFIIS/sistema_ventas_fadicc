// GradientCard.tsx — Tarjeta con fondo glassmorphism claro y opción de acento degradado en borde superior
import React from 'react';

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  accentTop?: boolean;
  accentColor?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export default function GradientCard({
  children,
  className = '',
  accentTop = false,
  accentColor = 'bg-gradient-to-r from-orange-500 to-amber-400',
  hover = true,
  clickable = false,
  onClick,
}: GradientCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white/90 backdrop-blur-sm
        border border-slate-200/60
        rounded-xl
        shadow-sm shadow-slate-200/50
        overflow-hidden
        transition-all duration-200 ease-out
        ${hover ? 'hover:shadow-lg hover:shadow-orange-500/5 hover:border-orange-200/80 hover:-translate-y-0.5' : ''}
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {accentTop && (
        <div className={`h-1 w-full ${accentColor}`} />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
