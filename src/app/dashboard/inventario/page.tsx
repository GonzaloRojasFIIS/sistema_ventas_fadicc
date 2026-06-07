'use client';

import React, { useMemo, useState } from 'react';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import GradientModal from '@/components/ui/GradientModal';
import GradientDrawer from '@/components/ui/GradientDrawer';

/* ── Tipos ── */
interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  imagen?: string;
}

interface Movimiento {
  id: string;
  productoId: string;
  fecha: string;
  tipo: 'Entrada' | 'Ajuste Manual';
  cantidad: number;
  motivo: string;
  usuario: string;
}

/* ── Datos de muestra ── */
const CATEGORIAS = ['Todas', 'Cocinas Domesticas', 'Cocina Semi Industriales', 'Hornos'];

const PRODUCTOS_INICIALES: Producto[] = [
  { id: 'p1', sku: 'FAD-1H-MP', nombre: 'Cocina 1 Hornillo Mesa y Pie', categoria: 'Cocina Semi Industriales', precio: 480.0, stockActual: 12, stockMinimo: 4, imagen: '/cocinas/Cocina-de-1-horno-mesa-y-pie.png' },
  { id: 'p2', sku: 'FAD-2H-MP', nombre: 'Cocina 2 Hornillos Mesa y Pie', categoria: 'Cocina Semi Industriales', precio: 720.0, stockActual: 9, stockMinimo: 3, imagen: '/cocinas/Cocina-de-2-horno-mesa-y-pie.png' },
  { id: 'p3', sku: 'FAD-3H-MP', nombre: 'Cocina 3 Hornillos Mesa y Pie', categoria: 'Cocina Semi Industriales', precio: 950.0, stockActual: 7, stockMinimo: 3, imagen: '/cocinas/Cocina-de-3-horno-mesa-y-pie.png' },
  { id: 'p4', sku: 'FAD-4H-MP', nombre: 'Cocina 4 Hornillos Mesa y Pie', categoria: 'Cocina Semi Industriales', precio: 1250.0, stockActual: 5, stockMinimo: 2, imagen: '/cocinas/Cocina-de-4-horno-mesa-y-pie.png' },
  { id: 'p5', sku: 'FAD-2H-SL', nombre: 'Cocina De 2 Hornillas', categoria: 'Cocina Semi Industriales', precio: 680.0, stockActual: 10, stockMinimo: 3, imagen: '/cocinas/De-2-hornias.png' },
  { id: 'p6', sku: 'FAD-3H-SL', nombre: 'Cocina De 3 Hornillas', categoria: 'Cocina Semi Industriales', precio: 890.0, stockActual: 8, stockMinimo: 3, imagen: '/cocinas/De-3-hornias.png' },
  { id: 'p7', sku: 'FAD-4H-SL', nombre: 'Cocina De 4 Hornillas', categoria: 'Cocina Semi Industriales', precio: 1150.0, stockActual: 6, stockMinimo: 2, imagen: '/cocinas/De-4-hornias.png' },
  { id: 'p8', sku: 'FAD-DOM-20', nombre: 'Cocina Doméstica 20in', categoria: 'Cocinas Domesticas', precio: 380.0, stockActual: 15, stockMinimo: 5, imagen: '/cocinas/Cocinas-20in.png' },
  { id: 'p9', sku: 'FAD-DOM-22', nombre: 'Cocina Doméstica 22in', categoria: 'Cocinas Domesticas', precio: 450.0, stockActual: 11, stockMinimo: 4, imagen: '/cocinas/Cocinas-22in.png' },
  { id: 'p10', sku: 'FAD-DOM-HO', nombre: 'Cocihorno', categoria: 'Cocinas Domesticas', precio: 520.0, stockActual: 7, stockMinimo: 3, imagen: '/cocinas/Cocihorno.png' },
  { id: 'p11', sku: 'FAD-HOR-AC', nombre: 'Horno Acero', categoria: 'Hornos', precio: 2400.0, stockActual: 3, stockMinimo: 1, imagen: '/cocinas/Horno-Acero.png' },
  { id: 'p12', sku: 'FAD-HOR-CF', nombre: 'Chiferos y Fogones', categoria: 'Hornos', precio: 1100.0, stockActual: 5, stockMinimo: 2, imagen: '/cocinas/Chiferos-y-Fogones.png' },
];

const MOVIMIENTOS_INICIALES: Movimiento[] = [
  { id: 'm1', productoId: 'p1', fecha: '2026-06-01', tipo: 'Entrada', cantidad: 8, motivo: 'Producción terminada', usuario: 'Marta P.' },
  { id: 'm2', productoId: 'p2', fecha: '2026-05-20', tipo: 'Ajuste Manual', cantidad: -2, motivo: 'Merma por soldadura', usuario: 'Luis R.' },
  { id: 'm3', productoId: 'p4', fecha: '2026-06-03', tipo: 'Entrada', cantidad: 5, motivo: 'Ensamblaje completado', usuario: 'Marta P.' },
  { id: 'm4', productoId: 'p8', fecha: '2026-05-28', tipo: 'Ajuste Manual', cantidad: -3, motivo: 'Venta por defecto', usuario: 'Carlos V.' },
  { id: 'm5', productoId: 'p11', fecha: '2026-06-05', tipo: 'Entrada', cantidad: 3, motivo: 'Recepción de hornos', usuario: 'Luis R.' },
  { id: 'm6', productoId: 'p12', fecha: '2026-05-15', tipo: 'Entrada', cantidad: 4, motivo: 'Producción propia', usuario: 'Marta P.' },
];

/* ── Helpers ── */
function getStockVariant(stock: number, minimo: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (stock === 0) return 'danger';
  if (stock < minimo) return 'warning';
  return 'success';
}

function getStockLabel(stock: number, minimo: number): string {
  if (stock === 0) return 'Sin Stock';
  if (stock < minimo) return 'Bajo';
  if (stock === minimo) return 'Limitado';
  return 'OK';
}

function getRowBg(stock: number, minimo: number): string {
  if (stock === 0) return 'bg-red-50/50';
  if (stock < minimo) return 'bg-amber-50/50';
  return '';
}

/* ── Página ── */
export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIALES);
  const [movimientos, setMovimientos] = useState<Movimiento[]>(MOVIMIENTOS_INICIALES);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  const [modalMovimientoOpen, setModalMovimientoOpen] = useState(false);
  const [productoMovimiento, setProductoMovimiento] = useState<Producto | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<'Entrada' | 'Ajuste Manual'>('Entrada');
  const [cantidadMovimiento, setCantidadMovimiento] = useState('');
  const [motivoMovimiento, setMotivoMovimiento] = useState('');
  const [errorMovimiento, setErrorMovimiento] = useState('');

  const [drawerHistorialOpen, setDrawerHistorialOpen] = useState(false);
  const [productoHistorial, setProductoHistorial] = useState<Producto | null>(null);

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;
      const q = busqueda.toLowerCase();
      const coincideBusqueda =
        p.sku.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q);
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, categoriaActiva, busqueda]);

  const historialFiltrado = useMemo(() => {
    if (!productoHistorial) return [];
    return movimientos
      .filter((m) => m.productoId === productoHistorial.id)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [movimientos, productoHistorial]);

  function abrirModalMovimiento(producto: Producto) {
    setProductoMovimiento(producto);
    setTipoMovimiento('Entrada');
    setCantidadMovimiento('');
    setMotivoMovimiento('');
    setErrorMovimiento('');
    setModalMovimientoOpen(true);
  }

  function abrirDrawerHistorial(producto: Producto) {
    setProductoHistorial(producto);
    setDrawerHistorialOpen(true);
  }

  function handleRegistrarMovimiento(e: React.FormEvent) {
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
    const delta = tipoMovimiento === 'Entrada' ? cantidad : -cantidad;
    const nuevoStock = productoMovimiento.stockActual + delta;
    if (nuevoStock < 0) {
      setErrorMovimiento('El stock no puede quedar negativo.');
      return;
    }

    setProductos((prev) =>
      prev.map((p) =>
        p.id === productoMovimiento.id ? { ...p, stockActual: nuevoStock } : p
      )
    );
    setMovimientos((prev) => [
      {
        id: `m${Date.now()}`,
        productoId: productoMovimiento.id,
        fecha: new Date().toISOString().split('T')[0],
        tipo: tipoMovimiento,
        cantidad: delta,
        motivo: motivoMovimiento.trim(),
        usuario: 'Usuario actual',
      },
      ...prev,
    ]);
    setModalMovimientoOpen(false);
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
        {CATEGORIAS.map((cat) => (
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
                  className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${getRowBg(p.stockActual, p.stockMinimo)}`}
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
                  <td className="px-4 py-3 text-slate-600">{p.categoria}</td>
                  <td className="px-4 py-3 text-right text-slate-700">S/ {p.precio.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{p.stockActual}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{p.stockMinimo}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={getStockVariant(p.stockActual, p.stockMinimo)}>
                      {getStockLabel(p.stockActual, p.stockMinimo)}
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
                  variant={tipoMovimiento === 'Entrada' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTipoMovimiento('Entrada')}
                  className="flex-1"
                >
                  Entrada
                </GradientButton>
                <GradientButton
                  type="button"
                  variant={tipoMovimiento === 'Ajuste Manual' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTipoMovimiento('Ajuste Manual')}
                  className="flex-1"
                >
                  Ajuste Manual
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo</label>
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
              Stock actual: <strong className="text-slate-700">{productoMovimiento.stockActual}</strong> —
              Stock mínimo: <strong className="text-slate-700">{productoMovimiento.stockMinimo}</strong>
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
                  <th className="text-right px-3 py-2 font-semibold text-slate-700">Cantidad</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">Motivo</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-700">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {historialFiltrado.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                    <td className="px-3 py-2 text-slate-600">{m.fecha}</td>
                    <td className="px-3 py-2">
                      <StatusBadge variant={m.tipo === 'Entrada' ? 'success' : 'info'} dot={false}>
                        {m.tipo}
                      </StatusBadge>
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold ${m.cantidad > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{m.motivo}</td>
                    <td className="px-3 py-2 text-slate-500">{m.usuario}</td>
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
