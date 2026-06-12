'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Producto as ProductoDb, MovimientoStock } from '@/types';
import { getProducts, getMovimientosStock, addMovimientoStock } from '@/services/productoService';
import { isSupabaseConfigured } from '@/repositories/supabaseClient';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import GradientModal from '@/components/ui/GradientModal';
import GradientDrawer from '@/components/ui/GradientDrawer';
import { useSession } from '@/context/SessionContext';

/* ── Helpers ── */
function getStockVariant(stock: number, minimo: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (stock <= 0) return 'danger';
  if (stock <= minimo) return 'warning';
  return 'success';
}

function getStockLabel(stock: number, minimo: number): string {
  if (stock <= 0) return 'Sin Stock';
  if (stock <= minimo) return 'Bajo';
  return 'OK';
}

function getRowBg(stock: number, minimo: number): string {
  if (stock <= 0) return 'bg-red-50/50';
  if (stock <= minimo) return 'bg-amber-50/50';
  return '';
}

/* ── Página ── */
export default function InventarioPage() {
  const { usuario } = useSession();
  const [productos, setProductos] = useState<ProductoDb[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [modalMovimientoOpen, setModalMovimientoOpen] = useState(false);
  const [productoMovimiento, setProductoMovimiento] = useState<ProductoDb | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [cantidadMovimiento, setCantidadMovimiento] = useState('');
  const [motivoMovimiento, setMotivoMovimiento] = useState<MovimientoStock['motivo']>('COMPRA_PROVEEDOR');
  const [observacionMovimiento, setObservacionMovimiento] = useState('');
  const [errorMovimiento, setErrorMovimiento] = useState('');

  const [drawerHistorialOpen, setDrawerHistorialOpen] = useState(false);
  const [productoHistorial, setProductoHistorial] = useState<ProductoDb | null>(null);

  const [tabActivo, setTabActivo] = useState<'stock' | 'kardex'>('stock');
  const [productoKardexId, setProductoKardexId] = useState<string>('');
  const [movimientosKardex, setMovimientosKardex] = useState<MovimientoStock[]>([]);
  const [kardexCalculado, setKardexCalculado] = useState<{ mov: MovimientoStock; saldo: number }[]>([]);
  const [kardexLoading, setKardexLoading] = useState(false);

  const [dbStatus, setDbStatus] = useState<'conectado' | 'desconectado' | 'verificando'>('verificando');
  const [localMovsCount, setLocalMovsCount] = useState(0);

  /* Carga inicial desde dbService (Supabase o localStorage) */
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prods, movs] = await Promise.all([
          getProducts(),
          getMovimientosStock(),
        ]);
        setProductos(prods);
        setMovimientos(movs);
      } catch (err) {
        console.error('Error cargando inventario:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Diagnóstico de conexión
  useEffect(() => {
    const check = () => {
      setDbStatus(isSupabaseConfigured ? 'conectado' : 'desconectado');
      const stored = typeof window !== 'undefined' ? localStorage.getItem('fadicc_movimientos_stock') : null;
      setLocalMovsCount(stored ? JSON.parse(stored).length : 0);
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function loadKardex() {
      setKardexLoading(true);
      try {
        const movs = productoKardexId
          ? await getMovimientosStock(productoKardexId)
          : await getMovimientosStock();
        const ordenados = [...movs].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        const saldosPorProducto: Record<string, number> = {};
        const calculados = ordenados.map((m) => {
          const saldoAnterior = saldosPorProducto[m.producto_id] ?? m.cantidad_anterior;
          const saldo = saldoAnterior + m.diferencia;
          saldosPorProducto[m.producto_id] = saldo;
          return { mov: m, saldo };
        });
        setMovimientosKardex(ordenados);
        setKardexCalculado(calculados);
      } catch (err) {
        console.error('Error cargando kardex:', err);
      } finally {
        setKardexLoading(false);
      }
    }
    loadKardex();
  }, [productoKardexId, movimientos]);

  const categorias = useMemo(() => {
    const cats = new Set(productos.map((p) => p.categoria || 'General'));
    return ['Todas', ...Array.from(cats)];
  }, [productos]);

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;
      const q = busqueda.toLowerCase();
      const coincideBusqueda =
        p.sku.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q);
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, categoriaActiva, busqueda]);

  const historialFiltrado = useMemo(() => {
    if (!productoHistorial) return [];
    return movimientos
      .filter((m) => m.producto_id === productoHistorial.id)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [movimientos, productoHistorial]);

  const MOTIVOS_ENTRADA: { value: MovimientoStock['motivo']; label: string }[] = [
    { value: 'COMPRA_PROVEEDOR', label: 'Compra a proveedor' },
    { value: 'DEVOLUCION_CLIENTE', label: 'Devolución de cliente' },
    { value: 'AJUSTE_CONTEO', label: 'Ajuste de conteo' },
  ];

  const MOTIVOS_SALIDA: { value: MovimientoStock['motivo']; label: string }[] = [
    { value: 'MERMA', label: 'Merma / Pérdida' },
    { value: 'AJUSTE_CONTEO', label: 'Ajuste de conteo' },
    { value: 'VENTA', label: 'Venta' },
  ];

  function abrirModalMovimiento(producto: ProductoDb) {
    setProductoMovimiento(producto);
    setTipoMovimiento('ENTRADA');
    setCantidadMovimiento('');
    setMotivoMovimiento('COMPRA_PROVEEDOR');
    setObservacionMovimiento('');
    setErrorMovimiento('');
    setModalMovimientoOpen(true);
  }

  function abrirDrawerHistorial(producto: ProductoDb) {
    setProductoHistorial(producto);
    setDrawerHistorialOpen(true);
  }

  async function handleRegistrarMovimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!productoMovimiento) return;
    const cantidad = Number(cantidadMovimiento);
    if (!cantidad || cantidad <= 0) {
      setErrorMovimiento('Ingresa una cantidad válida mayor a 0.');
      return;
    }
    const nuevoStock =
      tipoMovimiento === 'ENTRADA'
        ? productoMovimiento.stock_actual + cantidad
        : productoMovimiento.stock_actual - cantidad;

    if (nuevoStock < 0) {
      setErrorMovimiento('El stock no puede quedar negativo.');
      return;
    }

    try {
      await addMovimientoStock({
        producto_id: productoMovimiento.id,
        tipo: tipoMovimiento,
        motivo: motivoMovimiento,
        cantidad_anterior: productoMovimiento.stock_actual,
        cantidad_nueva: nuevoStock,
        diferencia: tipoMovimiento === 'ENTRADA' ? cantidad : -cantidad,
        usuario_id: usuario?.id || 'u1',
        observacion: observacionMovimiento.trim() || undefined,
      });

      // Recargar datos
      const [prods, movs] = await Promise.all([
        getProducts(),
        getMovimientosStock(),
      ]);
      setProductos(prods);
      setMovimientos(movs);
      setModalMovimientoOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el movimiento.';
      console.error(err);
      setErrorMovimiento(msg);
    }
  }

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de productos y movimientos de stock</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${dbStatus === 'conectado' ? 'bg-emerald-500' : dbStatus === 'desconectado' ? 'bg-red-500' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-slate-600 font-medium">
              {dbStatus === 'conectado' ? 'Supabase conectado' : dbStatus === 'desconectado' ? 'Sin conexión a Supabase' : 'Verificando...'}
            </span>
            {dbStatus === 'desconectado' && (
              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Cache local: {localMovsCount} movs</span>
            )}
          </div>
          <GlassInput
            placeholder="Buscar SKU, nombre o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-72"
            iconLeft={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Tabs principales */}
      <div className="flex items-center gap-2">
        <GradientButton
          variant={tabActivo === 'stock' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTabActivo('stock')}
        >
          Stock
        </GradientButton>
        <GradientButton
          variant={tabActivo === 'kardex' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTabActivo('kardex')}
        >
          Kardex
        </GradientButton>
      </div>

      {tabActivo === 'stock' && (
        <>
          {/* Tabs de categoría */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {categorias.map((cat) => (
              <GradientButton
                key={cat}
                variant={categoriaActiva === cat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCategoriaActiva(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </GradientButton>
            ))}
          </div>

          {/* Tabla */}
          <GradientCard className="overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Imagen</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Categoría</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Precio</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Stock Actual</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Stock Mínimo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${getRowBg(p.stock_actual, p.stock_minimo)}`}
                  >
                    <td className="px-4 py-3">
                      {p.imagen ? (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                          <img src={p.imagen} alt={p.nombre} className="w-full h-full object-contain p-1" loading="lazy" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs">—</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{p.categoria || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">S/ {p.precio_base.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{p.stock_actual}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{p.stock_minimo}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={getStockVariant(p.stock_actual, p.stock_minimo)}>
                        {getStockLabel(p.stock_actual, p.stock_minimo)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GradientButton
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirDrawerHistorial(p)}
                          title="Ver historial"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </GradientButton>
                        <GradientButton
                          variant="secondary"
                          size="sm"
                          onClick={() => abrirModalMovimiento(p)}
                          title="Registrar movimiento"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </GradientButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No se encontraron productos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </GradientCard>
        </>
      )}

      {tabActivo === 'kardex' && (
        <GradientCard className="overflow-hidden p-6 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="w-full sm:w-80">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Producto</label>
              <select
                className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition-all duration-150 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 px-3.5 py-2.5"
                value={productoKardexId}
                onChange={(e) => setProductoKardexId(e.target.value)}
              >
                <option value="">Todos los productos</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            {productoKardexId && (
              <div className="text-sm text-slate-600">
                Stock actual: <strong className="text-slate-900">{productos.find(p => p.id === productoKardexId)?.stock_actual ?? '—'}</strong>
              </div>
            )}
            <div className="flex-1" />
            <GradientButton
              variant="secondary"
              size="sm"
              onClick={() => {
                const ev = { target: { value: productoKardexId } } as React.ChangeEvent<HTMLSelectElement>;
                setProductoKardexId(ev.target.value);
              }}
              disabled={kardexLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refrescar
            </GradientButton>
          </div>

          {kardexLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Fecha</th>
                    {!productoKardexId && <th className="text-left px-4 py-3 font-semibold text-slate-700">Producto</th>}
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Motivo</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">Cantidad</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {kardexCalculado.map(({ mov, saldo }) => (
                    <tr key={mov.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="px-4 py-3 text-slate-600">{new Date(mov.fecha).toLocaleDateString('es-PE')}</td>
                      {!productoKardexId && (
                        <td className="px-4 py-3 text-slate-800 font-medium">
                          {mov.producto_nombre ?? productos.find(p => p.id === mov.producto_id)?.nombre ?? mov.producto_id}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <StatusBadge variant={mov.tipo === 'ENTRADA' ? 'success' : mov.tipo === 'SALIDA' ? 'danger' : 'info'} dot={false}>
                          {mov.tipo}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{mov.motivo}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${mov.diferencia > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {mov.diferencia > 0 ? `+${mov.diferencia}` : mov.diferencia}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{saldo}</td>
                    </tr>
                  ))}
                  {kardexCalculado.length === 0 && (
                    <tr>
                      <td colSpan={productoKardexId ? 5 : 6} className="px-4 py-8 text-center text-slate-400">
                        No hay movimientos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GradientCard>
      )}

      {/* Modal Registrar Movimiento */}
      <GradientModal
        isOpen={modalMovimientoOpen}
        onClose={() => setModalMovimientoOpen(false)}
        title={`Registrar movimiento: ${productoMovimiento?.nombre}`}
        size="md"
        footer={
          <>
            <GradientButton variant="ghost" size="md" onClick={() => setModalMovimientoOpen(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="md" onClick={handleRegistrarMovimiento}>
              Guardar
            </GradientButton>
          </>
        }
      >
        <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
              <div className="flex items-center gap-2">
                <GradientButton
                  type="button"
                  variant={tipoMovimiento === 'ENTRADA' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTipoMovimiento('ENTRADA')}
                  className="flex-1"
                >
                  Entrada
                </GradientButton>
                <GradientButton
                  type="button"
                  variant={tipoMovimiento === 'SALIDA' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTipoMovimiento('SALIDA')}
                  className="flex-1"
                >
                  Salida
                </GradientButton>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad</label>
              <GlassInput
                type="number"
                min={1}
                value={cantidadMovimiento}
                onChange={(e) => setCantidadMovimiento(e.target.value)}
                placeholder="Ej: 10"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo</label>
              <select
                className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition-all duration-150 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 px-3.5 py-2.5"
                value={motivoMovimiento}
                onChange={(e) => setMotivoMovimiento(e.target.value as MovimientoStock['motivo'])}
              >
                {(tipoMovimiento === 'ENTRADA' ? MOTIVOS_ENTRADA : MOTIVOS_SALIDA).map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Observación</label>
              <textarea
                className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 px-3.5 py-2.5 resize-none"
                rows={1}
                value={observacionMovimiento}
                onChange={(e) => setObservacionMovimiento(e.target.value)}
                placeholder="Detalle opcional..."
              />
            </div>
          </div>
          {errorMovimiento && (
            <p className="text-sm text-red-600 font-medium">{errorMovimiento}</p>
          )}
          {productoMovimiento && (
            <p className="text-xs text-slate-500">
              Stock actual: <strong className="text-slate-700">{productoMovimiento.stock_actual}</strong> —
              Stock mínimo: <strong className="text-slate-700">{productoMovimiento.stock_minimo}</strong>
            </p>
          )}
        </form>
      </GradientModal>

      {/* Drawer Historial de Movimientos */}
      <GradientDrawer
        isOpen={drawerHistorialOpen}
        onClose={() => setDrawerHistorialOpen(false)}
        title={`Historial: ${productoHistorial?.nombre}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">Fecha</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">Tipo</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-700">Diferencia</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">Motivo</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">Observación</th>
                </tr>
              </thead>
              <tbody>
                {historialFiltrado.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                    <td className="px-3 py-2 text-slate-600">{new Date(m.fecha).toLocaleDateString('es-PE')}</td>
                    <td className="px-3 py-2">
                      <StatusBadge variant={m.tipo === 'ENTRADA' ? 'success' : m.tipo === 'SALIDA' ? 'danger' : 'info'} dot={false}>
                        {m.tipo}
                      </StatusBadge>
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold ${(m.diferencia || 0) > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {m.diferencia > 0 ? `+${m.diferencia}` : m.diferencia}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{m.motivo}</td>
                    <td className="px-3 py-2 text-slate-500">{m.observacion || '—'}</td>
                  </tr>
                ))}
                {historialFiltrado.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      Sin movimientos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GradientDrawer>
    </div>
  );
}
