'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { Producto, Cliente, VentaComercial, CajaTurno } from '@/types';
import { getProducts } from '@/services/productoService';
import { getClients, createCliente, getEmpresaByClienteId, createContacto } from '@/services/clienteService';
import { getActiveCaja, openCaja, closeCaja, getVentasRecientes, getVentaById, registrarVentaDirecta } from '@/services/ventaService';
import { generarPdfVenta, generarPdfFactura } from '@/lib/pdfService';
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
  const [showShortcuts, setShowShortcuts] = useState(false);

  // FACTURA extra fields
  const [formaPago, setFormaPago] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
  const [guiaRemision, setGuiaRemision] = useState('');
  const [ordenCompra, setOrdenCompra] = useState('');
  const [moneda, setMoneda] = useState<'SOLES' | 'DOLARES'>('SOLES');
  const [numeroCuotas, setNumeroCuotas] = useState(1);
  const [fechaVencimientoCuota, setFechaVencimientoCuota] = useState('');
  const [montoCuota, setMontoCuota] = useState(0);

  // Quick client modal
  const [showQuickClienteModal, setShowQuickClienteModal] = useState(false);
  const [quickClienteTab, setQuickClienteTab] = useState<'persona' | 'empresa'>('empresa');
  const [quickDni, setQuickDni] = useState('');
  const [quickNombre, setQuickNombre] = useState('');
  const [quickTelefonoPersona, setQuickTelefonoPersona] = useState('');
  const [quickRazonSocial, setQuickRazonSocial] = useState('');
  const [quickRuc, setQuickRuc] = useState('');
  const [quickDireccion, setQuickDireccion] = useState('');

  // Refs for keyboard shortcuts
  const productSearchRef = useRef<HTMLInputElement>(null);
  const clientSearchRef = useRef<HTMLInputElement>(null);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in inputs/modals (except specific shortcuts)
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      if (e.key === 'F1' || e.key === '/') {
        e.preventDefault();
        productSearchRef.current?.focus();
        setShowClientResults(false);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        clientSearchRef.current?.focus();
        setShowClientResults(true);
      }
      if (e.key === 'F3' && cart.length > 0 && cajaActiva) {
        e.preventDefault();
        // Trigger payment: scroll to payment section or focus it
        const payBtn = document.getElementById('btn-procesar-pago');
        payBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        payBtn?.focus();
      }
      if (e.key === 'Escape') {
        if (showVentaDetailModal) {
          setShowVentaDetailModal(null);
        } else if (showNuevoClienteModal) {
          setShowNuevoClienteModal(false);
        } else if (showCierreModal) {
          setShowCierreModal(false);
        } else if (showClientResults) {
          setShowClientResults(false);
        }
      }
      if (e.key === '+' && !isTyping) {
        e.preventDefault();
        setCart(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          return prev.map((item, i) =>
            i === prev.length - 1 ? { ...item, cantidad: item.cantidad + 1 } : item
          );
        });
      }
      if (e.key === '-' && !isTyping) {
        e.preventDefault();
        setCart(prev => {
          if (prev.length === 0) return prev;
          return prev.map((item, i) =>
            i === prev.length - 1 ? { ...item, cantidad: Math.max(1, item.cantidad - 1) } : item
          );
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, cajaActiva, showVentaDetailModal, showNuevoClienteModal, showCierreModal, showClientResults, showShortcuts]);

  // --- Nuevo Cliente: separado en Persona / Empresa + Contacto ---
  const [nuevoClienteTab, setNuevoClienteTab] = useState<'persona' | 'empresa'>('persona');

  const [nuevaPersonaForm, setNuevaPersonaForm] = useState({
    numero_documento: '',
    nombre: '',
    telefono: '',
  });

  const [nuevaEmpresaForm, setNuevaEmpresaForm] = useState({
    ruc: '',
    razon_social: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const [nuevoContactoForm, setNuevoContactoForm] = useState({
    nombre: '',
    cargo: '',
    telefono: '',
    email: '',
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

  // --- Ver detalle de venta (carga completa con productos) ---
  const handleVerDetalleVenta = useCallback(async (venta: VentaComercial) => {
    setIsLoading(true);
    try {
      const completa = await getVentaById(venta.id);
      if (completa) {
        setShowVentaDetailModal(completa);
      } else {
        addAlerta('error', 'No se pudieron cargar los detalles de la venta.');
      }
    } catch {
      addAlerta('error', 'Error al cargar el detalle de la venta.');
    } finally {
      setIsLoading(false);
    }
  }, [addAlerta]);

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
        getProducts(categoria === 'Todos' ? undefined : categoria),
        getClients(),
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
      if (usuario.rol !== 'VENDEDOR' && usuario.rol !== 'ADMIN') return;
      try {
        // Siempre consultar base de datos para estado real de caja
        const caja = await getActiveCaja(usuario.id);
        if (caja) {
          setCajaActiva(caja);
          setCajaId(caja.id);
          const ventas = await getVentasRecientes(caja.id);
          setVentasDelTurno(ventas);
        } else {
          setCajaId(null);
          setCajaActiva(null);
          setVentasDelTurno([]);
        }
      } catch (err) {
        console.error('Error al cargar caja:', err);
      }
    }
    checkCaja();
  }, [usuario, setCajaId]);

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
      const caja = await openCaja(usuario.id, montoApertura);
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
      const success = await closeCaja(cajaActiva.id, montoCierreReal);
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

  const handleCrearPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    const { numero_documento, nombre, telefono } = nuevaPersonaForm;
    if (numero_documento.length !== 8) { addAlerta('error', 'El DNI debe tener 8 dígitos.'); return; }
    if (!nombre.trim()) { addAlerta('error', 'Ingresa el nombre completo.'); return; }
    try {
      const created = await createCliente({ tipo_documento: 'DNI', numero_documento, razon_social_o_nombre: nombre, telefono: telefono || undefined, tipo_cliente: 'PERSONA' });
      setClientes((prev) => [...prev, created]);
      setSelectedCliente(created);
      setShowNuevoClienteModal(false);
      setNuevaPersonaForm({ numero_documento: '', nombre: '', telefono: '' });
      addAlerta('success', 'Persona registrada y seleccionada.');
    } catch { addAlerta('error', 'No se pudo registrar a la persona.'); }
  };

  const handleCrearEmpresaYContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ruc, razon_social, telefono, email, direccion } = nuevaEmpresaForm;
    const { nombre, cargo, telefono: telContacto, email: emailContacto } = nuevoContactoForm;
    if (ruc.length !== 11) { addAlerta('error', 'El RUC debe tener 11 dígitos.'); return; }
    if (!razon_social.trim()) { addAlerta('error', 'Ingresa la razón social.'); return; }
    if (!nombre.trim()) { addAlerta('error', 'Debes registrar un contacto para la empresa.'); return; }
    try {
      const cliente = await createCliente({ tipo_documento: 'RUC', numero_documento: ruc, razon_social_o_nombre: razon_social, telefono: telefono || undefined, email: email || undefined, direccion: direccion || undefined, tipo_cliente: 'EMPRESA' });
      const empresa = await getEmpresaByClienteId(cliente.id);
      if (empresa) {
        await createContacto({ empresa_id: empresa.id, nombre, cargo: cargo || undefined, telefono: telContacto || undefined, email: emailContacto || undefined });
      }
      setClientes((prev) => [...prev, cliente]);
      setSelectedCliente(cliente);
      setShowNuevoClienteModal(false);
      setNuevaEmpresaForm({ ruc: '', razon_social: '', telefono: '', email: '', direccion: '' });
      setNuevoContactoForm({ nombre: '', cargo: '', telefono: '', email: '' });
      addAlerta('success', 'Empresa y contacto registrados.');
    } catch { addAlerta('error', 'No se pudo registrar la empresa.'); }
  };

  // =========================================================================
  // Confirm sale
  // =========================================================================

  const executeVenta = async (cliente: Cliente) => {
    if (!cajaActiva || !usuario) return;

    try {
      const detallesVenta = cart.map((item) => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_base,
      }));

      const payload: any = {
        cliente_id: cliente.id,
        vendedor_id: usuario.id,
        caja_turno_id: cajaActiva.id,
        tipo_comprobante: tipoComprobante,
        total: cartTotal,
        detalles: detallesVenta,
        forma_pago: formaPago,
        moneda: moneda,
      };

      if (tipoComprobante === 'FACTURA') {
        payload.guia_remision = guiaRemision || undefined;
        payload.orden_compra = ordenCompra || undefined;

        if (formaPago === 'CREDITO' && fechaVencimientoCuota) {
          payload.credito_total_cuotas = numeroCuotas;
          payload.credito_cuotas = Array.from({ length: numeroCuotas }, (_, i) => ({
            nro: i + 1,
            fecha_vencimiento: fechaVencimientoCuota,
            monto: montoCuota || cartTotal / numeroCuotas,
          }));
        }
      }

      const ticketNum = await registrarVentaDirecta(payload);

      addAlerta('success', `Venta registrada: ${ticketNum}`);
      setCart([]);
      setSelectedCliente(null);
      setFormaPago('CONTADO');
      setGuiaRemision('');
      setOrdenCompra('');
      setMoneda('SOLES');
      setNumeroCuotas(1);
      setFechaVencimientoCuota('');
      setMontoCuota(0);
      loadInitialData();

      const ventas = await getVentasRecientes(cajaActiva.id);
      setVentasDelTurno(ventas);
    } catch (err) {
      console.error(err);
      addAlerta('error', 'Error al procesar la venta.');
    }
  };

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

    if (tipoComprobante === 'FACTURA') {
      const hasRuc = selectedCliente.numero_documento?.length === 11;
      const hasDir = !!selectedCliente.direccion?.trim();
      if (!hasRuc || !hasDir) {
        setQuickRazonSocial(selectedCliente.razon_social_o_nombre || '');
        setQuickRuc(hasRuc ? selectedCliente.numero_documento : '');
        setQuickDireccion(selectedCliente.direccion || '');
        setQuickClienteTab(selectedCliente.tipo_documento === 'DNI' ? 'persona' : 'empresa');
        setShowQuickClienteModal(true);
        return;
      }
    }

    await executeVenta(selectedCliente);
  };

  const handleQuickClienteSave = async () => {
    try {
      if (quickClienteTab === 'persona') {
        if (quickDni.length !== 8) {
          addAlerta('error', 'El DNI debe tener 8 dígitos.');
          return;
        }
        if (!quickNombre.trim()) {
          addAlerta('error', 'Ingresa el nombre completo.');
          return;
        }
        if (!quickDireccion.trim()) {
          addAlerta('error', 'Ingresa la dirección.');
          return;
        }
        const created = await createCliente({
          tipo_documento: 'DNI',
          numero_documento: quickDni,
          razon_social_o_nombre: quickNombre,
          direccion: quickDireccion,
          telefono: quickTelefonoPersona || undefined,
          tipo_cliente: 'PERSONA',
        });
        setClientes((prev) => [...prev, created]);
        setSelectedCliente(created);
        setShowQuickClienteModal(false);
        setQuickDni('');
        setQuickNombre('');
        setQuickDireccion('');
        setQuickTelefonoPersona('');
        await executeVenta(created);
      } else {
        if (!quickRazonSocial.trim()) {
          addAlerta('error', 'Ingresa la Razón Social.');
          return;
        }
        if (quickRuc.length !== 11) {
          addAlerta('error', 'El RUC debe tener 11 dígitos.');
          return;
        }
        if (!quickDireccion.trim()) {
          addAlerta('error', 'Ingresa la dirección.');
          return;
        }
        const created = await createCliente({
          tipo_documento: 'RUC',
          numero_documento: quickRuc,
          razon_social_o_nombre: quickRazonSocial,
          direccion: quickDireccion,
          tipo_cliente: 'EMPRESA',
        });
        setClientes((prev) => [...prev, created]);
        setSelectedCliente(created);
        setShowQuickClienteModal(false);
        setQuickRazonSocial('');
        setQuickRuc('');
        setQuickDireccion('');
        await executeVenta(created);
      }
    } catch (err: any) {
      addAlerta('error', err?.message || 'Error al registrar el cliente.');
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

  const categorias = useMemo(() => {
    const cats = Array.from(new Set(productos.map((p) => p.categoria).filter((c): c is string => !!c)));
    return ['Todos', ...cats];
  }, [productos]);

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
              <div className="relative">
                <GlassInput
                  ref={productSearchRef}
                  type="text"
                  placeholder="Buscar por nombre o SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  iconLeft={<SearchIcon size={18} />}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  F1
                </span>
              </div>

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
                        <p className="text-[11px] font-semibold text-slate-600">
                          Stock disponible: <span className="font-mono text-orange-600">{p.stock_actual}</span> unidades
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
                            {selectedCliente.tipo_documento === 'RUC' && (
                              <p className="text-[10px] text-blue-600 mt-0.5">
                                Cliente Empresa
                              </p>
                            )}
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
                                ref={clientSearchRef}
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
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                F2
                              </span>
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
                                    {c.tipo_documento === 'RUC' && (
                                      <span className="text-[10px] text-blue-600">
                                        Cliente Empresa
                                      </span>
                                    )}
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

                  {/* FACTURA extra fields */}
                  {tipoComprobante === 'FACTURA' && (
                    <div className="border-t border-slate-100 pt-3 flex-shrink-0 space-y-3">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Datos de facturación
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500">Forma de pago</label>
                          <select
                            value={formaPago}
                            onChange={(e) => setFormaPago(e.target.value as 'CONTADO' | 'CREDITO')}
                            className="w-full mt-1 text-xs bg-white/70 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                          >
                            <option value="CONTADO">Contado</option>
                            <option value="CREDITO">Crédito</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500">Moneda</label>
                          <select
                            value={moneda}
                            onChange={(e) => setMoneda(e.target.value as 'SOLES' | 'DOLARES')}
                            className="w-full mt-1 text-xs bg-white/70 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                          >
                            <option value="SOLES">SOLES</option>
                            <option value="DOLARES">DÓLARES</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <GlassInput
                          type="text"
                          value={guiaRemision}
                          onChange={(e) => setGuiaRemision(e.target.value)}
                          placeholder="Guía de remisión"
                          className="text-xs"
                        />
                        <GlassInput
                          type="text"
                          value={ordenCompra}
                          onChange={(e) => setOrdenCompra(e.target.value)}
                          placeholder="Orden de compra"
                          className="text-xs"
                        />
                      </div>

                      {formaPago === 'CREDITO' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Crédito</span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500">N° cuotas</label>
                              <GlassInput
                                type="number"
                                min={1}
                                value={numeroCuotas}
                                onChange={(e) => setNumeroCuotas(Math.max(1, Number(e.target.value)))}
                                className="text-xs mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500">Vencimiento</label>
                              <GlassInput
                                type="date"
                                value={fechaVencimientoCuota}
                                onChange={(e) => setFechaVencimientoCuota(e.target.value)}
                                className="text-xs mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500">Monto por cuota</label>
                              <GlassInput
                                type="number"
                                min={0}
                                value={montoCuota || ''}
                                onChange={(e) => setMontoCuota(Number(e.target.value))}
                                placeholder={`Auto: ${(cartTotal / numeroCuotas).toFixed(2)}`}
                                className="text-xs mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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

                    <div className="relative">
                      <GradientButton
                        id="btn-procesar-pago"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        disabled={!canConfirm}
                        onClick={handleConfirmarVenta}
                      >
                        <CheckIcon size={18} /> Confirmar y Emitir Pago
                      </GradientButton>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                        F3
                      </span>
                    </div>
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
                <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <span>Transacciones Recientes</span>
                    <span className="text-slate-400">{ventasDelTurno.length} ventas</span>
                  </div>

                  {ventasDelTurno.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-center gap-2">
                      <BillIcon size={32} className="opacity-40" />
                      <p className="font-semibold text-xs">No se registran ventas en este turno.</p>
                    </div>
                  ) : (
                    <div className="overflow-auto flex-1 pr-1 space-y-3">
                      {ventasDelTurno.map((v) => (
                        <div
                          key={v.id}
                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleVerDetalleVenta(v)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    v.tipo_comprobante === 'BOLETA'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-violet-50 text-violet-700 border-violet-200'
                                  }`}
                                >
                                  {v.tipo_comprobante === 'BOLETA' ? 'BOLETA' : 'FACTURA'}
                                </span>
                                <span className="text-xs font-mono font-semibold text-slate-700">{v.numero_comprobante}</span>
                              </div>
                              <p className="text-sm font-bold text-slate-900 truncate">{v.cliente_nombre}</p>
                              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                <ClockIcon size={12} />
                                {formatTimePe(v.fecha_venta)}
                              </div>
                              {v.tipo_comprobante === 'FACTURA' && (
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                                  {v.forma_pago && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                      {v.forma_pago}
                                    </span>
                                  )}
                                  {v.moneda && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                      {v.moneda}
                                    </span>
                                  )}
                                  {v.orden_compra && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                      OC: {v.orden_compra}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold font-mono text-slate-900">
                                S/ {v.total.toFixed(2)}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerDetalleVenta(v);
                                }}
                                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold text-xs mt-1 px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                              >
                                <EyeIcon size={12} /> Ver detalle
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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
        title="Nuevo Cliente"
        size="md"
      >
        {/* Tabs Persona / Empresa */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 mb-4">
          <button
            type="button"
            onClick={() => setNuevoClienteTab('persona')}
            className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${
              nuevoClienteTab === 'persona' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Persona (DNI)
          </button>
          <button
            type="button"
            onClick={() => setNuevoClienteTab('empresa')}
            className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${
              nuevoClienteTab === 'empresa' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Empresa + Contacto (RUC)
          </button>
        </div>

        {nuevoClienteTab === 'persona' ? (
          <form onSubmit={handleCrearPersona} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">DNI</label>
              <GlassInput type="text" required maxLength={8} value={nuevaPersonaForm.numero_documento} onChange={(e) => setNuevaPersonaForm((f) => ({ ...f, numero_documento: e.target.value.replace(/\D/g, '') }))} placeholder="8 dígitos" className="mt-1.5 font-mono" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nombre completo</label>
              <GlassInput type="text" required value={nuevaPersonaForm.nombre} onChange={(e) => setNuevaPersonaForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Juan Pérez García" className="mt-1.5" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Teléfono</label>
              <GlassInput type="text" value={nuevaPersonaForm.telefono} onChange={(e) => setNuevaPersonaForm((f) => ({ ...f, telefono: e.target.value }))} placeholder="Ej. 912449977" className="mt-1.5" iconLeft={<PhoneIcon size={14} />} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <GradientButton variant="secondary" size="sm" onClick={() => setShowNuevoClienteModal(false)}>Cancelar</GradientButton>
              <GradientButton variant="primary" size="sm" onClick={handleCrearPersona}>Guardar Persona</GradientButton>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCrearEmpresaYContacto} className="space-y-4">
            <div className="bg-orange-50/40 border border-orange-100 rounded-lg p-3 space-y-3">
              <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Datos de la empresa</span>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">RUC</label>
                <GlassInput type="text" required maxLength={11} value={nuevaEmpresaForm.ruc} onChange={(e) => setNuevaEmpresaForm((f) => ({ ...f, ruc: e.target.value.replace(/\D/g, '') }))} placeholder="11 dígitos" className="mt-1.5 font-mono" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Razón social</label>
                <GlassInput type="text" required value={nuevaEmpresaForm.razon_social} onChange={(e) => setNuevaEmpresaForm((f) => ({ ...f, razon_social: e.target.value }))} placeholder="Ej. Comercial Fénix S.A.C." className="mt-1.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Teléfono empresa</label>
                <GlassInput type="text" value={nuevaEmpresaForm.telefono} onChange={(e) => setNuevaEmpresaForm((f) => ({ ...f, telefono: e.target.value }))} placeholder="Ej. +51 912 449 977" className="mt-1.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email empresa</label>
                <GlassInput type="email" value={nuevaEmpresaForm.email} onChange={(e) => setNuevaEmpresaForm((f) => ({ ...f, email: e.target.value }))} placeholder="Ej. ventas@empresa.com" className="mt-1.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dirección</label>
                <GlassInput type="text" value={nuevaEmpresaForm.direccion} onChange={(e) => setNuevaEmpresaForm((f) => ({ ...f, direccion: e.target.value }))} placeholder="Ej. Av. Javier Prado 1234" className="mt-1.5" />
              </div>
            </div>

            <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2">
                <UserPlusIcon size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Contacto de la empresa</span>
                <span className="text-[10px] text-red-500 font-semibold">* obligatorio</span>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nombre del contacto</label>
                <GlassInput type="text" required value={nuevoContactoForm.nombre} onChange={(e) => setNuevoContactoForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Juan Pérez" className="mt-1.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cargo</label>
                <GlassInput type="text" value={nuevoContactoForm.cargo} onChange={(e) => setNuevoContactoForm((f) => ({ ...f, cargo: e.target.value }))} placeholder="Ej. Gerente de Compras" className="mt-1.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Teléfono del contacto</label>
                <GlassInput type="text" value={nuevoContactoForm.telefono} onChange={(e) => setNuevoContactoForm((f) => ({ ...f, telefono: e.target.value }))} placeholder="Ej. 912449977" className="mt-1.5" iconLeft={<PhoneIcon size={14} />} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email del contacto</label>
                <GlassInput type="email" value={nuevoContactoForm.email} onChange={(e) => setNuevoContactoForm((f) => ({ ...f, email: e.target.value }))} placeholder="Ej. contacto@empresa.com" className="mt-1.5" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <GradientButton variant="secondary" size="sm" onClick={() => setShowNuevoClienteModal(false)}>Cancelar</GradientButton>
              <GradientButton variant="primary" size="sm" onClick={handleCrearEmpresaYContacto}>Guardar Empresa + Contacto</GradientButton>
            </div>
          </form>
        )}
      </GradientModal>

      {/* ==================== MODAL QUICK CLIENTE ==================== */}
      <GradientModal
        isOpen={showQuickClienteModal}
        onClose={() => setShowQuickClienteModal(false)}
        title="Registrar cliente rápido"
        size="sm"
        footer={
          <>
            <GradientButton variant="secondary" size="sm" onClick={() => setShowQuickClienteModal(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="sm" onClick={handleQuickClienteSave}>
              Guardar y continuar
            </GradientButton>
          </>
        }
      >
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 mb-4">
          <button
            type="button"
            onClick={() => setQuickClienteTab('persona')}
            className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${
              quickClienteTab === 'persona' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Persona Natural (DNI)
          </button>
          <button
            type="button"
            onClick={() => setQuickClienteTab('empresa')}
            className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${
              quickClienteTab === 'empresa' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Empresa (RUC)
          </button>
        </div>

        {quickClienteTab === 'persona' ? (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">DNI</label>
              <GlassInput
                type="text"
                maxLength={8}
                value={quickDni}
                onChange={(e) => setQuickDni(e.target.value.replace(/\D/g, ''))}
                placeholder="8 dígitos"
                className="mt-1.5 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nombre completo</label>
              <GlassInput
                type="text"
                value={quickNombre}
                onChange={(e) => setQuickNombre(e.target.value)}
                placeholder="Ej. Juan Pérez García"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dirección</label>
              <GlassInput
                type="text"
                value={quickDireccion}
                onChange={(e) => setQuickDireccion(e.target.value)}
                placeholder="Ej. Av. Arequipa 1234, Lima"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Teléfono</label>
              <GlassInput
                type="text"
                value={quickTelefonoPersona}
                onChange={(e) => setQuickTelefonoPersona(e.target.value)}
                placeholder="Ej. 912449977"
                className="mt-1.5"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Razón Social</label>
              <GlassInput
                type="text"
                value={quickRazonSocial}
                onChange={(e) => setQuickRazonSocial(e.target.value)}
                placeholder="Ej. Comercial Fénix S.A.C."
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">RUC</label>
              <GlassInput
                type="text"
                maxLength={11}
                value={quickRuc}
                onChange={(e) => setQuickRuc(e.target.value.replace(/\D/g, ''))}
                placeholder="11 dígitos"
                className="mt-1.5 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dirección</label>
              <GlassInput
                type="text"
                value={quickDireccion}
                onChange={(e) => setQuickDireccion(e.target.value)}
                placeholder="Ej. Av. Javier Prado 1234, Lima"
                className="mt-1.5"
              />
            </div>
          </div>
        )}
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
        title={`${showVentaDetailModal?.tipo_comprobante === 'BOLETA' ? 'Boleta' : 'Factura'} ${showVentaDetailModal?.numero_comprobante ?? ''}`}
        size="md"
      >
        {showVentaDetailModal && (
          <div className="space-y-5">
            {/* Header con tipo y fecha */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    showVentaDetailModal.tipo_comprobante === 'BOLETA'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-violet-50 text-violet-700 border-violet-200'
                  }`}
                >
                  {showVentaDetailModal.tipo_comprobante === 'BOLETA' ? 'BOLETA DE VENTA' : 'FACTURA ELECTRÓNICA'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Fecha y hora</p>
                <p className="text-sm font-mono font-semibold text-slate-700">
                  {new Date(showVentaDetailModal.fecha_venta).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs font-mono text-slate-500">
                  {formatTimePe(showVentaDetailModal.fecha_venta)}
                </p>
              </div>
            </div>

            {/* Datos del cliente y vendedor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Cliente</p>
                <p className="text-sm font-bold text-slate-900">{showVentaDetailModal.cliente_nombre || 'Cliente General'}</p>
                {showVentaDetailModal.tipo_comprobante === 'FACTURA' && (
                  <>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">RUC: {showVentaDetailModal.receptor_ruc || '—'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{showVentaDetailModal.receptor_direccion || '—'}</p>
                  </>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Vendedor</p>
                <p className="text-sm font-semibold text-slate-800">{showVentaDetailModal.vendedor_nombre || 'Vendedor'}</p>
                {showVentaDetailModal.tipo_comprobante === 'FACTURA' && (
                  <>
                    <p className="text-[10px] text-slate-500 mt-1">{showVentaDetailModal.emisor_razon_social || 'FADICC S.A.'}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">RUC: {showVentaDetailModal.emisor_ruc || '—'}</p>
                  </>
                )}
              </div>
            </div>

            {/* FACTURA extra info */}
            {showVentaDetailModal.tipo_comprobante === 'FACTURA' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span><span className="text-slate-400">Forma de pago:</span> <span className="font-semibold text-slate-800">{showVentaDetailModal.forma_pago || '—'}</span></span>
                  <span><span className="text-slate-400">Moneda:</span> <span className="font-semibold text-slate-800">{showVentaDetailModal.moneda || '—'}</span></span>
                  <span><span className="text-slate-400">Guía remisión:</span> <span className="font-semibold text-slate-800">{showVentaDetailModal.guia_remision || '—'}</span></span>
                  <span><span className="text-slate-400">Orden compra:</span> <span className="font-semibold text-slate-800">{showVentaDetailModal.orden_compra || '—'}</span></span>
                </div>
              </div>
            )}

            {/* Productos como tarjetas */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Productos</p>
              <div className="space-y-3">
                {(showVentaDetailModal.detalles ?? []).map((d, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{d.nombre || 'Producto'}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">SKU: {d.sku || '—'}</p>
                    </div>
                    <div className="text-center shrink-0 px-3">
                      <p className="text-xs text-slate-400">Cant.</p>
                      <p className="text-sm font-bold font-mono text-slate-800">{d.cantidad}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">P. Unit.</p>
                      <p className="text-sm font-mono text-slate-700">S/ {d.precio_unitario.toFixed(2)}</p>
                    </div>
                    <div className="text-right shrink-0 min-w-[80px]">
                      <p className="text-xs text-slate-400">Subtotal</p>
                      <p className="text-sm font-bold font-mono text-slate-900">S/ {d.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales desglosados */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              {showVentaDetailModal.tipo_comprobante === 'FACTURA' && (
                <>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">S/ {(showVentaDetailModal.subtotal ?? showVentaDetailModal.total / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Descuentos</span>
                    <span className="font-mono">S/ {(showVentaDetailModal.descuentos || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Valor Venta</span>
                    <span className="font-mono">S/ {(showVentaDetailModal.valor_venta ?? showVentaDetailModal.total / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>IGV (18%)</span>
                    <span className="font-mono">S/ {(showVentaDetailModal.igv ?? (showVentaDetailModal.total - showVentaDetailModal.total / 1.18)).toFixed(2)}</span>
                  </div>
                </>
              )}
              {showVentaDetailModal.tipo_comprobante === 'BOLETA' && (
                <>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">S/ {(showVentaDetailModal.total / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>IGV (18%)</span>
                    <span className="font-mono">S/ {(showVentaDetailModal.total - showVentaDetailModal.total / 1.18).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-300">
                <span className="text-base font-bold text-slate-900">TOTAL</span>
                <span className="text-2xl font-bold font-mono text-orange-600">
                  S/ {(showVentaDetailModal.importe_total ?? showVentaDetailModal.total).toFixed(2)}
                </span>
              </div>
              {showVentaDetailModal.monto_letras && (
                <p className="text-[10px] text-slate-500">Son: {showVentaDetailModal.monto_letras}</p>
              )}

              {showVentaDetailModal.tipo_comprobante === 'FACTURA' && showVentaDetailModal.detraccion_monto && (
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detracción</p>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Leyenda</span>
                    <span>{showVentaDetailModal.detraccion_leyenda}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Monto</span>
                    <span className="font-mono">S/ {showVentaDetailModal.detraccion_monto.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {showVentaDetailModal.tipo_comprobante === 'FACTURA' && showVentaDetailModal.forma_pago === 'CREDITO' && showVentaDetailModal.credito_cuotas && (
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Crédito</p>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Monto neto</span>
                    <span className="font-mono">S/ {(showVentaDetailModal.credito_monto_neto || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Cuotas</span>
                    <span>{showVentaDetailModal.credito_total_cuotas}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <GradientButton
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={async () => {
                  const ventaCompleta = await getVentaById(showVentaDetailModal.id);
                  if (!ventaCompleta) {
                    addAlerta('error', 'No se pudo cargar los detalles de la venta.');
                    return;
                  }
                  if (ventaCompleta.tipo_comprobante === 'FACTURA') {
                    generarPdfFactura(ventaCompleta);
                  } else {
                    generarPdfVenta(ventaCompleta);
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF
              </GradientButton>
            </div>
          </div>
        )}
      </GradientModal>

      {/* Teclado rápido — panel flotante */}
      {showShortcuts && (
        <div className="fixed bottom-6 right-6 z-40 w-72 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xl p-4 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">Atajos de teclado</h4>
            <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-slate-600">
              <CloseIcon size={16} />
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Buscar producto</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Buscar cliente</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Confirmar pago</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">+1 unidad (último item)</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">+</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">-1 unidad (último item)</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">-</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Cerrar modal / limpiar</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Esc</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Mostrar / ocultar ayuda</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">?</span>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante para abrir atajos */}
      <button
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-6 right-6 z-30 w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-orange-600 hover:border-orange-300 transition-all"
        title="Atajos de teclado (?)"
      >
        <span className="text-sm font-bold">?</span>
      </button>
    </div>
  );
}
