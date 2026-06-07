'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { dbService, Producto, Cliente, VentaComercial, CajaTurno } from '@/lib/db';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import GradientModal from '@/components/ui/GradientModal';
import GradientToast from '@/components/ui/GradientToast';
import { Alert } from '@/components/ui/GradientToast';
import {
  SearchIcon,
  PlusIcon,
  LockIcon,
  CloseIcon,
  PowerIcon,
  UserPlusIcon,
  PhoneIcon,
  EyeIcon,
  WarningIcon,
  BillIcon,
  ComercialIcon,
  ClockIcon,
  PackageIcon,
  CheckIcon,
  TrashIcon,
} from '@/components/Icons';

// =========================================================================
// Helpers
// =========================================================================

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatTimePe(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDurationPe(start: string) {
  const diff = Date.now() - new Date(start).getTime();
  const h = Math.floor(diff / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  return `${h}h ${m}m`;
}

function getStockBadge(producto: Producto) {
  const { stock_actual, stock_minimo } = producto;
  if (stock_actual <= 0) return { variant: 'danger' as const, label: 'Sin Stock' };
  if (stock_actual <= stock_minimo) return { variant: 'warning' as const, label: 'Bajo' };
  if (stock_actual <= stock_minimo * 2) return { variant: 'info' as const, label: 'Limitado' };
  return { variant: 'success' as const, label: 'OK' };
}

// =========================================================================
// Page
// =========================================================================

export default function CanalComercialPage() {
  const { usuario, cajaId, setCajaId, loading: sessionLoading } = useSession();

  // --- Data states ---
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cajaActiva, setCajaActiva] = useState<CajaTurno | null>(null);
  const [ventasDelTurno, setVentasDelTurno] = useState<VentaComercial[]>([]);
  const [cart, setCart] = useState<{ producto: Producto; cantidad: number }[]>([]);

  // --- UI states ---
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA'>('BOLETA');
  const [showClientResults, setShowClientResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'venta' | 'historial'>('venta');
  const [montoApertura, setMontoApertura] = useState<number>(200);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [montoCierreReal, setMontoCierreReal] = useState<number>(0);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [showVentaDetailModal, setShowVentaDetailModal] = useState<VentaComercial | null>(null);
  const [shakeItemId, setShakeItemId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState(false);

  // --- New client form ---
  const [nuevoClienteForm, setNuevoClienteForm] = useState({
    tipo_documento: 'DNI' as 'DNI' | 'RUC',
    numero_documento: '',
    razon_social_o_nombre: '',
    telefono: '',
  });

  // --- Alerts ---
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const addAlerta = useCallback((type: Alert['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((prev) => [...prev, { id, type, message }]);
  }, []);
  const removeAlerta = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // --- Refs ---
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const debouncedProductSearch = useDebounce(productSearch, 300);

  // =========================================================================
  // Load initial data
  // =========================================================================

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cls] = await Promise.all([
        dbService.getProducts(categoria === 'Todos' ? undefined : categoria),
        dbService.getClients(),
      ]);
      setProductos(prods);
      setClientes(cls);
    } catch (err) {
      console.error(err);
      addAlerta('error', 'Error al cargar los datos del catálogo.');
    } finally {
      setIsLoading(false);
    }
  }, [categoria, addAlerta]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // =========================================================================
  // Caja state sync
  // =========================================================================

  useEffect(() => {
    async function checkCaja() {
      if (!usuario) return;
      if (cajaId) {
        const caja = await dbService.getActiveCaja(usuario.id);
        if (caja) {
          setCajaActiva(caja);
          const ventas = await dbService.getVentasRecientes(caja.id);
          setVentasDelTurno(ventas);
        } else {
          setCajaId(null);
          setCajaActiva(null);
          setVentasDelTurno([]);
        }
      } else {
        setCajaActiva(null);
        setVentasDelTurno([]);
      }
    }
    checkCaja();
  }, [cajaId, usuario, setCajaId]);

  // =========================================================================
  // Click outside for client dropdown
  // =========================================================================

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setShowClientResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // =========================================================================
  // Auth guard
  // =========================================================================

  if (sessionLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'VENDEDOR' && usuario.rol !== 'REPRESENTANTE')) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md shadow-lg text-center">
          <WarningIcon className="w-12 h-12 text-red-500 mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Acceso Denegado</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Esta sección está reservada exclusivamente para Administradores y Personal de Ventas de FADICC S.A.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // Caja handlers
  // =========================================================================

  const handleAbrirTurno = async () => {
    if (montoApertura < 0) {
      addAlerta('error', 'El monto de apertura no puede ser negativo.');
      return;
    }
    try {
      const caja = await dbService.openCaja(usuario.id, montoApertura);
      setCajaId(caja.id);
      setCajaActiva(caja);
      addAlerta('success', `Turno abierto con S/ ${montoApertura.toFixed(2)}`);
    } catch {
      addAlerta('error', 'No se pudo abrir el turno.');
    }
  };

  const handleCerrarTurno = async () => {
    if (!cajaActiva) return;
    try {
      const success = await dbService.closeCaja(cajaActiva.id, montoCierreReal);
      if (success) {
        setCajaId(null);
        setCajaActiva(null);
        setCart([]);
        setShowCierreModal(false);
        addAlerta('info', 'Turno de caja cerrado exitosamente.');
      } else {
        addAlerta('error', 'Error al cerrar el turno de caja.');
      }
    } catch {
      addAlerta('error', 'Error del servidor al cerrar turno.');
    }
  };

  // =========================================================================
  // Cart handlers
  // =========================================================================

  const addToCart = (producto: Producto) => {
    if (!cajaActiva) {
      addAlerta('warning', 'Debes abrir el turno de caja antes de agregar productos.');
      return;
    }
    if (producto.stock_actual <= 0) {
      addAlerta('error', 'Este producto no cuenta con stock disponible.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id);
      if (existing) {
        if (existing.cantidad >= producto.stock_actual) {
          addAlerta('warning', `Stock máximo alcanzado para ${producto.nombre}.`);
          return prev;
        }
        return prev.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const updateCartQuantity = (productoId: string, cantidad: number) => {
    const item = cart.find((i) => i.producto.id === productoId);
    if (!item) return;

    if (cantidad <= 0) {
      setCart((prev) => prev.filter((i) => i.producto.id !== productoId));
      return;
    }

    if (cantidad > item.producto.stock_actual) {
      setShakeItemId(productoId);
      setTimeout(() => setShakeItemId(null), 500);
      addAlerta('warning', `Stock máximo disponible es ${item.producto.stock_actual}.`);
      return;
    }

    setCart((prev) => prev.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i)));
  };

  const removeFromCart = (productoId: string) => {
    setCart((prev) => prev.filter((i) => i.producto.id !== productoId));
  };

  // =========================================================================
  // Client handlers
  // =========================================================================

  const filteredClientes = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return [];
    return clientes.filter(
      (c) =>
        c.numero_documento.includes(q) ||
        c.razon_social_o_nombre.toLowerCase().includes(q) ||
        c.tipo_documento.toLowerCase().includes(q)
    );
  }, [clientSearch, clientes]);

  const selectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setClientSearch('');
    setShowClientResults(false);
  };

  const handleCrearClienteRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    const { tipo_documento, numero_documento, razon_social_o_nombre, telefono } = nuevoClienteForm;

    if (tipo_documento === 'DNI' && numero_documento.length !== 8) {
      addAlerta('error', 'El DNI debe tener 8 dígitos.');
      return;
    }
    if (tipo_documento === 'RUC' && numero_documento.length !== 11) {
      addAlerta('error', 'El RUC debe tener 11 dígitos.');
      return;
    }
    if (!razon_social_o_nombre.trim()) {
      addAlerta('error', 'Ingresa el nombre o razón social.');
      return;
    }

    try {
      const created = await dbService.createCliente({
        tipo_documento,
        numero_documento,
        razon_social_o_nombre,
        telefono: telefono || undefined,
      });
      setClientes((prev) => [...prev, created]);
      setSelectedCliente(created);
      setShowNuevoClienteModal(false);
      setNuevoClienteForm({
        tipo_documento: 'DNI',
        numero_documento: '',
        razon_social_o_nombre: '',
        telefono: '',
      });
      addAlerta('success', 'Cliente registrado y seleccionado.');
    } catch {
      addAlerta('error', 'No se pudo registrar al cliente.');
    }
  };

  // =========================================================================
  // Confirm sale
  // =========================================================================

  const handleConfirmarVenta = async () => {
    if (!cajaActiva) return;
    if (!selectedCliente) {
      addAlerta('warning', 'Por favor, selecciona un cliente para el comprobante.');
      return;
    }
    if (cart.length === 0) {
      addAlerta('warning', 'El carrito está vacío.');
      return;
    }

    try {
      const detallesVenta = cart.map((item) => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_base,
      }));

      const ticketNum = await dbService.registrarVentaDirecta({
        cliente_id: selectedCliente.id,
        vendedor_id: usuario.id,
        caja_turno_id: cajaActiva.id,
        tipo_comprobante: tipoComprobante,
        total: cartTotal,
        detalles: detallesVenta,
      });

      addAlerta('success', `Venta registrada: ${ticketNum}`);
      setCart([]);
      setSelectedCliente(null);
      loadInitialData();

      const ventas = await dbService.getVentasRecientes(cajaActiva.id);
      setVentasDelTurno(ventas);
    } catch (err) {
      console.error(err);
      addAlerta('error', 'Error al procesar la venta.');
    }
  };

  // =========================================================================
  // Derived state
  // =========================================================================

  const cartSubtotalRaw = cart.reduce(
    (sum, item) => sum + item.producto.precio_base * item.cantidad,
    0
  );
  const cartTotal = cartSubtotalRaw;
  const cartSubtotal = cartTotal / 1.18;
  const cartIgv = cartTotal - cartSubtotal;

  const filteredProductos = useMemo(() => {
    const q = debouncedProductSearch.toLowerCase().trim();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [debouncedProductSearch, productos]);

  const categorias = ['Todos', 'Industrial', 'Comercial', 'Doméstico'];

  const canConfirm = cajaActiva && selectedCliente && cart.length > 0;

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="min-h-full p-6">
      <GradientToast alerts={alerts} onRemove={removeAlerta} />

      {/* ==================== BANNER ESTADO CAJA ==================== */}
      <div
        className={`sticky top-0 z-30 rounded-xl border backdrop-blur px-5 py-3 mb-6 transition-all ${
          cajaActiva
            ? 'bg-emerald-50/90 border-emerald-200'
            : 'bg-red-50/90 border-red-200'
        }`}
      >
        {cajaActiva ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-800">Caja Activa</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-emerald-700">
                  <span className="font-mono">Apertura: S/ {cajaActiva.monto_apertura.toFixed(2)}</span>
                  <span className="text-emerald-300">•</span>
                  <span className="font-mono">Desde: {formatTimePe(cajaActiva.fecha_apertura)}</span>
                  <span className="text-emerald-300">•</span>
                  <StatusBadge variant="success" className="text-[10px] py-0 px-1.5">
                    {formatDurationPe(cajaActiva.fecha_apertura)}
                  </StatusBadge>
                </div>
              </div>
            </div>
            <GradientButton
              variant="danger"
              size="sm"
              onClick={() => {
                const totalVentas = ventasDelTurno.reduce((s, v) => s + v.total, 0);
                setMontoCierreReal(cajaActiva.monto_apertura + totalVentas);
                setShowCierreModal(true);
              }}
            >
              Cerrar Turno
            </GradientButton>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <div>
                <p className="text-sm font-bold text-red-800">Caja Cerrada — Debes abrir un turno para vender</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <GlassInput
                type="number"
                min={0}
                value={montoApertura}
                onChange={(e) => setMontoApertura(Number(e.target.value))}
                placeholder="Monto de apertura"
                className="w-32 font-mono"
                iconLeft={<span className="text-xs text-slate-500 font-semibold">S/</span>}
              />
              <GradientButton variant="success" size="sm" onClick={handleAbrirTurno} className="shrink-0">
                <PowerIcon size={16} /> Abrir Turno
              </GradientButton>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MAIN GRID ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ==================== CATÁLOGO ==================== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Buscador + Filtros */}
          <GradientCard className="p-5">
            <div className="space-y-4">
              <GlassInput
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                iconLeft={<SearchIcon size={18} />}
              />

              {/* Categorías */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoria(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                      categoria === cat
                        ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </GradientCard>

          {/* Grid Productos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : filteredProductos.length === 0 ? (
            <GradientCard className="p-10 text-center">
              <PackageIcon size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-400">Ningún producto coincide con la búsqueda.</p>
            </GradientCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProductos.map((p) => {
                const sinStock = p.stock_actual <= 0;
                const stockBadge = getStockBadge(p);
                return (
                  <GradientCard
                    key={p.id}
                    className={`relative group ${sinStock ? 'opacity-50' : ''}`}
                    hover={!sinStock}
                  >
                    {/* Sin stock overlay */}
                    {sinStock && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-sm rounded-xl">
                        <LockIcon size={24} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sin Stock</span>
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      {/* Imagen */}
                      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-slate-100 to-white rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                        {p.imagen ? (
                          <img
                            src={p.imagen}
                            alt={p.nombre}
                            className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105 drop-shadow-sm"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1.5">
                            <PackageIcon size={36} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Sin imagen</span>
                          </div>
                        )}
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          {p.sku}
                        </span>
                        <StatusBadge variant={stockBadge.variant} className="text-[10px] py-0 px-1.5">
                          {stockBadge.label}
                        </StatusBadge>
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2">{p.nombre}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {p.descripcion || 'Sin descripción disponible.'}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-end justify-between pt-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-semibold text-slate-500">S/</span>
                          <span className="text-2xl font-bold font-mono text-slate-900">
                            {p.precio_base.toFixed(2)}
                          </span>
                        </div>
                        <GradientButton
                          variant="primary"
                          size="sm"
                          className="w-full max-w-[160px]"
                          disabled={sinStock || !cajaActiva}
                          onClick={() => addToCart(p)}
                        >
                          <PlusIcon size={14} /> Agregar al Carrito
                        </GradientButton>
                      </div>
                    </div>
                  </GradientCard>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================== PANEL VENTA ==================== */}
        <div className="lg:col-span-1 sticky top-28">
          <GradientCard className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('venta')}
                className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'venta'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <ComercialIcon size={16} />
                  <span>Venta Actual</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'historial'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <BillIcon size={16} />
                  <span>Historial del Turno</span>
                </div>
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col overflow-hidden">
              {activeTab === 'venta' ? (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {/* Cliente selector */}
                  <div className="space-y-4 flex-shrink-0">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                        Cliente
                      </label>
                      {selectedCliente ? (
                        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{selectedCliente.razon_social_o_nombre}</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                              {selectedCliente.tipo_documento}: {selectedCliente.numero_documento}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedCliente(null)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-100 shrink-0"
                            aria-label="Quitar cliente"
                          >
                            <CloseIcon size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative" ref={clientDropdownRef}>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <GlassInput
                                type="text"
                                placeholder="Buscar por nombre, DNI o RUC..."
                                value={clientSearch}
                                onChange={(e) => {
                                  setClientSearch(e.target.value);
                                  setShowClientResults(e.target.value.trim().length > 0);
                                }}
                                onFocus={() => setShowClientResults(clientSearch.trim().length > 0)}
                                className="text-xs"
                              />
                              {clientSearch && (
                                <button
                                  onClick={() => {
                                    setClientSearch('');
                                    setShowClientResults(false);
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  <CloseIcon size={14} />
                                </button>
                              )}
                            </div>
                            <GradientButton
                              variant="secondary"
                              size="sm"
                              onClick={() => setShowNuevoClienteModal(true)}
                              className="shrink-0 px-2.5"
                            >
                              <UserPlusIcon size={16} />
                            </GradientButton>
                          </div>

                          {/* Dropdown */}
                          {showClientResults && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                              {filteredClientes.length === 0 ? (
                                <div className="p-3 text-center">
                                  <p className="text-xs text-slate-400">Sin resultados</p>
                                  <button
                                    onClick={() => {
                                      setShowClientResults(false);
                                      setShowNuevoClienteModal(true);
                                    }}
                                    className="text-xs text-orange-600 font-semibold mt-1 hover:underline"
                                  >
                                    Crear cliente
                                  </button>
                                </div>
                              ) : (
                                filteredClientes.slice(0, 6).map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => selectCliente(c)}
                                    className="w-full text-left p-3 hover:bg-slate-50 flex flex-col gap-0.5 text-xs transition-colors"
                                  >
                                    <span className="font-bold text-slate-800 truncate">{c.razon_social_o_nombre}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {c.tipo_documento}: {c.numero_documento}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Toggle Boleta / Factura */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                        Comprobante
                      </label>
                      <div className="rounded-lg border border-slate-200 p-0.5 bg-slate-100 flex">
                        <button
                          type="button"
                          onClick={() => setTipoComprobante('BOLETA')}
                          className={`flex-1 py-1.5 text-center text-xs rounded-md transition-all font-semibold ${
                            tipoComprobante === 'BOLETA'
                              ? 'bg-white shadow-sm text-slate-900 font-bold'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Boleta
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoComprobante('FACTURA')}
                          className={`flex-1 py-1.5 text-center text-xs rounded-md transition-all font-semibold ${
                            tipoComprobante === 'FACTURA'
                              ? 'bg-white shadow-sm text-slate-900 font-bold'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Factura
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Carrito */}
                  <div className="border-t border-slate-100 pt-3 flex-1 overflow-y-auto min-h-0 my-3 pr-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                      Carrito ({cart.reduce((s, i) => s + i.cantidad, 0)} items)
                    </label>

                    {cart.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg bg-slate-50/50 font-semibold">
                        Carrito vacío. Agrega productos del catálogo.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div
                            key={item.producto.id}
                            className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs flex flex-col gap-2 transition-all group ${
                              shakeItemId === item.producto.id ? 'animate-shake border-red-300' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 leading-tight truncate">{item.producto.nombre}</p>
                                <p className="font-mono text-[10px] text-slate-400">{item.producto.sku}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.producto.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100"
                                aria-label="Eliminar"
                              >
                                <TrashIcon size={14} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GlassInput
                                  type="number"
                                  min={1}
                                  max={item.producto.stock_actual}
                                  value={item.cantidad}
                                  onChange={(e) => updateCartQuantity(item.producto.id, Number(e.target.value))}
                                  className="w-16 font-mono text-center py-1 text-xs"
                                />
                                <span className="text-[10px] text-slate-400 font-mono">
                                  S/ {item.producto.precio_base.toFixed(2)} c/u
                                </span>
                              </div>
                              <span className="text-sm font-bold font-mono text-slate-900">
                                S/ {(item.producto.precio_base * item.cantidad).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumen + Confirmar */}
                  <div className="border-t border-slate-200 pt-4 flex-shrink-0 space-y-4">
                    <div className="space-y-1.5 text-xs font-semibold">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-mono font-bold">S/ {cartSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>IGV (18%)</span>
                        <span className="font-mono font-bold">S/ {cartIgv.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-200 mt-2">
                        <span className="text-sm font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-bold font-mono text-slate-900">
                          S/ {cartTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <GradientButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={!canConfirm}
                      onClick={handleConfirmarVenta}
                    >
                      <CheckIcon size={18} /> Confirmar y Emitir Pago
                    </GradientButton>
                    {!canConfirm && (
                      <p className="text-[10px] text-center text-slate-400">
                        {!cajaActiva
                          ? 'Abre un turno de caja para continuar'
                          : !selectedCliente
                          ? 'Selecciona un cliente para continuar'
                          : 'Agrega productos al carrito para continuar'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* ==================== HISTORIAL ==================== */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">
                    <span>Transacciones Recientes</span>
                    <span className="text-slate-400">{ventasDelTurno.length} ventas</span>
                  </div>

                  {ventasDelTurno.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-center gap-2">
                      <BillIcon size={32} className="opacity-40" />
                      <p className="font-semibold text-xs">No se registran ventas en este turno.</p>
                    </div>
                  ) : (
                    <div className="overflow-auto flex-1 pr-1">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-400 tracking-wider">
                            <th className="text-left py-2 font-semibold">Hora</th>
                            <th className="text-left py-2 font-semibold">Tipo</th>
                            <th className="text-left py-2 font-semibold">N° Doc</th>
                            <th className="text-left py-2 font-semibold">Cliente</th>
                            <th className="text-right py-2 font-semibold">Total</th>
                            <th className="text-right py-2 font-semibold">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ventasDelTurno.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2 font-mono text-slate-600">
                                <div className="flex items-center gap-1">
                                  <ClockIcon size={12} />
                                  {formatTimePe(v.fecha_venta)}
                                </div>
                              </td>
                              <td className="py-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                    v.tipo_comprobante === 'BOLETA'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-violet-50 text-violet-700 border-violet-200'
                                  }`}
                                >
                                  {v.tipo_comprobante === 'BOLETA' ? 'BOL' : 'FAC'}
                                </span>
                              </td>
                              <td className="py-2 font-mono font-semibold text-slate-700">{v.numero_comprobante}</td>
                              <td className="py-2 text-slate-700 truncate max-w-[120px]">{v.cliente_nombre}</td>
                              <td className="py-2 text-right font-mono font-bold text-slate-900">
                                S/ {v.total.toFixed(2)}
                              </td>
                              <td className="py-2 text-right">
                                <button
                                  onClick={() => setShowVentaDetailModal(v)}
                                  className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold text-[10px] px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                                >
                                  <EyeIcon size={12} /> Ver
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GradientCard>
        </div>
      </div>

      {/* ==================== MODAL NUEVO CLIENTE ==================== */}
      <GradientModal
        isOpen={showNuevoClienteModal}
        onClose={() => setShowNuevoClienteModal(false)}
        title="Nuevo Cliente Rápido"
        size="sm"
        footer={
          <>
            <GradientButton variant="secondary" size="sm" onClick={() => setShowNuevoClienteModal(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="sm" onClick={handleCrearClienteRapido}>
              Guardar
            </GradientButton>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCrearClienteRapido(e);
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tipo de Documento</label>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 mt-1.5">
              <button
                type="button"
                onClick={() =>
                  setNuevoClienteForm((f) => ({ ...f, tipo_documento: 'DNI', numero_documento: '' }))
                }
                className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${
                  nuevoClienteForm.tipo_documento === 'DNI'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                DNI
              </button>
              <button
                type="button"
                onClick={() =>
                  setNuevoClienteForm((f) => ({ ...f, tipo_documento: 'RUC', numero_documento: '' }))
                }
                className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${
                  nuevoClienteForm.tipo_documento === 'RUC'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                RUC
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Número</label>
            <GlassInput
              type="text"
              required
              maxLength={nuevoClienteForm.tipo_documento === 'DNI' ? 8 : 11}
              value={nuevoClienteForm.numero_documento}
              onChange={(e) =>
                setNuevoClienteForm((f) => ({
                  ...f,
                  numero_documento: e.target.value.replace(/\D/g, ''),
                }))
              }
              placeholder={nuevoClienteForm.tipo_documento === 'DNI' ? '8 dígitos' : '11 dígitos'}
              className="mt-1.5 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Razón Social / Nombre
            </label>
            <GlassInput
              type="text"
              required
              value={nuevoClienteForm.razon_social_o_nombre}
              onChange={(e) =>
                setNuevoClienteForm((f) => ({ ...f, razon_social_o_nombre: e.target.value }))
              }
              placeholder="Ej. Comercial Fénix S.A.C."
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Teléfono</label>
            <GlassInput
              type="text"
              value={nuevoClienteForm.telefono}
              onChange={(e) => setNuevoClienteForm((f) => ({ ...f, telefono: e.target.value }))}
              placeholder="Ej. 999888777"
              className="mt-1.5"
              iconLeft={<PhoneIcon size={14} />}
            />
          </div>
        </form>
      </GradientModal>

      {/* ==================== MODAL CIERRE CAJA ==================== */}
      <GradientModal
        isOpen={showCierreModal}
        onClose={() => setShowCierreModal(false)}
        title="Cerrar Caja & Cuadre"
        size="sm"
        footer={
          <>
            <GradientButton variant="secondary" size="sm" onClick={() => setShowCierreModal(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="danger" size="sm" onClick={handleCerrarTurno}>
              Cerrar Caja
            </GradientButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Monto Inicial Apertura</span>
              <span className="font-mono text-slate-800 font-bold">S/ {cajaActiva?.monto_apertura.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ventas Directas Registradas</span>
              <span className="font-mono text-slate-800 font-bold">
                S/ {ventasDelTurno.reduce((s, v) => s + v.total, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-slate-700">
              <span>Monto Estimado Esperado</span>
              <span className="font-mono text-orange-600 text-sm font-black">
                S/{((cajaActiva?.monto_apertura || 0) + ventasDelTurno.reduce((s, v) => s + v.total, 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Monto Físico de Cierre (Efectivo/Caja)
            </label>
            <GlassInput
              type="number"
              value={montoCierreReal}
              onChange={(e) => setMontoCierreReal(Number(e.target.value))}
              className="mt-1.5 font-mono"
              iconLeft={<span className="text-xs text-slate-500 font-semibold">S/</span>}
            />
            {cajaActiva && (
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">
                Diferencia:{' '}
                <span
                  className={
                    montoCierreReal - (cajaActiva.monto_apertura + ventasDelTurno.reduce((s, v) => s + v.total, 0)) >= 0
                      ? 'text-emerald-600 font-bold'
                      : 'text-red-600 font-bold'
                  }
                >
                  S/{' '}
                  {(montoCierreReal - (cajaActiva.monto_apertura + ventasDelTurno.reduce((s, v) => s + v.total, 0))).toFixed(2)}
                </span>{' '}
                {montoCierreReal - (cajaActiva.monto_apertura + ventasDelTurno.reduce((s, v) => s + v.total, 0)) === 0
                  ? '(Cuadre Perfecto)'
                  : montoCierreReal - (cajaActiva.monto_apertura + ventasDelTurno.reduce((s, v) => s + v.total, 0)) > 0
                  ? '(Sobrante)'
                  : '(Faltante)'}
              </p>
            )}
          </div>
        </div>
      </GradientModal>

      {/* ==================== MODAL DETALLE VENTA ==================== */}
      <GradientModal
        isOpen={!!showVentaDetailModal}
        onClose={() => setShowVentaDetailModal(null)}
        title={`Venta ${showVentaDetailModal?.numero_comprobante ?? ''}`}
        size="sm"
      >
        {showVentaDetailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  showVentaDetailModal.tipo_comprobante === 'BOLETA'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-violet-50 text-violet-700 border-violet-200'
                }`}
              >
                {showVentaDetailModal.tipo_comprobante}
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                <ClockIcon size={12} />
                {formatTimePe(showVentaDetailModal.fecha_venta)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
              <p className="text-xs text-slate-500">
                <span className="font-semibold">Cliente:</span>{' '}
                <span className="text-slate-800">{showVentaDetailModal.cliente_nombre}</span>
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-semibold">Vendedor:</span>{' '}
                <span className="text-slate-800">{showVentaDetailModal.vendedor_nombre}</span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Detalles</p>
              {(showVentaDetailModal.detalles ?? []).map((d, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{d.nombre}</p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {d.cantidad} x S/ {d.precio_unitario.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-900">S/ {d.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-200">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                S/ {showVentaDetailModal.total.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </GradientModal>
    </div>
  );
}
