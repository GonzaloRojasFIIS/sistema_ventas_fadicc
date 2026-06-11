'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import {
  dbService,
  KpiData,
  VentaPorDia,
  TopProducto,
  Actividad,
  VendedorPerformance,
  Proforma,
  Producto,
} from '@/lib/db';
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
} from 'recharts';
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
  accentColor?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  progress?: number; // 0-100
  alert?: boolean;
  loading?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Componente KPI Card                                               */
/* ------------------------------------------------------------------ */

function KpiCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  accentColor = 'from-orange-500 to-amber-400',
  icon,
  trend,
  progress,
  alert,
  loading,
}: KpiCardProps) {
  return (
    <GradientCard accentTop accentColor={`bg-gradient-to-r ${accentColor}`} hover>
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className={`p-2 rounded-lg ${alert ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
            {icon}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" />
            <div className="h-4 w-20 bg-slate-200/70 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              {prefix && (
                <span className="text-sm font-medium text-slate-400">{prefix}</span>
              )}
              <AnimatedCounter
                value={value}
                decimals={decimals}
                duration={1000}
                className="text-2xl font-extrabold text-slate-800 tracking-tight"
              />
              {suffix && (
                <span className="text-sm font-medium text-slate-400 ml-0.5">{suffix}</span>
              )}
            </div>

            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                {trend.value >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                )}
                <span
                  className={`text-xs font-bold ${
                    trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(trend.value).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">{trend.label}</span>
              </div>
            )}

            {progress !== undefined && (
              <div className="mt-3">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${accentColor}`}
                    style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                  {progress.toFixed(1)}% completado
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </GradientCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip personalizado para AreaChart                              */
/* ------------------------------------------------------------------ */

function CustomAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-600 font-medium capitalize">
              {entry.name}:
            </span>
            <span className="text-xs font-bold text-slate-800 font-mono">
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
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{data.estado}</p>
      <p className="text-sm font-bold text-slate-800 font-mono">{data.cantidad} proformas</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ícono de actividad                                                  */
/* ------------------------------------------------------------------ */

function ActivityIcon({ tipo }: { tipo: Actividad['tipo'] }) {
  const map = {
    venta: { icon: <ShoppingCart className="w-4 h-4" />, bg: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' },
    proforma: { icon: <FileText className="w-4 h-4" />, bg: 'bg-blue-50 text-blue-600', border: 'border-blue-200' },
    stock: { icon: <Package className="w-4 h-4" />, bg: 'bg-red-50 text-red-600', border: 'border-red-200' },
    pedido: { icon: <Truck className="w-4 h-4" />, bg: 'bg-amber-50 text-amber-600', border: 'border-amber-200' },
  };
  const style = map[tipo];
  return (
    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border ${style.bg} ${style.border}`}>
      {style.icon}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Página principal                                                    */
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
  const [loading, setLoading] = useState(true);
  const [dateTime, setDateTime] = useState<string>('');

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
  useEffect(() => {
    async function load() {
      if (!usuario || usuario.rol !== 'ADMIN') return;
      try {
        const [kpiRes, ventasRes, topProdRes, prodRes, actRes, profRes] = await Promise.all([
          dbService.getKpis(),
          dbService.getVentasPorDia(),
          dbService.getTopProductos(),
          dbService.getProducts(),
          dbService.getActividadReciente(),
          dbService.getProformas(),
        ]);
        setKpis(kpiRes);
        setVentasPorDia(ventasRes);
        setTopProductos(topProdRes);
        setProductos(prodRes);
        setActividades(actRes);
        setProformas(profRes);
      } catch (err) {
        console.error('Error al cargar dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    if (usuario && usuario.rol === 'ADMIN') {
      load();
    }
  }, [usuario]);

  /* ---------- Datos derivados ---------- */
  const funnelData = useMemo(() => {
    const estados = ['PENDIENTE', 'EN_NEGOCIACION', 'APROBADA', 'RECHAZADA', 'EXPIRADA'];
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      EN_NEGOCIACION: 'En Negociación',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
      EXPIRADA: 'Expirada',
    };
    const colors: Record<string, string> = {
      PENDIENTE: '#f59e0b',
      EN_NEGOCIACION: '#3b82f6',
      APROBADA: '#10b981',
      RECHAZADA: '#ef4444',
      EXPIRADA: '#64748b',
    };
    return estados.map((estado) => ({
      estado: labels[estado],
      cantidad: proformas.filter((p) => p.estado === estado).length,
      color: colors[estado],
    }));
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

  /* ---------- Estado de carga global ---------- */
  if (sessionLoading || !usuario || usuario.rol !== 'ADMIN') {
    return (
      <div className="p-6 lg:p-8 space-y-8 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="h-10 w-56 bg-slate-200/70 rounded-lg" />
          <div className="h-6 w-64 bg-slate-200/70 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 bg-slate-200/60 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200/60 rounded-xl" />
          <div className="h-80 bg-slate-200/60 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* ============================================================== */}
      {/*  HERO HEADER                                                    */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            Panel de Control
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Resumen operativo gerencial en tiempo real
          </p>
        </div>
        <div className="font-mono text-xs text-slate-500 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-slate-200/60 shadow-sm shrink-0">
          {dateTime || 'Cargando fecha...'}
        </div>
      </div>

      {/* ============================================================== */}
      {/*  KPI CARDS — 2 filas × 4 columnas                               */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Fila 1 */}
        <KpiCard
          title="Venta Comercial Hoy"
          value={kpis?.venta_comercial_hoy ?? 0}
          prefix="S/ "
          decimals={2}
          accentColor="from-orange-500 to-amber-400"
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
        />
        <KpiCard
          title="Pedidos Industriales Activos"
          value={kpis?.venta_industrial_activa ?? 0}
          prefix="S/ "
          decimals={2}
          accentColor="from-blue-500 to-cyan-400"
          icon={<Box className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          title="Tasa Conversión Proformas"
          value={kpis?.tasa_conversion_proformas ?? 0}
          suffix="%"
          decimals={1}
          accentColor="from-emerald-500 to-teal-400"
          icon={<Percent className="w-5 h-5" />}
          progress={kpis?.tasa_conversion_proformas}
          loading={loading}
        />
        <KpiCard
          title="Alertas Stock Crítico"
          value={kpis?.productos_bajo_minimo ?? 0}
          accentColor="from-red-500 to-rose-400"
          icon={<AlertTriangle className="w-5 h-5" />}
          alert={(kpis?.productos_bajo_minimo ?? 0) > 0}
          loading={loading}
        />

        {/* Fila 2 */}
        <KpiCard
          title="Ticket Promedio"
          value={kpis?.ticket_promedio ?? 0}
          prefix="S/ "
          decimals={2}
          accentColor="from-violet-500 to-purple-400"
          icon={<ShoppingCart className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          title="Margen Bruto Estimado"
          value={kpis?.margen_bruto_estimado ?? 0}
          suffix="%"
          decimals={1}
          accentColor="from-emerald-600 to-green-400"
          icon={<BarChart3 className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          title="Meta vs Real"
          value={kpis?.real_mensual ?? 0}
          prefix="S/ "
          decimals={0}
          accentColor="from-indigo-500 to-violet-400"
          icon={<Target className="w-5 h-5" />}
          progress={metaCumplimiento}
          loading={loading}
        />
        <KpiCard
          title="Proformas Vencidas"
          value={kpis?.proformas_vencidas ?? 0}
          accentColor="from-amber-500 to-yellow-400"
          icon={<Clock className="w-5 h-5" />}
          alert={(kpis?.proformas_vencidas ?? 0) > 0}
          loading={loading}
        />
      </div>

      {/* ============================================================== */}
      {/*  ALERTAS                                                          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GradientCard accentTop accentColor="bg-gradient-to-r from-red-500 to-rose-400" hover>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Stock Bajo</p>
              <div className="flex items-baseline gap-2">
                <AnimatedCounter
                  value={alertasStockBajo}
                  duration={800}
                  className="text-2xl font-extrabold text-slate-800 tracking-tight"
                />
                <StatusBadge variant="danger" className="text-[10px] py-0 px-1.5">
                  {alertasStockBajo > 0 ? 'CRÍTICO' : 'OK'}
                </StatusBadge>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Productos con stock_actual ≤ stock_mínimo
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </GradientCard>

        <GradientCard accentTop accentColor="bg-gradient-to-r from-amber-500 to-yellow-400" hover>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Proformas Vencidas</p>
              <div className="flex items-baseline gap-2">
                <AnimatedCounter
                  value={alertasProformasVencidas}
                  duration={800}
                  className="text-2xl font-extrabold text-slate-800 tracking-tight"
                />
                <StatusBadge variant="warning" className="text-[10px] py-0 px-1.5">
                  {alertasProformasVencidas > 0 ? 'ATENCIÓN' : 'OK'}
                </StatusBadge>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                PENDIENTE o EN_NEGOCIACION con fecha vencida
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </GradientCard>
      </div>

      {/* ============================================================== */}
      {/*  GRÁFICOS SUPERIORES                                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Canal */}
        <GradientCard>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-bold text-slate-800">Ventas por Canal (7 días)</h3>
            </div>
            {loading ? (
              <div className="h-72 bg-slate-100/60 rounded-xl animate-pulse" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ventasPorDia} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradComercial" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradIndustrial" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
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
                      strokeWidth={2.5}
                      fill="url(#gradComercial)"
                      dot={{ r: 3, strokeWidth: 2, fill: '#fff', stroke: '#f97316' }}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="industrial"
                      name="Industrial"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#gradIndustrial)"
                      dot={{ r: 3, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </GradientCard>

        {/* Embudo de Proformas */}
        <GradientCard>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-slate-800">Embudo de Proformas</h3>
            </div>
            {loading ? (
              <div className="h-72 bg-slate-100/60 rounded-xl animate-pulse" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="estado"
                      type="category"
                      width={110}
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={28}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </GradientCard>
      </div>

      {/* ============================================================== */}
      {/*  SECCIÓN INFERIOR — 3 COLUMNAS                                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Col 1 — Top Productos */}
        <div>
          <GradientCard className="h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-800">Top Productos Más Vendidos</h3>
                </div>
                <StatusBadge variant="neutral" dot={false}>Este mes</StatusBadge>
              </div>
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
          </GradientCard>
        </div>

        {/* Col 2 — Timeline de Actividad */}
        <div>
          <GradientCard className="h-full">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-5 h-5 text-violet-500" />
                <h3 className="text-base font-bold text-slate-800">Actividad Reciente</h3>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-9 h-9 bg-slate-100/60 rounded-full animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-slate-100/60 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-slate-100/60 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  {/* Línea conectora vertical */}
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-200" />
                  <div className="space-y-5">
                    {actividades.map((a) => (
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
                              {new Date(a.timestamp).toLocaleTimeString('es-PE', {
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
          </GradientCard>
        </div>

      </div>
    </div>
  );
}
