'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { dbService, Producto as ProductoDb, MovimientoStock } from '@/lib/db';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import GradientModal from '@/components/ui/GradientModal';
import GradientDrawer from '@/components/ui/GradientDrawer';

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
  const [productos, setProductos] = useState<ProductoDb[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [modalMovimientoOpen, setModalMovimientoOpen] = useState(false);
  const [productoMovimiento, setProductoMovimiento] = useState<ProductoDb | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [cantidadMovimiento, setCantidadMovimiento] = useState('');
  const [motivoMovimiento, setMotivoMovimiento] = useState('');
  const [errorMovimiento, setErrorMovimiento] = useState('');

  const [drawerHistorialOpen, setDrawerHistorialOpen] = useState(false);
  const [productoHistorial, setProductoHistorial] = useState<ProductoDb | null>(null);

  /* Carga inicial desde dbService (Supabase o localStorage) */
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prods, movs] = await Promise.all([
          dbService.getProducts(),
          dbService.getMovimientosStock(),
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

  function abrirModalMovimiento(producto: ProductoDb) {
    setProductoMovimiento(producto);
    setTipoMovimiento('ENTRADA');
    setCantidadMovimiento('');
    setMotivoMovimiento('');
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
    if (!motivoMovimiento.trim()) {
      setErrorMovimiento('Ingresa el motivo del movimiento.');
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
      await dbService.addMovimientoStock({
        producto_id: productoMovimiento.id,
        tipo: tipoMovimiento,
        motivo: tipoMovimiento === 'ENTRADA' ? 'COMPRA_PROVEEDOR' : 'AJUSTE_CONTEO',
        cantidad_anterior: productoMovimiento.stock_actual,
        cantidad_nueva: nuevoStock,
        diferencia: tipoMovimiento === 'ENTRADA' ? cantidad : -cantidad,
        usuario_id: 'u1', // usuario actual simplificado
        observacion: motivoMovimiento.trim(),
      });

      // Recargar datos
      const [prods, movs] = await Promise.all([
        dbService.getProducts(),
        dbService.getMovimientosStock(),
      ]);
      setProductos(prods);
      setMovimientos(movs);
      setModalMovimientoOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMovimiento('Error al registrar el movimiento.');
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
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo / Observación</label>
            <textarea
              className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 px-3.5 py-2.5 resize-none"
              rows={3}
              value={motivoMovimiento}
              onChange={(e) => setMotivoMovimiento(e.target.value)}
              placeholder="Describe el motivo del movimiento..."
            />
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
