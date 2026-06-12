'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { VentaComercial, Proforma, VentaDetalle, ProformaDetalle } from '@/types';
import { getVentasByVendedor } from '@/services/ventaService';
import { getProformasByRepresentante } from '@/services/proformaService';
import { generarPdfVenta, generarPdfFactura, generarPdfProforma } from '@/lib/pdfService';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GradientModal from '@/components/ui/GradientModal';
import { CalendarIcon, SearchIcon, FileTextIcon, EyeIcon, DownloadIcon } from '@/components/Icons';

type Tab = 'comercial' | 'industrial';

const PAGE_SIZE = 10;

function formatCurrency(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function getInitialDateFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function getInitialDateTo() {
  return new Date().toISOString().split('T')[0];
}

export default function MisVentasPage() {
  const { usuario, loading: sessionLoading } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('comercial');
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<VentaComercial[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [dateFrom, setDateFrom] = useState(getInitialDateFrom());
  const [dateTo, setDateTo] = useState(getInitialDateTo());
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);

  // Modal detalles
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVenta, setModalVenta] = useState<VentaComercial | null>(null);
  const [modalProforma, setModalProforma] = useState<Proforma | null>(null);

  /* ---------- Redirección ---------- */
  useEffect(() => {
    if (!sessionLoading) {
      if (!usuario) router.push('/');
      else if (!['ADMIN', 'VENDEDOR', 'REPRESENTANTE'].includes(usuario.rol)) {
        router.push('/dashboard');
      }
    }
  }, [usuario, sessionLoading, router]);

  /* ---------- Carga de datos ---------- */
  useEffect(() => {
    async function load() {
      if (!usuario) return;
      setLoading(true);
      try {
        const [v, p] = await Promise.all([
          getVentasByVendedor(usuario.id, 200),
          getProformasByRepresentante(usuario.id, 200),
        ]);
        setVentas(v);
        setProformas(p);
      } catch (err) {
        console.error('Error cargando mis ventas:', err);
      } finally {
        setLoading(false);
      }
    }
    if (usuario) load();
  }, [usuario]);

  /* ---------- Filtros ---------- */
  const ventasFiltradas = useMemo(() => {
    const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
    const q = busqueda.toLowerCase().trim();

    return ventas.filter(v => {
      const d = new Date(v.fecha_venta);
      const inDate = d >= from && d <= to;
      if (!inDate) return false;
      if (!q) return true;
      return (v.cliente_nombre || '').toLowerCase().includes(q) ||
             (v.numero_comprobante || '').toLowerCase().includes(q);
    });
  }, [ventas, dateFrom, dateTo, busqueda]);

  const proformasFiltradas = useMemo(() => {
    const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
    const q = busqueda.toLowerCase().trim();

    return proformas.filter(p => {
      const d = new Date(p.fecha_emision);
      const inDate = d >= from && d <= to;
      if (!inDate) return false;
      if (!q) return true;
      return (p.cliente_nombre || '').toLowerCase().includes(q) ||
             (p.codigo_proforma || '').toLowerCase().includes(q);
    });
  }, [proformas, dateFrom, dateTo, busqueda]);

  /* ---------- Paginación ---------- */
  const ventasPaginadas = ventasFiltradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const profPaginadas = proformasFiltradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil((tab === 'comercial' ? ventasFiltradas : proformasFiltradas).length / PAGE_SIZE));

  useEffect(() => { setPage(1); }, [tab, busqueda, dateFrom, dateTo]);

  /* ---------- KPIs Comercial ---------- */
  const kpiComercial = useMemo(() => {
    const total = ventasFiltradas.reduce((s, v) => s + v.total, 0);
    const count = ventasFiltradas.length;
    const ticket = count > 0 ? total / count : 0;
    const productos: Record<string, number> = {};
    ventasFiltradas.forEach(v => {
      v.detalles?.forEach(d => {
        const nombre = d.nombre || 'Producto';
        productos[nombre] = (productos[nombre] || 0) + d.cantidad;
      });
    });
    const productoFavorito = Object.entries(productos).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return { total, count, ticket, productoFavorito };
  }, [ventasFiltradas]);

  /* ---------- KPIs Industrial ---------- */
  const kpiIndustrial = useMemo(() => {
    const total = proformasFiltradas.reduce((s, p) => s + p.total, 0);
    const count = proformasFiltradas.length;
    const aprobadas = proformasFiltradas.filter(p => p.estado === 'APROBADA').length;
    const tasa = count > 0 ? (aprobadas / count) * 100 : 0;
    const pendientes = proformasFiltradas.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_NEGOCIACION').length;
    return { total, count, tasa, pendientes };
  }, [proformasFiltradas]);

  /* ---------- Modal detalles ---------- */
  function abrirDetalleVenta(v: VentaComercial) {
    setModalVenta(v);
    setModalProforma(null);
    setModalOpen(true);
  }

  function abrirDetalleProforma(p: Proforma) {
    setModalProforma(p);
    setModalVenta(null);
    setModalOpen(true);
  }

  /* ---------- Descargar PDF ---------- */
  function descargarPdfVenta(v: VentaComercial) {
    if (v.tipo_comprobante === 'FACTURA') generarPdfFactura(v);
    else generarPdfVenta(v);
  }

  /* ---------- Estado de carga ---------- */
  if (sessionLoading || !usuario) {
    return (
      <div className="p-6 lg:p-8 space-y-8 animate-pulse">
        <div className="h-10 w-56 bg-slate-200/70 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/60 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200/60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            Mis Ventas
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Historial de tus transacciones en ambos canales
          </p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-100/60 w-fit">
        {([
          { key: 'comercial', label: 'Canal Comercial' },
          { key: 'industrial', label: 'Canal Industrial' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-white shadow-sm text-orange-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {tab === 'comercial' ? (
          <>
            <GradientCard accentTop accentColor="bg-gradient-to-r from-orange-500 to-amber-400">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total vendido</span>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-5 h-5" /></div>
                </div>
                {loading ? <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" /> : (
                  <AnimatedCounter value={kpiComercial.total} prefix="S/ " decimals={2} className="text-2xl font-extrabold text-slate-800 tracking-tight" />
                )}
              </div>
            </GradientCard>
            <GradientCard accentTop accentColor="bg-gradient-to-r from-blue-500 to-cyan-400">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500"># Ventas</span>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-5 h-5" /></div>
                </div>
                {loading ? <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" /> : (
                  <AnimatedCounter value={kpiComercial.count} className="text-2xl font-extrabold text-slate-800 tracking-tight" />
                )}
              </div>
            </GradientCard>
            <GradientCard accentTop accentColor="bg-gradient-to-r from-emerald-500 to-teal-400">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ticket promedio</span>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-5 h-5" /></div>
                </div>
                {loading ? <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" /> : (
                  <AnimatedCounter value={kpiComercial.ticket} prefix="S/ " decimals={2} className="text-2xl font-extrabold text-slate-800 tracking-tight" />
                )}
              </div>
            </GradientCard>
            <GradientCard accentTop accentColor="bg-gradient-to-r from-violet-500 to-purple-400">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Producto más vendido</span>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-5 h-5" /></div>
                </div>
                {loading ? <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" /> : (
                  <div className="text-lg font-extrabold text-slate-800 tracking-tight truncate" title={kpiComercial.productoFavorito}>
                    {kpiComercial.productoFavorito}
                  </div>
                )}
              </div>
            </GradientCard>
          </>
        ) : (
          <>
            <GradientCard accentTop accentColor="bg-gradient-to-r from-orange-500 to-amber-400">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total cotizado</span>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-5 h-5" /></div>
                </div>
                {loading ? <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" /> : (
                  <AnimatedCounter value={kpiIndustrial.total} prefix="S/ " decimals={2} className="text-2xl font-extrabold text-slate-800 tracking-tight" />
                )}
              </div>
            </GradientCard>
            <GradientCard accentTop accentColor="bg-gradient-to-r from-blue-500 to-cyan-400">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500"># Proformas</span>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-5 h-5" /></div>
                </div>
                {loading ? <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" /> : (
                  <AnimatedCounter value={kpiIndustrial.count} className="text-2xl font-extrabold text-slate-800 tracking-tight" />
                )}
              </div>
            </GradientCard>
            <GradientCard accentTop accentColor="bg-gradient-to-r from-emerald-500 to-teal-400">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tasa de conversión</span>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-5 h-5" /></div>
                </div>
                {loading ? <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" /> : (
                  <div className="text-2xl font-extrabold text-slate-800 tracking-tight">{kpiIndustrial.tasa.toFixed(1)}%</div>
                )}
              </div>
            </GradientCard>
            <GradientCard accentTop accentColor="bg-gradient-to-r from-violet-500 to-purple-400">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pendientes</span>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-5 h-5" /></div>
                </div>
                {loading ? <div className="h-8 w-32 bg-slate-200/70 rounded animate-pulse" /> : (
                  <AnimatedCounter value={kpiIndustrial.pendientes} className="text-2xl font-extrabold text-slate-800 tracking-tight" />
                )}
              </div>
            </GradientCard>
          </>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <GlassInput
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full sm:w-44"
          iconLeft={<CalendarIcon className="w-4 h-4" />}
        />
        <GlassInput
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full sm:w-44"
          iconLeft={<CalendarIcon className="w-4 h-4" />}
        />
        <GlassInput
          placeholder={tab === 'comercial' ? 'Buscar por cliente o comprobante...' : 'Buscar por cliente o código...'}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:w-72"
          iconLeft={<SearchIcon className="w-4 h-4" />}
        />
        <GradientButton variant="secondary" size="sm" onClick={() => {
          setDateFrom(getInitialDateFrom());
          setDateTo(getInitialDateTo());
          setBusqueda('');
        }}>
          Restablecer
        </GradientButton>
      </div>

      {/* Tabla */}
      <GradientCard className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-bold text-slate-800">
                {tab === 'comercial' ? 'Ventas registradas' : 'Proformas emitidas'}
              </h3>
            </div>
              <span className="text-xs text-slate-500">{(tab === 'comercial' ? ventasFiltradas : proformasFiltradas).length} resultados</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    {tab === 'comercial' ? (
                      <>
                        <th className="text-left pb-3 pr-4">Fecha</th>
                        <th className="text-left pb-3 pr-4">Cliente</th>
                        <th className="text-left pb-3 pr-4">Comprobante</th>
                        <th className="text-left pb-3 pr-4">Tipo</th>
                        <th className="text-left pb-3 pr-4">Pago</th>
                        <th className="text-right pb-3 pr-4">Total</th>
                        <th className="text-left pb-3">Acciones</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left pb-3 pr-4">Código</th>
                        <th className="text-left pb-3 pr-4">Fecha</th>
                        <th className="text-left pb-3 pr-4">Cliente</th>
                        <th className="text-left pb-3 pr-4">Contacto</th>
                        <th className="text-right pb-3 pr-4">Total</th>
                        <th className="text-left pb-3 pr-4">Estado</th>
                        <th className="text-left pb-3 pr-4">Vence</th>
                        <th className="text-left pb-3">Acciones</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tab === 'comercial' ? (
                    ventasPaginadas.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-4 text-slate-700 text-xs font-mono">{formatDateTime(v.fecha_venta)}</td>
                        <td className="py-3 pr-4 text-slate-800 font-medium text-sm">{v.cliente_nombre || '—'}</td>
                        <td className="py-3 pr-4 text-slate-600 font-mono text-xs">{v.numero_comprobante}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge variant={v.tipo_comprobante === 'FACTURA' ? 'info' : 'neutral'} dot={false}>{v.tipo_comprobante}</StatusBadge>
                        </td>
                        <td className="py-3 pr-4 text-slate-600 text-xs">{v.forma_pago || 'CONTADO'}</td>
                        <td className="py-3 pr-4 text-right font-mono text-slate-800 font-semibold">{formatCurrency(v.total)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <GradientButton variant="ghost" size="sm" onClick={() => abrirDetalleVenta(v)} title="Ver detalles">
                              <EyeIcon className="w-4 h-4" />
                            </GradientButton>
                            <GradientButton variant="ghost" size="sm" onClick={() => descargarPdfVenta(v)} title="Descargar PDF">
                              <DownloadIcon className="w-4 h-4" />
                            </GradientButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    profPaginadas.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-4 text-slate-600 font-mono text-xs">{p.codigo_proforma}</td>
                        <td className="py-3 pr-4 text-slate-700 text-xs">{formatDate(p.fecha_emision)}</td>
                        <td className="py-3 pr-4 text-slate-800 font-medium text-sm">{p.cliente_nombre || '—'}</td>
                        <td className="py-3 pr-4 text-slate-600 text-xs">{p.contacto_nombre || '—'}</td>
                        <td className="py-3 pr-4 text-right font-mono text-slate-800 font-semibold">{formatCurrency(p.total)}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge variant={
                            p.estado === 'APROBADA' ? 'success' :
                            p.estado === 'RECHAZADA' ? 'danger' :
                            p.estado === 'EXPIRADA' ? 'neutral' :
                            p.estado === 'DESPACHADA' ? 'info' :
                            'warning'
                          } dot={false}>{p.estado}</StatusBadge>
                        </td>
                        <td className="py-3 pr-4 text-slate-600 text-xs">{formatDate(p.fecha_vencimiento)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <GradientButton variant="ghost" size="sm" onClick={() => abrirDetalleProforma(p)} title="Ver detalles">
                              <EyeIcon className="w-4 h-4" />
                            </GradientButton>
                            <GradientButton variant="ghost" size="sm" onClick={() => generarPdfProforma(p)} title="Descargar PDF">
                              <DownloadIcon className="w-4 h-4" />
                            </GradientButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {(tab === 'comercial' ? ventasPaginadas : profPaginadas).length === 0 && (
                    <tr>
                      <td colSpan={tab === 'comercial' ? 7 : 8} className="py-8 text-center text-slate-400 text-sm">
                        No se encontraron {tab === 'comercial' ? 'ventas' : 'proformas'} en el período seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">Página {page} de {totalPages} — {(tab === 'comercial' ? ventasFiltradas : proformasFiltradas).length} resultados</span>
            <div className="flex items-center gap-2">
              <GradientButton variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</GradientButton>
              <GradientButton variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</GradientButton>
            </div>
          </div>
        </div>
      </GradientCard>

      {/* Modal Detalles */}
      <GradientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalVenta ? `Venta ${modalVenta.numero_comprobante}` : modalProforma ? `Proforma ${modalProforma.codigo_proforma}` : 'Detalles'}
        size="lg"
        footer={
          <GradientButton variant="ghost" size="md" onClick={() => setModalOpen(false)}>
            Cerrar
          </GradientButton>
        }
      >
        {modalVenta && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-slate-500">Cliente</span><p className="font-semibold text-slate-800">{modalVenta.cliente_nombre || '—'}</p></div>
              <div><span className="text-xs text-slate-500">Fecha</span><p className="text-slate-700">{formatDateTime(modalVenta.fecha_venta)}</p></div>
              <div><span className="text-xs text-slate-500">Comprobante</span><p className="text-slate-700">{modalVenta.numero_comprobante}</p></div>
              <div><span className="text-xs text-slate-500">Tipo</span><p className="text-slate-700">{modalVenta.tipo_comprobante}</p></div>
              <div><span className="text-xs text-slate-500">Forma de pago</span><p className="text-slate-700">{modalVenta.forma_pago || 'CONTADO'}</p></div>
              <div><span className="text-xs text-slate-500">Moneda</span><p className="text-slate-700">{modalVenta.moneda || 'SOLES'}</p></div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60">
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Producto</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">SKU</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">Cant.</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">P. Unit.</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(modalVenta.detalles || []).map((d, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{d.nombre || 'Producto'}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{d.sku || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{d.cantidad}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(d.precio_unitario)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(d.subtotal)}</td>
                    </tr>
                  ))}
                  {(modalVenta.detalles || []).length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400 text-sm">Sin detalles.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-slate-700">Total:</span>
              <span className="text-xl font-extrabold font-mono text-slate-800">{formatCurrency(modalVenta.total)}</span>
            </div>
          </div>
        )}

        {modalProforma && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-slate-500">Cliente</span><p className="font-semibold text-slate-800">{modalProforma.cliente_nombre || '—'}</p></div>
              <div><span className="text-xs text-slate-500">Contacto</span><p className="text-slate-700">{modalProforma.contacto_nombre || '—'}</p></div>
              <div><span className="text-xs text-slate-500">Fecha emisión</span><p className="text-slate-700">{formatDate(modalProforma.fecha_emision)}</p></div>
              <div><span className="text-xs text-slate-500">Vence</span><p className="text-slate-700">{formatDate(modalProforma.fecha_vencimiento)}</p></div>
              <div><span className="text-xs text-slate-500">Estado</span><p className="text-slate-700">{modalProforma.estado}</p></div>
              <div><span className="text-xs text-slate-500">Total</span><p className="font-semibold text-slate-800">{formatCurrency(modalProforma.total)}</p></div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60">
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Producto</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">SKU</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">Cant.</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">Precio</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(modalProforma.detalles || []).map((d, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{d.nombre || 'Producto'}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{d.sku || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{d.cantidad}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(d.precio_pactado)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(d.subtotal)}</td>
                    </tr>
                  ))}
                  {(modalProforma.detalles || []).length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400 text-sm">Sin detalles.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-slate-700">Total:</span>
              <span className="text-xl font-extrabold font-mono text-slate-800">{formatCurrency(modalProforma.total)}</span>
            </div>
          </div>
        )}
      </GradientModal>
    </div>
  );
}
