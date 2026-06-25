'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import { OrdenPago } from '@/types';
import { getOrdenesPago } from '@/services/ordenPagoService';
import { generarPdfOrdenPago } from '@/lib/pdfService';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GradientModal from '@/components/ui/GradientModal';
import { SearchIcon, DownloadIcon, CalendarIcon, DollarSignIcon, BillIcon, ClockIcon } from '@/components/Icons';

const PAGE_SIZE = 10;

function formatCurrency(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

export default function TramitesPage() {
  const { usuario, loading: sessionLoading } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [ordenes, setOrdenes] = useState<OrdenPago[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [bancoFilter, setBancoFilter] = useState<'TODOS' | 'BCP' | 'Scotiabank' | 'Niubiz'>('TODOS');
  const [page, setPage] = useState(1);

  // Modal detalle
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOP, setSelectedOP] = useState<OrdenPago | null>(null);

  /* ---------- Redirección de Rol ---------- */
  useEffect(() => {
    if (!sessionLoading) {
      if (!usuario) router.push('/');
      else if (!['ADMIN', 'VENDEDOR', 'REPRESENTANTE'].includes(usuario.rol)) {
        router.push('/dashboard');
      }
    }
  }, [usuario, sessionLoading, router]);

  /* ---------- Carga de Datos ---------- */
  async function loadData() {
    setLoading(true);
    try {
      const data = await getOrdenesPago();
      setOrdenes(data);
    } catch (err) {
      console.error('Error al cargar trámites:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (usuario) {
      loadData();
    }
  }, [usuario]);

  /* ---------- Filtros ---------- */
  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return ordenes.filter(o => {
      const matchBanco = bancoFilter === 'TODOS' || o.banco === bancoFilter;
      const matchSearch = !q ||
        o.codigo_op.toLowerCase().includes(q) ||
        o.proforma_codigo.toLowerCase().includes(q) ||
        o.cliente_nombre.toLowerCase().includes(q);
      return matchBanco && matchSearch;
    });
  }, [ordenes, busqueda, bancoFilter]);

  /* ---------- Paginación ---------- */
  const paginados = useMemo(() => {
    return filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtrados, page]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [busqueda, bancoFilter]);

  /* ---------- KPIs ---------- */
  const kpis = useMemo(() => {
    const total = filtrados.reduce((acc, o) => acc + o.monto, 0);
    const count = filtrados.length;
    
    // Distribución por banco
    const bancos = {
      BCP: { count: 0, total: 0 },
      Scotiabank: { count: 0, total: 0 },
      Niubiz: { count: 0, total: 0 }
    };

    filtrados.forEach(o => {
      if (bancos[o.banco]) {
        bancos[o.banco].count += 1;
        bancos[o.banco].total += o.monto;
      }
    });

    return { total, count, bancos };
  }, [filtrados]);

  if (sessionLoading || !usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500 gap-2">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trámites y Órdenes de Pago</h1>
        <p className="text-sm text-slate-500">
          Control de trámites de pago iniciados desde la aceptación de proformas industriales.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GradientCard className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Generado</span>
            <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
              <DollarSignIcon size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">
              <AnimatedCounter value={kpis.total} decimals={2} prefix="S/ " />
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Suma total de trámites en curso</p>
          </div>
        </GradientCard>

        <GradientCard className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Trámites</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <BillIcon size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">
              <AnimatedCounter value={kpis.count} />
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Órdenes de pago emitidas</p>
          </div>
        </GradientCard>

        <GradientCard className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">BCP & Scotiabank</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CalendarIcon size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-mono leading-none">
              BCP: {formatCurrency(kpis.bancos.BCP.total)}
            </h3>
            <h3 className="text-sm font-bold text-slate-800 font-mono leading-none mt-2">
              SCOTIA: {formatCurrency(kpis.bancos.Scotiabank.total)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1.5">Volumen distribuido por banco</p>
          </div>
        </GradientCard>

        <GradientCard className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Niubiz (Online)</span>
            <div className="p-1.5 bg-cyan-50 rounded-lg text-cyan-600">
              <ClockIcon size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 font-mono">
              <AnimatedCounter value={kpis.bancos.Niubiz.total} decimals={2} prefix="S/ " />
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">{kpis.bancos.Niubiz.count} pagos a través de pasarela Niubiz</p>
          </div>
        </GradientCard>
      </div>

      {/* Filtros e Historial */}
      <GradientCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <GlassInput
              placeholder="Buscar por código OP, proforma o cliente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              iconLeft={<SearchIcon size={16} />}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={bancoFilter}
              onChange={e => setBancoFilter(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
            >
              <option value="TODOS">Todos los Bancos</option>
              <option value="BCP">BCP</option>
              <option value="Scotiabank">Scotiabank</option>
              <option value="Niubiz">Niubiz</option>
            </select>
            
            <GradientButton variant="secondary" size="sm" onClick={loadData} disabled={loading}>
              Actualizar
            </GradientButton>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="pb-3 pl-4">Código OP</th>
                <th className="pb-3">Proforma</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Banco</th>
                <th className="pb-3">Fecha Emisión</th>
                <th className="pb-3 text-right">Monto</th>
                <th className="pb-3 text-center">Estado</th>
                <th className="pb-3 text-right pr-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(o => (
                <tr
                  key={o.id}
                  onClick={() => {
                    setSelectedOP(o);
                    setModalOpen(true);
                  }}
                  className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors cursor-pointer text-slate-700 text-xs"
                >
                  <td className="py-4 pl-4 font-mono font-bold text-orange-600">{o.codigo_op}</td>
                  <td className="py-4 font-mono text-slate-500">{o.proforma_codigo}</td>
                  <td className="py-4 font-bold max-w-[200px] truncate">{o.cliente_nombre}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      o.banco === 'BCP' ? 'bg-blue-50 text-blue-800' :
                      o.banco === 'Scotiabank' ? 'bg-red-50 text-red-800' :
                      'bg-cyan-50 text-cyan-800'
                    }`}>
                      {o.banco}
                    </span>
                  </td>
                  <td className="py-4 text-slate-500">{formatDateTime(o.fecha_creacion)}</td>
                  <td className="py-4 text-right font-mono font-bold">{formatCurrency(o.monto)}</td>
                  <td className="py-4 text-center">
                    <StatusBadge variant="success">GENERADA</StatusBadge>
                  </td>
                  <td className="py-4 text-right pr-4" onClick={e => e.stopPropagation()}>
                    <GradientButton
                      variant="secondary"
                      size="sm"
                      onClick={() => generarPdfOrdenPago({
                        codigo_op: o.codigo_op,
                        proforma_codigo: o.proforma_codigo,
                        cliente_nombre: o.cliente_nombre,
                        monto: o.monto,
                        banco: o.banco,
                        fecha_creacion: o.fecha_creacion,
                      })}
                    >
                      <DownloadIcon size={12} className="mr-1" />
                      PDF
                    </GradientButton>
                  </td>
                </tr>
              ))}

              {paginados.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    {loading ? 'Cargando trámites...' : 'No se encontraron órdenes de pago.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Página {page} de {totalPages} · ({filtrados.length} resultados)
            </span>
            <div className="flex gap-2">
              <GradientButton
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Anterior
              </GradientButton>
              <GradientButton
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </GradientButton>
            </div>
          </div>
        )}
      </GradientCard>

      {/* Modal Detalles */}
      <GradientModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedOP(null);
        }}
        title="Detalle del Trámite de Pago"
        size="md"
        footer={
          selectedOP && (
            <div className="flex gap-2">
              <GradientButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedOP(null);
                }}
              >
                Cerrar
              </GradientButton>
              <GradientButton
                variant="success"
                size="sm"
                onClick={() => {
                  if (selectedOP) {
                    generarPdfOrdenPago({
                      codigo_op: selectedOP.codigo_op,
                      proforma_codigo: selectedOP.proforma_codigo,
                      cliente_nombre: selectedOP.cliente_nombre,
                      monto: selectedOP.monto,
                      banco: selectedOP.banco,
                      fecha_creacion: selectedOP.fecha_creacion,
                    });
                  }
                }}
              >
                Descargar Voucher PDF
              </GradientButton>
            </div>
          )
        }
      >
        {selectedOP && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200/50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código de Pago</span>
                <h4 className="text-xl font-black text-orange-600 font-mono">{selectedOP.codigo_op}</h4>
              </div>
              <StatusBadge variant="success">GENERADA</StatusBadge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Proforma Relacionada:</span>
                <span className="font-mono font-bold text-slate-700">{selectedOP.proforma_codigo}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Banco Asignado:</span>
                <span className="font-bold text-slate-700">{selectedOP.banco}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-medium block mb-0.5">Cliente:</span>
                <span className="font-bold text-slate-700">{selectedOP.cliente_nombre}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Fecha Emisión:</span>
                <span className="font-bold text-slate-700">{formatDateTime(selectedOP.fecha_creacion)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Importe Total:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{formatCurrency(selectedOP.monto)}</span>
              </div>
            </div>

            <div className="bg-orange-50/50 border border-orange-200/60 rounded-xl p-4 text-xs text-orange-800 space-y-1">
              <span className="font-bold block">Instrucción:</span>
              <p className="leading-relaxed">
                El cliente debe realizar la transferencia o depósito de <strong className="font-black">{formatCurrency(selectedOP.monto)}</strong> en la entidad <strong className="font-black">{selectedOP.banco}</strong> haciendo referencia al código de trámite <strong className="font-black font-mono">{selectedOP.codigo_op}</strong>.
              </p>
            </div>
          </div>
        )}
      </GradientModal>
    </div>
  );
}
