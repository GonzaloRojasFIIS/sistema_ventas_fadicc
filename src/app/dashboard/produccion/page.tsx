'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { dbService, OrdenPedido } from '@/lib/db';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GradientDrawer from '@/components/ui/GradientDrawer';
import GradientToast, { Alert } from '@/components/ui/GradientToast';
import {
  WarningIcon,
  SearchIcon,
  InventarioIcon,
  CheckIcon,
  ProduccionIcon,
} from '@/components/Icons';

/* ─── helpers ─── */

function diasEntre(a: string | Date, b: string | Date) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtDateISO(d: string | Date | null | undefined) {
  if (!d) return '';
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/* ─── stepper constants ─── */
const STEPS = ['Aprobado', 'Planta', 'Despacho', 'Entregado'] as const;

/* ─── page component ─── */

export default function PlantaDespachosPage() {
  const { usuario, loading: sessionLoading } = useSession();

  /* states */
  const [ordenes, setOrdenes] = useState<OrdenPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proceso' | 'entregados'>('proceso');

  /* filters */
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterRepresentante, setFilterRepresentante] = useState<string>('TODOS');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* drawer */
  const [selectedOrder, setSelectedOrder] = useState<OrdenPedido | null>(null);

  /* alerts */
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const addAlerta = (type: Alert['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((prev) => [...prev, { id, type, message }]);
  };
  const removeAlerta = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  /* data load */
  const loadOrders = async () => {
    try {
      const ords = await dbService.getOrders();
      setOrdenes(ords);
    } catch {
      addAlerta('error', 'Error al cargar las órdenes de producción.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      usuario &&
      (usuario.rol === 'ADMIN' || usuario.rol === 'PRODUCCION' || usuario.rol === 'ALMACEN')
    ) {
      loadOrders();
    }
  }, [usuario]);

  /* derived lists */
  const representantes = useMemo(() => {
    const set = new Set<string>();
    ordenes.forEach((o) => {
      const rep = (o as any).representante_nombre || (o as any).representante || 'Sin asignar';
      set.add(rep);
    });
    return Array.from(set).sort();
  }, [ordenes]);

  const filteredOrders = useMemo(() => {
    return ordenes.filter((o) => {
      const isEnProcesoTab = activeTab === 'proceso';
      const isEntregado = o.estado_produccion === 'ENTREGADO';

      if (isEnProcesoTab) {
        if (isEntregado) return false;
        if (filterEstado !== 'TODOS' && o.estado_produccion !== filterEstado) return false;
      } else {
        if (!isEntregado) return false;
      }

      const matchesSearch =
        searchQuery === '' ||
        o.codigo_pedido.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.cliente_nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.codigo_proforma || '').toLowerCase().includes(searchQuery.toLowerCase());

      const rep = (o as any).representante_nombre || (o as any).representante || 'Sin asignar';
      const matchesRep = filterRepresentante === 'TODOS' || rep === filterRepresentante;

      const fa = new Date(o.fecha_aprobacion);
      const fromOk = !dateFrom || fa >= new Date(dateFrom + 'T00:00:00');
      const toOk = !dateTo || fa <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesRep && fromOk && toOk;
    });
  }, [ordenes, activeTab, filterEstado, searchQuery, filterRepresentante, dateFrom, dateTo]);

  /* metrics */
  const metrics = useMemo(() => {
    const entregados = ordenes.filter(
      (o) => o.estado_produccion === 'ENTREGADO' && o.fecha_entrega_real && o.fecha_aprobacion
    );

    const avgDays =
      entregados.length > 0
        ? entregados.reduce(
            (sum, o) => sum + diasEntre(o.fecha_aprobacion, o.fecha_entrega_real!),
            0
          ) / entregados.length
        : 0;

    const now = new Date();
    const entregadosMes = entregados.filter((o) => {
      const d = new Date(o.fecha_entrega_real!);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const hoy = new Date();
    const enRiesgo = ordenes.filter((o) => {
      if (o.estado_produccion === 'ENTREGADO') return false;
      const fechaEst = (o as any).fecha_entrega_estimada
        ? new Date((o as any).fecha_entrega_estimada)
        : null;
      if (fechaEst && fechaEst < hoy) return true;
      return diasEntre(o.fecha_aprobacion, hoy) > 21;
    }).length;

    return { avgDays, entregadosMes, enRiesgo };
  }, [ordenes]);

  /* status updater */
  const handleUpdateStatus = async (
    orderId: string,
    currentStatus: OrdenPedido['estado_produccion']
  ) => {
    let nextStatus: OrdenPedido['estado_produccion'];
    if (currentStatus === 'EN_PRODUCCION') {
      nextStatus = 'LISTO_PARA_DESPACHO';
    } else if (currentStatus === 'LISTO_PARA_DESPACHO') {
      nextStatus = 'ENTREGADO';
    } else {
      return;
    }

    try {
      const success = await dbService.updateOrderStatus(orderId, nextStatus);
      if (success) {
        addAlerta('success', `Pedido actualizado a: ${nextStatus.replace(/_/g, ' ')}`);
        loadOrders();
      } else {
        addAlerta('error', 'No se pudo actualizar el estado del pedido.');
      }
    } catch {
      addAlerta('error', 'Error del servidor al actualizar estado.');
    }
  };

  /* permission helpers */
  const canProduce = usuario?.rol === 'ADMIN' || usuario?.rol === 'PRODUCCION';
  const canDispatch = usuario?.rol === 'ADMIN' || usuario?.rol === 'ALMACEN';

  /* stepper logic */
  const getStepMeta = (order: OrdenPedido) => {
    const status = order.estado_produccion;
    let activeIdx = 0;
    if (status === 'EN_PRODUCCION') activeIdx = 1;
    else if (status === 'LISTO_PARA_DESPACHO') activeIdx = 2;
    else if (status === 'ENTREGADO') activeIdx = 3;

    return { activeIdx };
  };

  /* loading / unauthorized */
  if (sessionLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (
    !usuario ||
    (usuario.rol !== 'ADMIN' && usuario.rol !== 'PRODUCCION' && usuario.rol !== 'ALMACEN')
  ) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <GradientCard className="max-w-md mx-auto p-8 text-center">
          <WarningIcon className="w-12 h-12 text-red-500 mb-4 shrink-0 mx-auto" />
          <h2 className="text-xl font-serif font-bold text-slate-900">Acceso Denegado</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Esta sección está reservada exclusivamente para el personal de Planta (Producción),
            Almacén y Administradores de FADICC S.A.
          </p>
        </GradientCard>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 flex flex-col gap-6">
      {/* ── Toasts ── */}
      <GradientToast alerts={alerts} onRemove={removeAlerta} />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-slate-900 flex items-center gap-2.5 font-extrabold">
            <ProduccionIcon className="w-7 h-7 text-orange-500" /> Planta y Despachos
          </h2>
          <p className="font-body-base text-slate-500 mt-1 text-sm md:text-base">
            Seguimiento del ciclo de fabricación de cocinas industriales y coordinación logística de
            despachos.
          </p>
        </div>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GradientCard className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <ProduccionIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tiempo Prom. Fabricación
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              <AnimatedCounter value={metrics.avgDays} decimals={1} suffix=" días" />
            </p>
          </div>
        </GradientCard>

        <GradientCard className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Entregados este mes
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              <AnimatedCounter value={metrics.entregadosMes} />
            </p>
          </div>
        </GradientCard>

        <GradientCard className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <WarningIcon className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              En riesgo de retraso
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              <AnimatedCounter value={metrics.enRiesgo} />
            </p>
          </div>
        </GradientCard>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-200 max-w-md bg-slate-50/50 p-1 rounded-lg">
        <button
          onClick={() => {
            setActiveTab('proceso');
            setFilterEstado('TODOS');
          }}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'proceso'
              ? 'bg-white text-orange-600 border border-slate-200/50 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ProduccionIcon className="w-4 h-4 shrink-0" /> En Proceso (
          {ordenes.filter((o) => o.estado_produccion !== 'ENTREGADO').length})
        </button>
        <button
          onClick={() => setActiveTab('entregados')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'entregados'
              ? 'bg-white text-emerald-600 border border-slate-200/50 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckIcon className="w-4 h-4 shrink-0 text-emerald-600" /> Entregados (
          {ordenes.filter((o) => o.estado_produccion === 'ENTREGADO').length})
        </button>
      </div>

      {/* ── Filtros Avanzados ── */}
      <GradientCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto flex-1">
            <GlassInput
              type="text"
              placeholder="Buscar por cliente, código o proforma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              iconLeft={<SearchIcon className="w-4 h-4" />}
              className="md:max-w-xs"
            />
            <select
              value={filterRepresentante}
              onChange={(e) => setFilterRepresentante(e.target.value)}
              className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 py-2.5 px-3.5 md:max-w-[200px]"
            >
              <option value="TODOS">Todos los representantes</option>
              {representantes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <GlassInput
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs py-2"
              />
              <span className="text-slate-400 text-xs">a</span>
              <GlassInput
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs py-2"
              />
            </div>
          </div>

          {activeTab === 'proceso' && (
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              {['TODOS', 'EN_PRODUCCION', 'LISTO_PARA_DESPACHO'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterEstado(st)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    filterEstado === st
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st === 'TODOS'
                    ? 'Todos'
                    : st === 'EN_PRODUCCION'
                    ? 'En Fabricación'
                    : 'Listo para Despacho'}
                </button>
              ))}
            </div>
          )}
        </div>
      </GradientCard>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-white border border-slate-200 rounded-xl p-6" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center text-slate-400 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center gap-2">
          <InventarioIcon className="w-12 h-12 text-slate-300 shrink-0" />
          <p className="text-xs font-semibold">No se encontraron órdenes de pedido en esta sección.</p>
        </div>
      ) : activeTab === 'proceso' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((o) => {
            const isProd = o.estado_produccion === 'EN_PRODUCCION';
            const isListo = o.estado_produccion === 'LISTO_PARA_DESPACHO';
            const { activeIdx } = getStepMeta(o);

            return (
              <GradientCard
                key={o.id}
                accentTop
                accentColor={
                  isProd
                    ? 'bg-gradient-to-r from-orange-500 to-amber-400'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }
                clickable
                onClick={() => setSelectedOrder(o)}
                className="p-0"
              >
                <div className="p-6 flex flex-col justify-between h-full gap-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-sm">
                        {o.codigo_pedido}
                      </span>
                      <StatusBadge
                        variant={isProd ? 'warning' : isListo ? 'info' : 'neutral'}
                        dot
                      >
                        {isProd ? 'En Fabricación' : isListo ? 'Listo Despacho' : o.estado_produccion.replace(/_/g, ' ')}
                      </StatusBadge>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {o.cliente_nombre}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Aprobación: {fmtDate(o.fecha_aprobacion)}
                      </p>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="my-2 space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span>Etapa de Fabricación</span>
                      <span className="text-orange-600 font-extrabold">
                        {isProd ? 'Fabricación' : 'Listo Despacho'}
                      </span>
                    </div>

                    <div className="relative flex items-center justify-between">
                      {/* Base line */}
                      <div className="absolute left-0 right-0 h-1 bg-slate-100 z-0 rounded-full" />
                      {/* Progress gradient line */}
                      <div
                        className="absolute left-0 h-1 z-0 transition-all duration-700 rounded-full bg-gradient-to-r from-green-500 to-orange-500"
                        style={{
                          width:
                            activeIdx === 0
                              ? '0%'
                              : activeIdx === 1
                              ? '28%'
                              : activeIdx === 2
                              ? '62%'
                              : '100%',
                        }}
                      />

                      {STEPS.map((label, idx) => {
                        const completed = idx < activeIdx;
                        const active = idx === activeIdx;
                        return (
                          <div key={label} className="relative z-10 flex flex-col items-center gap-1.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm transition-all duration-300 ${
                                completed
                                  ? 'bg-green-500 text-white'
                                  : active
                                  ? 'bg-orange-500 text-white animate-pulse'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {completed ? (
                                <CheckIcon className="w-3.5 h-3.5" />
                              ) : active ? (
                                idx === 1 ? (
                                  <ProduccionIcon className="w-3.5 h-3.5" />
                                ) : idx === 2 ? (
                                  <InventarioIcon className="w-3.5 h-3.5" />
                                ) : (
                                  '•'
                                )
                              ) : (
                                '•'
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                active
                                  ? 'text-orange-600'
                                  : completed
                                  ? 'text-green-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer card */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <div className="text-xs">
                      <p className="text-slate-400 font-semibold">Valor Acumulado</p>
                      <p className="font-extrabold text-slate-900 font-mono text-sm mt-0.5">
                        S/ {o.total?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    {isProd && canProduce && (
                      <GradientButton
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(o.id, 'EN_PRODUCCION');
                        }}
                      >
                        <ProduccionIcon className="w-4 h-4 animate-spin-slow" />
                        Terminar Fabricación
                      </GradientButton>
                    )}

                    {isListo && canDispatch && (
                      <GradientButton
                        size="sm"
                        variant="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(o.id, 'LISTO_PARA_DESPACHO');
                        }}
                      >
                        <InventarioIcon className="w-4 h-4" />
                        Registrar Despacho
                      </GradientButton>
                    )}

                    {((isProd && !canProduce) || (isListo && !canDispatch)) && (
                      <span className="text-[10px] text-slate-500 italic bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold">
                        Esperando acción de {isProd ? 'Planta' : 'Almacén'}
                      </span>
                    )}
                  </div>
                </div>
              </GradientCard>
            );
          })}
        </div>
      ) : (
        /* ── Entregados: tabla con estilo nuevo ── */
        <GradientCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 font-semibold bg-slate-50/60">
                  <th className="p-4 whitespace-nowrap">Pedido</th>
                  <th className="p-4 whitespace-nowrap">Referencia</th>
                  <th className="p-4 whitespace-nowrap">Cliente</th>
                  <th className="p-4 whitespace-nowrap">Representante</th>
                  <th className="p-4 whitespace-nowrap">Aprobación</th>
                  <th className="p-4 whitespace-nowrap">Fecha Entrega</th>
                  <th className="p-4 text-right whitespace-nowrap">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td className="p-4 font-mono font-bold text-orange-600">{o.codigo_pedido}</td>
                    <td className="p-4 text-xs text-slate-500 font-mono">{o.codigo_proforma}</td>
                    <td className="p-4 text-slate-800 font-bold">{o.cliente_nombre}</td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {(o as any).representante_nombre || (o as any).representante || '—'}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-semibold">
                      {fmtDate(o.fecha_aprobacion)}
                    </td>
                    <td className="p-4 text-xs text-emerald-700 font-bold">
                      {o.fecha_entrega_real ? fmtDate(o.fecha_entrega_real) : '—'}
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-900 font-mono">
                      S/ {o.total?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GradientCard>
      )}

      {/* ── Drawer de detalle ── */}
      <GradientDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Detalle del Pedido ${selectedOrder?.codigo_pedido || ''}`}
        size="md"
      >
        {selectedOrder && (
          <div className="flex flex-col gap-6">
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-900">{selectedOrder.cliente_nombre}</h4>
                <StatusBadge
                  variant={
                    selectedOrder.estado_produccion === 'ENTREGADO'
                      ? 'success'
                      : selectedOrder.estado_produccion === 'LISTO_PARA_DESPACHO'
                      ? 'info'
                      : 'warning'
                  }
                >
                  {selectedOrder.estado_produccion.replace(/_/g, ' ')}
                </StatusBadge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Código Pedido</p>
                  <p className="font-mono font-bold text-slate-800">{selectedOrder.codigo_pedido}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Proforma Origen</p>
                  <p className="font-mono font-bold text-slate-800">{selectedOrder.codigo_proforma}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Fecha Aprobación</p>
                  <p className="font-bold text-slate-800">{fmtDate(selectedOrder.fecha_aprobacion)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Valor Total</p>
                  <p className="font-mono font-bold text-slate-800">
                    S/ {selectedOrder.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline de producción */}
            <div>
              <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ProduccionIcon className="w-4 h-4 text-orange-500" />
                Timeline de Producción
              </h5>
              <div className="relative pl-4">
                {/* vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />
                <div className="flex flex-col gap-5">
                  {/* Aprobado */}
                  <div className="relative flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm">
                      <CheckIcon className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Pedido Aprobado</p>
                      <p className="text-xs text-slate-500">{fmtDate(selectedOrder.fecha_aprobacion)}</p>
                    </div>
                  </div>

                  {/* Producción */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${
                        selectedOrder.estado_produccion !== 'ENTREGADO' &&
                        selectedOrder.estado_produccion !== 'LISTO_PARA_DESPACHO'
                          ? 'bg-orange-500 text-white animate-pulse'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {selectedOrder.estado_produccion === 'EN_PRODUCCION' ? (
                        <ProduccionIcon className="w-3 h-3" />
                      ) : (
                        <CheckIcon className="w-3 h-3" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Inicio de Fabricación</p>
                      <p className="text-xs text-slate-500">
                        {selectedOrder.estado_produccion === 'EN_PRODUCCION'
                          ? 'En curso'
                          : fmtDate((selectedOrder as any).fecha_inicio_produccion) ||
                            fmtDate(selectedOrder.fecha_aprobacion)}
                      </p>
                    </div>
                  </div>

                  {/* Despacho */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${
                        selectedOrder.estado_produccion === 'LISTO_PARA_DESPACHO'
                          ? 'bg-orange-500 text-white animate-pulse'
                          : selectedOrder.estado_produccion === 'ENTREGADO'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {selectedOrder.estado_produccion === 'LISTO_PARA_DESPACHO' ? (
                        <InventarioIcon className="w-3 h-3" />
                      ) : selectedOrder.estado_produccion === 'ENTREGADO' ? (
                        <CheckIcon className="w-3 h-3" />
                      ) : (
                        '•'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Listo para Despacho</p>
                      <p className="text-xs text-slate-500">
                        {selectedOrder.estado_produccion === 'LISTO_PARA_DESPACHO'
                          ? 'Pendiente de entrega'
                          : selectedOrder.estado_produccion === 'ENTREGADO'
                          ? fmtDate(selectedOrder.fecha_entrega_real)
                          : 'Pendiente'}
                      </p>
                    </div>
                  </div>

                  {/* Entregado */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${
                        selectedOrder.estado_produccion === 'ENTREGADO'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {selectedOrder.estado_produccion === 'ENTREGADO' ? (
                        <CheckIcon className="w-3 h-3" />
                      ) : (
                        '•'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Entregado al Cliente</p>
                      <p className="text-xs text-slate-500">
                        {selectedOrder.fecha_entrega_real
                          ? fmtDate(selectedOrder.fecha_entrega_real)
                          : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proforma origen detail */}
            <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-4">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">
                Proforma Origen
              </p>
              <p className="text-sm text-slate-700">
                Este pedido fue generado a partir de la proforma{' '}
                <span className="font-mono font-bold text-slate-900">
                  {selectedOrder.codigo_proforma}
                </span>
                . Todos los ítems y especificaciones técnicas fueron validados previamente en
                comercial.
              </p>
            </div>
          </div>
        )}
      </GradientDrawer>
    </div>
  );
}
