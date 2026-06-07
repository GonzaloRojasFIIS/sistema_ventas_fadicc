// KpiCard.tsx — Tarjeta de KPI con AnimatedCounter y acento degradado
import React from 'react';
import GradientCard from './ui/GradientCard';
import AnimatedCounter from './ui/AnimatedCounter';

export type KpiColor = 'orange' | 'blue' | 'emerald' | 'amber' | 'red';

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  color: KpiColor;
  icon: React.ReactNode;
}

const colorMap: Record<KpiColor, { accent: string; iconBg: string; trendUpBg: string; trendUpText: string; trendDownBg: string; trendDownText: string }> = {
  orange: {
    accent: 'bg-gradient-to-r from-orange-500 to-amber-400',
    iconBg: 'bg-orange-50 text-orange-500 border-orange-200',
    trendUpBg: 'bg-emerald-50',
    trendUpText: 'text-emerald-700',
    trendDownBg: 'bg-red-50',
    trendDownText: 'text-red-700',
  },
  blue: {
    accent: 'bg-gradient-to-r from-blue-500 to-cyan-400',
    iconBg: 'bg-blue-50 text-blue-500 border-blue-200',
    trendUpBg: 'bg-emerald-50',
    trendUpText: 'text-emerald-700',
    trendDownBg: 'bg-red-50',
    trendDownText: 'text-red-700',
  },
  emerald: {
    accent: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-50 text-emerald-500 border-emerald-200',
    trendUpBg: 'bg-emerald-50',
    trendUpText: 'text-emerald-700',
    trendDownBg: 'bg-red-50',
    trendDownText: 'text-red-700',
  },
  amber: {
    accent: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    iconBg: 'bg-amber-50 text-amber-500 border-amber-200',
    trendUpBg: 'bg-emerald-50',
    trendUpText: 'text-emerald-700',
    trendDownBg: 'bg-red-50',
    trendDownText: 'text-red-700',
  },
  red: {
    accent: 'bg-gradient-to-r from-red-500 to-rose-400',
    iconBg: 'bg-red-50 text-red-500 border-red-200',
    trendUpBg: 'bg-emerald-50',
    trendUpText: 'text-emerald-700',
    trendDownBg: 'bg-red-50',
    trendDownText: 'text-red-700',
  },
};

export default function KpiCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  subtitle,
  trend,
  trendUp,
  color,
  icon,
}: KpiCardProps) {
  const styles = colorMap[color];

  return (
    <GradientCard accentTop accentColor={styles.accent}>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              {title}
            </p>
            <h3 className="text-3xl font-black font-mono tracking-tight text-slate-900">
              <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} duration={1000} />
            </h3>
          </div>
          <div
            className={`
              w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm
              ${styles.iconBg}
            `}
          >
            {icon}
          </div>
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100">
            {trend && (
              <span
                className={`font-bold font-mono px-1.5 py-0.5 rounded-md text-[10px] ${
                  trendUp ? styles.trendUpBg + ' ' + styles.trendUpText : styles.trendDownBg + ' ' + styles.trendDownText
                }`}
              >
                {trendUp ? '▲' : '▼'} {trend}
              </span>
            )}
            {subtitle && <span className="text-slate-400 font-medium truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </GradientCard>
  );
}
