'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import {
  KpiData,
  VentaPorDia,
  TopProducto,
  Actividad,
  Proforma,
  Producto,
  OrdenPago,
} from '@/types';
import { getKpis, getVentasPorDia, getTopProductos, getActividadReciente } from '@/services/kpiService';
import { getProducts } from '@/services/productoService';
import { getProformas } from '@/services/proformaService';
import { getOrdenesPago } from '@/services/ordenPagoService';
import GradientCard from '@/components/ui/GradientCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Sector,
} from 'recharts';

const CustomPie = Pie as any;
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Percent,
  AlertTriangle,
  Target,
  Clock,
  ShoppingCart,
  FileText,
  Truck,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  Activity,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  CreditCard,
  Banknote,
  ShieldAlert,
  Zap,
  Wallet,
  Receipt,
  Timer,
  ChevronRight,
  Sparkles,
  Bell,
  Filter,
  RefreshCw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Tipos auxiliares                                                   */
/* ------------------------------------------------------------------ */

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accentFrom?: string;
  accentTo?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  progress?: number;
  alert?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  onClick?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Componente KPI Card — Versión Premium                             */
/* ------------------------------------------------------------------ */

function KpiCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  accentFrom = '#f97316',
  accentTo = '#fbbf24',
  icon,
  trend,
  progress,
  alert,
  loading,
  size = 'md',
  subtitle,
  onClick,
}: KpiCardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const valueSize = {
    sm: 'text-xl',
    md: 'text-2xl lg:text-3xl',
    lg: 'text-3xl lg:text-4xl',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98] group ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
      }}
    >
      {/* Barra de acento superior */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-80"
        style={{
          background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
        }}
      />

      {/* Glow de fondo */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${accentFrom}, transparent)` }}
      />

      <div className={`${sizeClasses[size]} flex flex-col h-full relative z-10`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
              {title}
            </span>
            {alert && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </div>
          <div
            className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              alert
                ? 'bg-red-50 text-red-500 shadow-red-100'
                : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
            }`}
            style={alert ? {} : { background: `linear-gradient(135deg, ${accentFrom}08, ${accentTo}08)` }}
          >
            {icon}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              {prefix && (
                <span className="text-sm font-semibold text-slate-400">{prefix}</span>
              )}
              <AnimatedCounter
                value={value}
                decimals={decimals}
                duration={1200}
                className={`font-extrabold text-slate-800 tracking-tight ${valueSize[size]}`}
              />
              {suffix && (
                <span className="text-sm font-semibold text-slate-400 ml-0.5">{suffix}</span>
              )}
            </div>

            {subtitle && (
              <p className="text-[11px] text-slate-400 font-medium mt-1">{subtitle}</p>
            )}

            {trend && (
              <div className="mt-3 flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${
                    trend.value >= 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {trend.value >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(trend.value).toFixed(1)}%
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{trend.label}</span>
              </div>
            )}

            {progress !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Progreso</span>
                  <span className="text-[10px] font-bold text-slate-600">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(Math.max(progress, 0), 100)}%`,
                      background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tarjeta de Alerta Premium                                         */
/* ------------------------------------------------------------------ */

interface AlertCardProps {
  title: string;
  value: number;
  subtitle: string;
  status: 'critical' | 'warning' | 'info' | 'success';
  icon: React.ReactNode;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

function AlertCard({ title, value, subtitle, status, icon, loading, actionLabel, onAction }: AlertCardProps) {
  const statusConfig = {
    critical: {
      from: '#ef4444',
      to: '#f87171',
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      badge: 'CRÍTICO',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      pulse: true,
    },
    warning: {
      from: '#f59e0b',
      to: '#fbbf24',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      badge: 'ATENCIÓN',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      pulse: true,
    },
    info: {
      from: '#3b82f6',
      to: '#60a5fa',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      badge: 'INFO',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700',
      pulse: false,
    },
    success: {
      from: '#10b981',
      to: '#34d399',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      badge: 'OK',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      onClick={onAction}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${
        onAction ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${config.from}, ${config.to})` }}
      />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                {title}
              </span>
              {config.pulse && value > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: config.from }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: config.from }} />
                </span>
              )}
            </div>

            {loading ? (
              <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse mb-2" />
            ) : (
              <div className="flex items-baseline gap-2 mb-1">
                <AnimatedCounter
                  value={value}
                  duration={800}
                  className="text-3xl font-extrabold text-slate-800 tracking-tight"
                />
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${config.badgeBg} ${config.badgeText}`}>
                  {value > 0 ? config.badge : 'OK'}
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[200px]">
              {subtitle}
            </p>

            {actionLabel && value > 0 && (
              <div
                className="mt-3 flex items-center gap-1 text-[11px] font-bold transition-colors hover:underline"
                style={{ color: config.from }}
              >
                {actionLabel}
                <ChevronRight className="w-3 h-3" />
              </div>
            )}
          </div>

          <div className={`p-3 rounded-xl ${config.bg} ${config.text} ml-4 shrink-0`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip personalizado para AreaChart                              */
/* ------------------------------------------------------------------ */

function CustomAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xl px-5 py-4 min-w-[200px]">
      <p className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">{label}</p>
      <div className="space-y-2">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}40` }}
              />
              <span className="text-xs text-slate-600 font-medium capitalize">{entry.name}</span>
            </div>
            <span className="text-xs font-bold text-slate-800 font-mono tabular-nums">
              S/ {entry.value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip personalizado para BarChart                               */
/* ------------------------------------------------------------------ */

function CustomBarTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xl px-5 py-4">
      <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{data.estado}</p>
      <p className="text-lg font-bold text-slate-800 font-mono">{data.cantidad} <span className="text-sm text-slate-500 font-medium">proformas</span></p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip para PieChart de Ordenes de Pago                          */
/* ------------------------------------------------------------------ */

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xl px-5 py-4">
      <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{data.name}</p>
      <p className="text-lg font-bold text-slate-800 font-mono">
        S/ {data.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
      </p>
      <p className="text-xs text-slate-500 mt-1">{data.percentage}% del total</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icono de actividad mejorado                                       */
/* ------------------------------------------------------------------ */

function ActivityIcon({ tipo }: { tipo: Actividad['tipo'] | 'tramite' }) {
  const map: Record<string, { icon: React.ReactNode; from: string; to: string; border: string }> = {
    venta: {
      icon: <ShoppingCart className="w-4 h-4" />,
      from: '#10b981',
      to: '#34d399',
      border: 'border-emerald-200',
    },
    proforma: {
      icon: <FileText className="w-4 h-4" />,
      from: '#3b82f6',
      to: '#60a5fa',
      border: 'border-blue-200',
    },
    stock: {
      icon: <Package className="w-4 h-4" />,
      from: '#ef4444',
      to: '#f87171',
      border: 'border-red-200',
    },
    pedido: {
      icon: <Truck className="w-4 h-4" />,
      from: '#f59e0b',
      to: '#fbbf24',
      border: 'border-amber-200',
    },
    tramite: {
      icon: <CreditCard className="w-4 h-4" />,
      from: '#8b5cf6',
      to: '#a78bfa',
      border: 'border-violet-200',
    },
  };

  const style = map[tipo] || map.venta;

  return (
    <div
      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm`}
      style={{
        background: `linear-gradient(135deg, ${style.from}12, ${style.to}12)`,
        borderColor: `${style.from}30`,
        color: style.from,
      }}
    >
      {style.icon}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Render Active Shape para PieChart                                 */
/* ------------------------------------------------------------------ */

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 12} dy={8} textAnchor="middle" fill="#1e293b" className="text-sm font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 8} dy={8} textAnchor="middle" fill="#64748b" className="text-xs font-mono">
        S/ {value.toLocaleString('es-PE')}
      </text>
      <text x={cx} y={cy + 28} dy={8} textAnchor="middle" fill="#94a3b8" className="text-[10px]">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 8px ${fill}40)` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/*  Página principal — Dashboard Premium                              */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { usuario, loading: sessionLoading } = useSession();
  const router = useRouter();

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [ventasPorDia, setVentasPorDia] = useState<VentaPorDia[]>([]);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ordenesPago, setOrdenesPago] = useState<OrdenPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateTime, setDateTime] = useState<string>('');
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- Redirección por rol ---------- */
  useEffect(() => {
    if (!sessionLoading) {
      if (!usuario) {
        router.push('/');
      } else if (usuario.rol !== 'ADMIN') {
        if (usuario.rol === 'VENDEDOR') router.push('/dashboard/comercial');
        else if (usuario.rol === 'REPRESENTANTE') router.push('/dashboard/industrial');
        else if (usuario.rol === 'PRODUCCION' || usuario.rol === 'ALMACEN') router.push('/dashboard/produccion');
        else router.push('/dashboard/inventario');
      }
    }
  }, [usuario, sessionLoading, router]);

  /* ---------- Reloj en vivo ---------- */
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateTime(
        now.toLocaleDateString('es-PE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) + ' | ' + now.toLocaleTimeString('es-PE', { hour12: false })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Carga de datos ---------- */
  const loadData = async () => {
    if (!usuario || usuario.rol !== 'ADMIN') return;
    try {
      setRefreshing(true);
      const [kpiRes, ventasRes, topProdRes, prodRes, actRes, profRes, ordenRes] = await Promise.all([
        getKpis(),
        getVentasPorDia(),
        getTopProductos(),
        getProducts(),
        getActividadReciente(),
        getProformas(),
        getOrdenesPago(),
      ]);
      setKpis(kpiRes);
      setVentasPorDia(ventasRes);
      setTopProductos(topProdRes);
      setProductos(prodRes);
      setActividades(actRes);
      setProformas(profRes);
      setOrdenesPago(ordenRes);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (usuario && usuario.rol === 'ADMIN') {
      loadData();
    }
  }, [usuario]);

  /* ---------- Datos derivados ---------- */
  const funnelMetrics = useMemo(() => {
    const total = proformas.length;
    const vigentes = proformas.filter(p => p.estado !== 'RECHAZADA' && p.estado !== 'EXPIRADA').length;
    const negociadas = proformas.filter(p => p.estado === 'EN_NEGOCIACION' || p.estado === 'APROBADA').length;
    const aprobadas = proformas.filter(p => p.estado === 'APROBADA').length;

    const pctVigentes = total > 0 ? (vigentes / total) * 100 : 0;
    const pctNegociadas = total > 0 ? (negociadas / total) * 100 : 0;
    const pctAprobadas = total > 0 ? (aprobadas / total) * 100 : 0;

    const stepVigencia = total > 0 ? (vigentes / total) * 100 : 0;
    const stepNegociacion = vigentes > 0 ? (negociadas / vigentes) * 100 : 0;
    const stepCierre = negociadas > 0 ? (aprobadas / negociadas) * 100 : 0;

    return {
      total,
      vigentes,
      negociadas,
      aprobadas,
      pctVigentes,
      pctNegociadas,
      pctAprobadas,
      stepVigencia,
      stepNegociacion,
      stepCierre,
    };
  }, [proformas]);

  const metaCumplimiento = kpis ? (kpis.real_mensual / kpis.meta_mensual) * 100 : 0;

  const alertasStockBajo = useMemo(
    () => productos.filter((p) => p.stock_actual <= p.stock_minimo).length,
    [productos]
  );

  const alertasProformasVencidas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return proformas.filter((p) => {
      const venc = new Date(p.fecha_vencimiento);
      venc.setHours(0, 0, 0, 0);
      return venc < hoy && (p.estado === 'PENDIENTE' || p.estado === 'EN_NEGOCIACION');
    }).length;
  }, [proformas]);

  /* ================================================================ */
  /*  KPIs de Ordenes de Pago                                         */
  /* ================================================================ */

  const ordenesPagoPendientes = useMemo(() => {
    return ordenesPago.filter((o) => o.estado === 'GENERADA');
  }, [ordenesPago]);

  const montoOrdenesPagoPendientes = useMemo(() => {
    return ordenesPagoPendientes.reduce((sum, o) => sum + (o.monto || 0), 0);
  }, [ordenesPagoPendientes]);

  const ordenesPagoPorBanco = useMemo(() => {
    const bancos: Record<string, number> = {};
    ordenesPagoPendientes.forEach((o) => {
      const banco = o.banco || 'Otros';
      bancos[banco] = (bancos[banco] || 0) + (o.monto || 0);
    });
    const total = Object.values(bancos).reduce((a, b) => a + b, 0);
    return Object.entries(bancos).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
    }));
  }, [ordenesPagoPendientes]);

  const coloresBancos: Record<string, string> = {
    BCP: '#002F87',
    Scotiabank: '#D81E05',
    Niubiz: '#00A9E0',
    Otros: '#64748b',
  };

  const pagosPendientes48h = useMemo(() => {
    const ahora = new Date();
    const hace48h = new Date(ahora.getTime() - 48 * 60 * 60 * 1000);
    return ordenesPago.filter((o) => {
      const fecha = new Date(o.fecha_creacion);
      return o.estado === 'GENERADA' && fecha < hace48h;
    });
  }, [ordenesPago]);

  const montoPagosPendientes48h = useMemo(() => {
    return pagosPendientes48h.reduce((sum, o) => sum + (o.monto || 0), 0);
  }, [pagosPendientes48h]);

  /* ================================================================ */
  /*  Actividades con Trámites Integrados                             */
  /* ================================================================ */

  const actividadesConTramites = useMemo(() => {
    const tramitesActividad: Actividad[] = ordenesPago
      .filter((o) => o.estado === 'GENERADA')
      .slice(0, 5)
      .map((o) => ({
        id: `tramite-${o.id}`,
        tipo: 'tramite' as any,
        descripcion: `Orden de pago ${o.codigo_op} emitida por S/ ${(o.monto || 0).toLocaleString('es-PE')} — ${o.banco}`,
        usuario: 'Representante',
        timestamp: o.fecha_creacion,
      }));
    const combined = [...tramitesActividad, ...actividades].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return combined.slice(0, 10);
  }, [ordenesPago, actividades]);

  /* ---------- Estado de carga global ---------- */
  if (sessionLoading || !usuario || usuario.rol !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 lg:p-8 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-10 w-56 bg-slate-200/70 rounded-xl animate-pulse" />
            <div className="h-5 w-80 bg-slate-200/70 rounded-lg animate-pulse" />
          </div>
          <div className="h-8 w-64 bg-slate-200/70 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200/60 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-200/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ================================================================ */}
      {/*  HERO HEADER — Premium                                           */}
      {/* ================================================================ */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                  Panel de Control
                </h1>
                <p className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Resumen operativo gerencial en tiempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-mono shadow-lg shadow-slate-900/20">
                <Clock className="w-4 h-4 text-slate-400" />
                {dateTime || 'Cargando...'}
              </div>
              <button className="relative p-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm cursor-pointer">
                <Bell className="w-5 h-5" />
                {(alertasStockBajo + alertasProformasVencidas + pagosPendientes48h.length) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                    {alertasStockBajo + alertasProformasVencidas + pagosPendientes48h.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

      {/* ================================================================ */}
      {/*  KPI CARDS — Fila 1: Metricas Principales (4 cols)                 */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Venta Comercial Hoy"
          value={kpis?.venta_comercial_hoy ?? 0}
          prefix="S/ "
          decimals={2}
          accentFrom="#f97316"
          accentTo="#fbbf24"
          icon={<DollarSign className="w-5 h-5" />}
          trend={
            kpis
              ? {
                  value:
                    kpis.venta_comercial_ayer > 0
                      ? ((kpis.venta_comercial_hoy - kpis.venta_comercial_ayer) /
                          kpis.venta_comercial_ayer) *
                        100
                      : 0,
                  label: 'vs ayer',
                }
              : undefined
          }
          loading={loading}
          size="lg"
        />
        <KpiCard
          title="Pedidos Industriales"
          value={kpis?.venta_industrial_activa ?? 0}
          prefix="S/ "
          decimals={2}
          accentFrom="#3b82f6"
          accentTo="#22d3ee"
          icon={<Box className="w-5 h-5" />}
          loading={loading}
          size="lg"
          subtitle="Valor activo en producción"
        />
        <KpiCard
          title="Tasa Conversión"
          value={kpis?.tasa_conversion_proformas ?? 0}
          suffix="%"
          decimals={1}
          accentFrom="#10b981"
          accentTo="#2dd4bf"
          icon={<Percent className="w-5 h-5" />}
          progress={kpis?.tasa_conversion_proformas}
          loading={loading}
          size="lg"
        />
        <KpiCard
          title="Dinero por Cobrar"
          value={montoOrdenesPagoPendientes}
          prefix="S/ "
          decimals={2}
          accentFrom="#8b5cf6"
          accentTo="#c084fc"
          icon={<Wallet className="w-5 h-5" />}
          loading={loading}
          size="lg"
          subtitle={`${ordenesPagoPendientes.length} órdenes en trámite de pago`}
          alert={ordenesPagoPendientes.length > 0}
          onClick={() => router.push('/dashboard/tramites')}
        />
      </div>

      {/* ================================================================ */}
      {/*  KPI CARDS — Fila 2: Metricas Secundarias (4 cols)               */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Ticket Promedio"
          value={kpis?.ticket_promedio ?? 0}
          prefix="S/ "
          decimals={2}
          accentFrom="#6366f1"
          accentTo="#a78bfa"
          icon={<ShoppingCart className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          title="Margen Bruto"
          value={kpis?.margen_bruto_estimado ?? 0}
          suffix="%"
          decimals={1}
          accentFrom="#059669"
          accentTo="#34d399"
          icon={<BarChart3 className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          title="Meta vs Real"
          value={kpis?.real_mensual ?? 0}
          prefix="S/ "
          decimals={0}
          accentFrom="#4f46e5"
          accentTo="#818cf8"
          icon={<Target className="w-5 h-5" />}
          progress={metaCumplimiento}
          loading={loading}
          subtitle={`Meta: S/ ${(kpis?.meta_mensual ?? 0).toLocaleString('es-PE')}`}
        />
        <KpiCard
          title="Proformas Vencidas"
          value={kpis?.proformas_vencidas ?? 0}
          accentFrom="#d97706"
          accentTo="#fbbf24"
          icon={<Clock className="w-5 h-5" />}
          alert={(kpis?.proformas_vencidas ?? 0) > 0}
          loading={loading}
        />
      </div>

      {/* ================================================================ */}
      {/*  ALERTAS — Fila de Alertas Premium (4 cols)                      */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AlertCard
          title="Stock Crítico"
          value={alertasStockBajo}
          subtitle="Productos con stock_actual <= stock_minimo"
          status={alertasStockBajo > 0 ? 'critical' : 'success'}
          icon={<Package className="w-5 h-5" />}
          loading={loading}
          actionLabel="Ver inventario"
          onAction={() => router.push('/dashboard/inventario')}
        />
        <AlertCard
          title="Proformas Vencidas"
          value={alertasProformasVencidas}
          subtitle="PENDIENTE o EN_NEGOCIACIÓN con fecha vencida"
          status={alertasProformasVencidas > 0 ? 'warning' : 'success'}
          icon={<FileText className="w-5 h-5" />}
          loading={loading}
          actionLabel="Ver proformas"
          onAction={() => router.push('/dashboard/industrial')}
        />
        <AlertCard
          title="Pagos > 48h"
          value={pagosPendientes48h.length}
          subtitle={`S/ ${montoPagosPendientes48h.toLocaleString('es-PE', { minimumFractionDigits: 2 })} en órdenes sin cobrar`}
          status={pagosPendientes48h.length > 0 ? 'critical' : 'success'}
          icon={<Timer className="w-5 h-5" />}
          loading={loading}
          actionLabel="Ver órdenes"
          onAction={() => router.push('/dashboard/tramites')}
        />
        <AlertCard
          title="Trámites Totales"
          value={ordenesPagoPendientes.length}
          subtitle={`Total: S/ ${montoOrdenesPagoPendientes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          status={ordenesPagoPendientes.length > 0 ? 'info' : 'success'}
          icon={<Banknote className="w-5 h-5" />}
          loading={loading}
          actionLabel="Ver detalle"
          onAction={() => router.push('/dashboard/tramites')}
        />
      </div>

      {/* ================================================================ */}
      {/*  GRAFICOS SUPERIORES — 3 Columnas                                */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas por Canal */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10">
                  <Activity className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Ventas por Canal</h3>
                  <p className="text-xs text-slate-400 font-medium">Últimos 7 días — Comercial vs Industrial</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/30" />
                  <span className="text-xs text-slate-500 font-medium">Comercial</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
                  <span className="text-xs text-slate-500 font-medium">Industrial</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-80 bg-slate-100/60 rounded-xl animate-pulse" />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ventasPorDia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradComercial" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradIndustrial" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `S/${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomAreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="comercial"
                      name="Comercial"
                      stroke="#f97316"
                      strokeWidth={3}
                      fill="url(#gradComercial)"
                      dot={{ r: 4, strokeWidth: 2.5, fill: '#fff', stroke: '#f97316' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="industrial"
                      name="Industrial"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#gradIndustrial)"
                      dot={{ r: 4, strokeWidth: 2.5, fill: '#fff', stroke: '#3b82f6' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Distribucion de Ordenes de Pago por Banco */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden h-full">
          <div className="p-6 border-b border-slate-100/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                <Banknote className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Dinero por Banco</h3>
                <p className="text-xs text-slate-400 font-medium">Órdenes en trámite de cobro</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-64 bg-slate-100/60 rounded-xl animate-pulse" />
            ) : ordenesPagoPorBanco.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle className="w-12 h-12 mb-3 text-emerald-400" />
                <p className="text-sm font-medium">Sin órdenes pendientes</p>
              </div>
            ) : (
              <div className="flex flex-col justify-between h-full">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <CustomPie
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        data={ordenesPagoPorBanco}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        onMouseEnter={(_: any, index: any) => setActivePieIndex(index)}
                      >
                        {ordenesPagoPorBanco.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={coloresBancos[entry.name] || '#64748b'}
                            strokeWidth={2}
                            stroke="#fff"
                          />
                        ))}
                      </CustomPie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  {ordenesPagoPorBanco.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: coloresBancos[entry.name] || '#64748b' }}
                        />
                        <span className="text-slate-600 font-medium">{entry.name}</span>
                      </div>
                      <span className="text-slate-800 font-bold font-mono">
                        S/ {entry.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  GRAFICOS MEDIOS — Embudo + Actividades / Top Productos          */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embudo de Proformas */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Embudo de Proformas</h3>
                <p className="text-xs text-slate-400 font-medium">Estado actual del pipeline</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-80 bg-slate-100/60 rounded-xl animate-pulse" />
            ) : (
              <div className="flex flex-col gap-6">
                {/* Cabecera del Embudo (Métricas Clave) */}
                <div className="grid grid-cols-5 gap-2 text-center bg-slate-50/60 backdrop-blur-sm rounded-xl p-3 border border-slate-100 shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emitidas</span>
                    <span className="text-sm font-black text-slate-700 font-mono">{funnelMetrics.total}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vigencia %</span>
                    <span className="text-sm font-black text-slate-700 font-mono">{funnelMetrics.pctVigentes.toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Negoc. %</span>
                    <span className="text-sm font-black text-slate-700 font-mono">{funnelMetrics.pctNegociadas.toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cierre %</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">{funnelMetrics.pctAprobadas.toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aprobadas</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">{funnelMetrics.aprobadas}</span>
                  </div>
                </div>

                {/* Cuerpo del Embudo */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  {/* Gráfico 3D del Embudo */}
                  <div className="flex-1 flex justify-center items-center">
                    <svg viewBox="0 0 400 310" className="w-full max-w-[320px] drop-shadow-md filter">
                      {/* Fondo Muted / Agujero superior 3D */}
                      <ellipse cx="200" cy="40" rx="130" ry="18" fill="#6c993c" />
                      
                      {/* Segmento 1: Emitidas (Verde) */}
                      <path
                        d="M 70 40 A 130 18 0 0 1 330 40 L 300 100 A 100 15 0 0 0 100 100 Z"
                        fill="#8cc054"
                        className="hover:brightness-105 transition-all cursor-pointer duration-300"
                      />
                      <text x="200" y="75" textAnchor="middle" fill="#ffffff" className="text-sm font-black select-none tracking-wide">
                        Emitidas
                      </text>

                      {/* Segmento 2: Vigentes (Naranja) */}
                      <path
                        d="M 100 105 A 100 15 0 0 1 300 105 L 270 165 A 70 11 0 0 0 130 165 Z"
                        fill="#e49e46"
                        className="hover:brightness-105 transition-all cursor-pointer duration-300"
                      />
                      <text x="200" y="140" textAnchor="middle" fill="#ffffff" className="text-sm font-black select-none tracking-wide">
                        Vigentes
                      </text>

                      {/* Segmento 3: Negociadas (Teal) */}
                      <path
                        d="M 130 170 A 70 11 0 0 1 270 170 L 240 230 A 40 8 0 0 0 160 230 Z"
                        fill="#3aa89f"
                        className="hover:brightness-105 transition-all cursor-pointer duration-300"
                      />
                      <text x="200" y="205" textAnchor="middle" fill="#ffffff" className="text-sm font-black select-none tracking-wide">
                        Negociadas
                      </text>

                      {/* Segmento 4: Aprobadas (Rojo Coral) */}
                      <path
                        d="M 160 235 A 40 8 0 0 1 240 235 L 215 290 A 15 5 0 0 0 185 290 Z"
                        fill="#d36353"
                        className="hover:brightness-105 transition-all cursor-pointer duration-300"
                      />
                      <text x="200" y="268" textAnchor="middle" fill="#ffffff" className="text-xs font-black select-none tracking-wide">
                        Aprobadas
                      </text>
                    </svg>
                  </div>

                  {/* Columna de Tasas y Cantidades (Lado derecho del embudo) */}
                  <div className="flex flex-col justify-center items-center gap-1.5 font-mono text-slate-700 bg-slate-50/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 min-w-[140px] shadow-sm select-none">
                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Emitidas</span>
                      <span className="text-base font-extrabold text-slate-800">{funnelMetrics.total}</span>
                    </div>
                    
                    <div className="flex flex-col items-center my-1">
                      <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full mt-0.5 border border-blue-100 shadow-sm">
                        Vigencia: {funnelMetrics.stepVigencia.toFixed(0)}%
                      </span>
                      <svg className="w-3.5 h-3.5 text-slate-300 mt-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Vigentes</span>
                      <span className="text-base font-extrabold text-slate-800">{funnelMetrics.vigentes}</span>
                    </div>

                    <div className="flex flex-col items-center my-1">
                      <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full mt-0.5 border border-amber-100 shadow-sm">
                        Negoc.: {funnelMetrics.stepNegociacion.toFixed(0)}%
                      </span>
                      <svg className="w-3.5 h-3.5 text-slate-300 mt-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Negociadas</span>
                      <span className="text-base font-extrabold text-slate-800">{funnelMetrics.negociadas}</span>
                    </div>

                    <div className="flex flex-col items-center my-1">
                      <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5 border border-emerald-100 shadow-sm">
                        Cierre: {funnelMetrics.stepCierre.toFixed(0)}%
                      </span>
                      <svg className="w-3.5 h-3.5 text-slate-300 mt-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Aprobadas</span>
                      <span className="text-base font-extrabold text-emerald-600">{funnelMetrics.aprobadas}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Productos Más Vendidos */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Top Productos Más Vendidos</h3>
                <p className="text-xs text-slate-400 font-medium">Volumen e ingresos del mes</p>
              </div>
            </div>
            <StatusBadge variant="neutral" dot={false}>Este mes</StatusBadge>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100/60 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="pb-3 pr-4">Producto</th>
                      <th className="pb-3 pr-4 text-center">Unidades</th>
                      <th className="pb-3 pr-4 text-right">Ingreso</th>
                      <th className="pb-3 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topProductos.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-4">
                          <span className="text-sm font-semibold text-slate-800">{p.nombre}</span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className="text-sm font-bold text-slate-600 font-mono">{p.unidades}</span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="text-sm font-bold text-slate-800 font-mono">
                            S/ {p.ingreso.toLocaleString('es-PE')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {p.stock_restante === 0 ? (
                            <StatusBadge variant="danger">Agotado</StatusBadge>
                          ) : p.stock_restante <= 3 ? (
                            <StatusBadge variant="warning">{p.stock_restante}</StatusBadge>
                          ) : (
                            <span className="text-sm font-bold text-slate-600 font-mono">{p.stock_restante}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actividad Reciente + Trámites */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-indigo-500/10">
              <Activity className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Actividad Reciente y Trámites</h3>
              <p className="text-xs text-slate-400 font-medium">Registro unificado de operaciones comerciales, de stock y cobranza</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 bg-slate-100/60 rounded-xl animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-100/60 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-slate-100/60 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-[20px] top-2 bottom-2 w-px bg-slate-200" />
              <div className="space-y-5">
                {actividadesConTramites.map((a) => (
                  <div key={a.id} className="relative flex gap-4 items-start">
                    <ActivityIcon tipo={a.tipo} />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {a.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{a.usuario}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(a.timestamp).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
