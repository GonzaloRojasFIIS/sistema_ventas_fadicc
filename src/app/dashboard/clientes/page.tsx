'use client';

import React, { useMemo, useState, useEffect } from 'react';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import GradientModal from '@/components/ui/GradientModal';
import GradientDrawer from '@/components/ui/GradientDrawer';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { dbService, VentaComercial, Proforma as ProformaReal } from '@/lib/db';
import { enviarCatalogoEmailApi } from '@/lib/emailClient';

/* ── Tipos ── */
interface Cliente {
  id: string;
  tipoDoc: 'DNI' | 'RUC';
  numeroDoc: string;
  nombre: string;
  razonSocial?: string;
  telefono: string;
  email: string;
  direccion: string;
}

interface Venta {
  id: string;
  clienteId: string;
  fecha: string;
  total: number;
  estado: string;
}

interface Proforma {
  id: string;
  clienteId: string;
  fecha: string;
  total: number;
  estado: string;
}

/* ── Datos de muestra ── */
const CLIENTES_INICIALES: Cliente[] = [
  { id: 'c1', tipoDoc: 'DNI', numeroDoc: '45678231', nombre: 'Juan Pérez García', telefono: '987654321', email: 'juan.perez@mail.com', direccion: 'Av. Principal 123, Lima' },
  { id: 'c2', tipoDoc: 'RUC', numeroDoc: '20123456789', nombre: 'Constructora del Norte S.A.C.', razonSocial: 'Constructora del Norte S.A.C.', telefono: '987123456', email: 'contacto@cdn.com', direccion: 'Calle Industrial 456, Callao' },
  { id: 'c3', tipoDoc: 'DNI', numeroDoc: '78451236', nombre: 'María López Torres', telefono: '912345678', email: 'maria.lopez@mail.com', direccion: 'Jr. Comercio 789, Arequipa' },
  { id: 'c4', tipoDoc: 'RUC', numeroDoc: '20567890123', nombre: 'Inversiones Metálicas E.I.R.L.', razonSocial: 'Inversiones Metálicas E.I.R.L.', telefono: '934567890', email: 'ventas@imetalicas.com', direccion: 'Av. del Ejército 890, Trujillo' },
  { id: 'c5', tipoDoc: 'DNI', numeroDoc: '10236547', nombre: 'Carlos Ruiz Díaz', telefono: '956789012', email: 'carlos.ruiz@mail.com', direccion: 'Calle 5 de Mayo 321, Cusco' },
  { id: 'c6', tipoDoc: 'RUC', numeroDoc: '20987654321', nombre: 'Soluciones Constructivas S.A.', razonSocial: 'Soluciones Constructivas S.A.', telefono: '978901234', email: 'admin@soluciones.com', direccion: 'Av. Prolongación 654, Chiclayo' },
  { id: 'c7', tipoDoc: 'DNI', numeroDoc: '36985214', nombre: 'Ana Martínez Vega', telefono: '901234567', email: 'ana.martinez@mail.com', direccion: 'Jr. Libertad 147, Piura' },
  { id: 'c8', tipoDoc: 'DNI', numeroDoc: '74125896', nombre: 'Pedro Sánchez Flores', telefono: '923456789', email: 'pedro.sanchez@mail.com', direccion: 'Calle Los Pinos 258, Iquitos' },
];

const VENTAS: Venta[] = [
  { id: 'v1', clienteId: 'c1', fecha: '2026-05-15', total: 1250.0, estado: 'Completada' },
  { id: 'v2', clienteId: 'c1', fecha: '2026-04-20', total: 3400.0, estado: 'Completada' },
  { id: 'v3', clienteId: 'c2', fecha: '2026-05-28', total: 8900.0, estado: 'Pendiente' },
  { id: 'v4', clienteId: 'c3', fecha: '2026-06-01', total: 450.0, estado: 'Completada' },
  { id: 'v5', clienteId: 'c4', fecha: '2026-05-10', total: 5600.0, estado: 'Completada' },
  { id: 'v6', clienteId: 'c4', fecha: '2026-03-22', total: 1200.0, estado: 'Completada' },
  { id: 'v7', clienteId: 'c5', fecha: '2026-05-30', total: 2300.0, estado: 'Pendiente' },
  { id: 'v8', clienteId: 'c6', fecha: '2026-04-18', total: 7800.0, estado: 'Completada' },
];

const PROFORMAS: Proforma[] = [
  { id: 'p1', clienteId: 'c1', fecha: '2026-05-10', total: 1500.0, estado: 'Aceptada' },
  { id: 'p2', clienteId: 'c2', fecha: '2026-05-25', total: 9500.0, estado: 'Pendiente' },
  { id: 'p3', clienteId: 'c4', fecha: '2026-04-05', total: 6000.0, estado: 'Rechazada' },
  { id: 'p4', clienteId: 'c6', fecha: '2026-05-18', total: 8200.0, estado: 'Aceptada' },
  { id: 'p5', clienteId: 'c1', fecha: '2026-03-15', total: 2200.0, estado: 'Expirada' },
];

const PAGE_SIZE = 5;

/* ── Helpers ── */
function mapDbClientToUi(c: any): Cliente {
  return {
    id: c.id,
    tipoDoc: c.tipo_documento,
    numeroDoc: c.numero_documento,
    nombre: c.razon_social_o_nombre,
    razonSocial: c.tipo_documento === 'RUC' ? c.razon_social_o_nombre : undefined,
    telefono: c.telefono || '',
    email: c.email || '',
    direccion: c.direccion || '',
  };
}

/* ── Página ── */
export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clienteDrawer, setClienteDrawer] = useState<Cliente | null>(null);
  const [editando, setEditando] = useState<Partial<Cliente>>({});

  // Ficha de contacto
  const [historialVentas, setHistorialVentas] = useState<VentaComercial[]>([]);
  const [historialProformas, setHistorialProformas] = useState<ProformaReal[]>([]);
  const [ultimoVendedor, setUltimoVendedor] = useState<string>('');
  const [preferencias, setPreferencias] = useState<{
    productoFavorito: string;
    categoriaFavorita: string;
    ticketPromedio: number;
    frecuenciaMensual: number;
    totalHistorico: number;
  } | null>(null);
  const [loadingFicha, setLoadingFicha] = useState(false);
  const [enviandoCatalogo, setEnviandoCatalogo] = useState(false);
  const [catalogoStatus, setCatalogoStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'persona' | 'empresa' | 'contacto'>('persona');
  const [nuevoDoc, setNuevoDoc] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRazon, setNuevoRazon] = useState('');
  const [nuevoTel, setNuevoTel] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoDir, setNuevoDir] = useState('');
  // Contacto de empresa
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoCargo, setContactoCargo] = useState('');
  const [contactoTel, setContactoTel] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
  // Contacto de empresa - selección
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState('');
  const [errorModal, setErrorModal] = useState('');

  // Modal de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Cargar clientes reales desde dbService
  useEffect(() => {
    async function loadClients() {
      setIsLoading(true);
      try {
        const dbClients = await dbService.getClients();
        const mapped = dbClients.map(mapDbClientToUi);
        setClientes(mapped);
      } catch (err) {
        console.error('Error cargando clientes:', err);
        setClientes(CLIENTES_INICIALES);
      } finally {
        setIsLoading(false);
      }
    }
    loadClients();
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.numeroDoc.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.includes(q))
    );
  }, [clientes, busqueda]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginados = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function abrirDrawer(cliente: Cliente) {
    setClienteDrawer(cliente);
    setEditando({});
    setDrawerOpen(true);
    setLoadingFicha(true);
    try {
      const historial = await dbService.getClienteHistorial(cliente.id);
      const prefs = await dbService.getClientePreferencias(cliente.id);
      setHistorialVentas(historial.ventas);
      setHistorialProformas(historial.proformas);
      setUltimoVendedor(historial.ultimoVendedor || '—');
      setPreferencias(prefs);
    } catch {
      // fallback silencioso
    } finally {
      setLoadingFicha(false);
    }
  }

  function toggleEditarCampo<K extends keyof Cliente>(campo: K, valor: Cliente[K]) {
    setEditando((prev) => ({ ...prev, [campo]: valor }));
  }

  function guardarEdicion() {
    if (!clienteDrawer) return;
    const actualizado = { ...clienteDrawer, ...editando };
    setClientes((prev) => prev.map((c) => (c.id === actualizado.id ? actualizado : c)));
    setClienteDrawer(actualizado);
    setEditando({});
  }

  function abrirEditar(cliente: Cliente) {
    setClienteEditando(cliente);
    setEditNombre(cliente.nombre);
    setEditTelefono(cliente.telefono || '');
    setEditEmail(cliente.email || '');
    setEditDireccion(cliente.direccion || '');
    setEditError('');
    setEditModalOpen(true);
  }

  async function guardarEdicionModal(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteEditando) return;
    setEditError('');
    setEditLoading(true);
    try {
      const updated = await dbService.updateCliente(clienteEditando.id, {
        razon_social_o_nombre: editNombre.trim(),
        telefono: editTelefono.trim() || undefined,
        email: editEmail.trim() || undefined,
        direccion: editDireccion.trim() || undefined,
      });
      if (updated) {
        const mapped = mapDbClientToUi(updated);
        setClientes((prev) => prev.map((c) => (c.id === mapped.id ? mapped : c)));
        setEditModalOpen(false);
        setClienteEditando(null);
      } else {
        setEditError('No se pudo guardar los cambios.');
      }
    } catch (err: any) {
      setEditError(err?.message || 'Error al guardar');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleCrearCliente(e: React.FormEvent) {
    e.preventDefault();
    setErrorModal('');
    try {
      if (modalTab === 'persona') {
        const numeroDoc = nuevoDoc.trim();
        const nombre = nuevoNombre.trim();
        if (numeroDoc.length !== 8) { setErrorModal('El DNI debe tener 8 dígitos.'); return; }
        if (!nombre) { setErrorModal('El nombre completo es obligatorio.'); return; }
        const created = await dbService.createCliente({
          tipo_documento: 'DNI',
          numero_documento: numeroDoc,
          razon_social_o_nombre: nombre,
          telefono: nuevoTel.trim() || undefined,
          email: nuevoEmail.trim() || undefined,
          direccion: nuevoDir.trim() || undefined,
          tipo_cliente: 'PERSONA',
        });
        setClientes((prev) => [mapDbClientToUi(created), ...prev]);
      } else if (modalTab === 'empresa') {
        const ruc = nuevoDoc.trim();
        const razon = nuevoRazon.trim();
        if (ruc.length !== 11) { setErrorModal('El RUC debe tener 11 dígitos.'); return; }
        if (!razon) { setErrorModal('La razón social es obligatoria.'); return; }
        const created = await dbService.createCliente({
          tipo_documento: 'RUC',
          numero_documento: ruc,
          razon_social_o_nombre: razon,
          telefono: nuevoTel.trim() || undefined,
          email: nuevoEmail.trim() || undefined,
          direccion: nuevoDir.trim() || undefined,
          tipo_cliente: 'EMPRESA',
        });
        setClientes((prev) => [mapDbClientToUi(created), ...prev]);
      } else if (modalTab === 'contacto') {
        const dni = nuevoDoc.trim();
        const nombre = nuevoNombre.trim();
        if (!empresaSeleccionadaId) { setErrorModal('Selecciona la empresa a la que pertenece el contacto.'); return; }
        if (dni.length !== 8) { setErrorModal('El DNI debe tener 8 dígitos.'); return; }
        if (!nombre) { setErrorModal('El nombre del contacto es obligatorio.'); return; }
        const empresa = await dbService.getEmpresaByClienteId(empresaSeleccionadaId);
        if (!empresa) { setErrorModal('No se encontró la empresa asociada.'); return; }
        const contacto = await dbService.createContacto({
          empresa_id: empresa.id,
          nombre,
          cargo: contactoCargo.trim() || undefined,
          telefono: nuevoTel.trim() || undefined,
          email: nuevoEmail.trim() || undefined,
        });
        if (contacto) {
          setClientes((prev) => prev); // Refresh UI if needed
        }
      }
      setModalOpen(false);
      setNuevoDoc('');
      setNuevoNombre('');
      setNuevoRazon('');
      setNuevoTel('');
      setNuevoEmail('');
      setNuevoDir('');
      setContactoNombre('');
      setContactoCargo('');
      setContactoTel('');
      setContactoEmail('');
      setEmpresaSeleccionadaId('');
      setErrorModal('');
      setPage(1);
    } catch (err: any) {
      console.error('Error creando cliente:', err);
      setErrorModal(err?.message || 'Error al registrar el cliente. Verifica los datos.');
    }
  }

  const ventasCliente = useMemo(() => {
    if (!clienteDrawer) return [];
    return VENTAS.filter((v) => v.clienteId === clienteDrawer.id).sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [clienteDrawer]);

  const proformasCliente = useMemo(() => {
    if (!clienteDrawer) return [];
    return PROFORMAS.filter((p) => p.clienteId === clienteDrawer.id).sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [clienteDrawer]);

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de clientes comerciales e industriales</p>
        </div>
        <div className="flex items-center gap-3">
          <GlassInput
            placeholder="Buscar por nombre o documento..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-72"
            iconLeft={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <GradientButton variant="primary" size="md" onClick={() => setModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo
          </GradientButton>
        </div>
      </div>

      {/* Tabla Clientes — Todos juntos */}
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
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Nombre / Razón Social</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Documento</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Empresa</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{c.nombre}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{c.tipoDoc}</span>
                      <div className="font-mono text-slate-600">{c.numeroDoc}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.tipoDoc === 'DNI'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.tipoDoc === 'DNI' ? 'Persona' : 'Empresa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.telefono || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="text-slate-400 text-[10px]">—</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <GradientButton variant="ghost" size="sm" onClick={() => abrirDrawer(c)} title="Ver ficha">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </GradientButton>
                        <GradientButton variant="ghost" size="sm" onClick={() => abrirEditar(c)} title="Editar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </GradientButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No se encontraron clientes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
          <span className="text-xs text-slate-500">Página {page} de {totalPages} — {filtrados.length} resultados</span>
          <div className="flex items-center gap-2">
            <GradientButton variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</GradientButton>
            <GradientButton variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</GradientButton>
          </div>
        </div>
      </GradientCard>

      {/* Drawer Ficha Cliente */}
      <GradientDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={clienteDrawer?.nombre}
        size="lg"
        footer={
          <>
            <GradientButton variant="ghost" size="md" onClick={() => setDrawerOpen(false)}>
              Cerrar
            </GradientButton>
            {Object.keys(editando).length > 0 && (
              <GradientButton variant="primary" size="md" onClick={guardarEdicion}>
                Guardar cambios
              </GradientButton>
            )}
          </>
        }
      >
        {clienteDrawer && (
          <div className="space-y-6">
            {/* Loading */}
            {loadingFicha && (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                <svg className="animate-spin mr-2 h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Cargando ficha...
              </div>
            )}

            {!loadingFicha && (
              <>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{clienteDrawer.nombre}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge variant={clienteDrawer.tipoDoc === 'RUC' ? 'info' : 'neutral'} dot={false}>{clienteDrawer.tipoDoc}</StatusBadge>
                      <span className="text-sm font-mono text-slate-600">{clienteDrawer.numeroDoc}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {ultimoVendedor && ultimoVendedor !== '—' && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Último vendedor</div>
                        <div className="text-xs font-medium text-orange-600 mt-0.5">{ultimoVendedor}</div>
                      </div>
                    )}
                    {catalogoStatus && (
                      <div className={`text-xs font-medium ${catalogoStatus.ok ? 'text-emerald-600' : 'text-red-600'}`}>{catalogoStatus.msg}</div>
                    )}
                    <GradientButton
                      variant="primary"
                      size="sm"
                      loading={enviandoCatalogo}
                      onClick={async () => {
                        setEnviandoCatalogo(true);
                        setCatalogoStatus(null);
                        try {
                          const result = await enviarCatalogoEmailApi({
                            to: clienteDrawer.email || 'gonzalo.rojas.c@uni.pe',
                            clienteNombre: clienteDrawer.nombre,
                            productos: [
                              { nombre: 'Cocina Industrial 4 Hornillas', sku: 'COC-IND-04', precio: 1200 },
                              { nombre: 'Cocina Industrial 6 Hornillas', sku: 'COC-IND-06', precio: 1890 },
                              { nombre: 'Horno Convector Industrial', sku: 'HOR-CON-01', precio: 3400 },
                            ],
                          });
                          setCatalogoStatus({ ok: result.success, msg: result.success ? 'Catálogo enviado.' : `Error: ${result.error}` });
                        } catch {
                          setCatalogoStatus({ ok: false, msg: 'Error al enviar catálogo.' });
                        } finally {
                          setEnviandoCatalogo(false);
                          setTimeout(() => setCatalogoStatus(null), 4000);
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Enviar catálogo
                    </GradientButton>
                  </div>
                </div>

                {/* Empresa (si es RUC) */}
                {clienteDrawer.tipoDoc === 'RUC' && (
                  <GradientCard className="p-4 space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Empresa</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-slate-500">Razón social</span>
                        <p className="font-semibold text-slate-800">{clienteDrawer.nombre}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">RUC</span>
                        <p className="font-mono text-slate-800">{clienteDrawer.numeroDoc}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Teléfono</span>
                        <p className="text-slate-700">{clienteDrawer.telefono || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Email</span>
                        <p className="text-slate-700">{clienteDrawer.email || '—'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs text-slate-500">Dirección</span>
                        <p className="text-slate-700">{clienteDrawer.direccion || '—'}</p>
                      </div>
                    </div>
                  </GradientCard>
                )}

                {/* Contacto */}
                <GradientCard className="p-4 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Datos de contacto</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-500">Nombre</span>
                      <p className="font-semibold text-slate-800">{clienteDrawer.nombre}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Teléfono</span>
                      <p className="text-slate-700">{clienteDrawer.telefono || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Email</span>
                      <p className="text-slate-700">{clienteDrawer.email || '—'}</p>
                    </div>
                  </div>
                </GradientCard>

                {/* Preferencias calculadas */}
                {preferencias && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Preferencias calculadas</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <GradientCard className="p-3">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total histórico</div>
                        <div className="text-lg font-extrabold font-mono text-slate-800 mt-1">S/ {preferencias.totalHistorico.toFixed(2)}</div>
                      </GradientCard>
                      <GradientCard className="p-3">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ticket promedio</div>
                        <div className="text-lg font-extrabold font-mono text-slate-800 mt-1">S/ {preferencias.ticketPromedio.toFixed(2)}</div>
                      </GradientCard>
                      <GradientCard className="p-3">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Frec. mensual</div>
                        <div className="text-lg font-extrabold font-mono text-slate-800 mt-1">{preferencias.frecuenciaMensual.toFixed(1)} <span className="text-xs font-normal text-slate-500">ventas/mes</span></div>
                      </GradientCard>
                      <GradientCard className="p-3">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Producto favorito</div>
                        <div className="text-sm font-semibold text-slate-800 mt-1 truncate" title={preferencias.productoFavorito}>{preferencias.productoFavorito}</div>
                      </GradientCard>
                    </div>
                  </div>
                )}

                {/* Historial de compras */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Historial de compras</h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/60 border-b border-slate-100">
                          <th className="text-left px-3 py-2 font-semibold text-slate-700">Fecha</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-700">Total</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-700">Comprobante</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-700">Atendió</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialVentas.map((v) => (
                          <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                            <td className="px-3 py-2 text-slate-600">{new Date(v.fecha_venta).toLocaleDateString('es-PE')}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">S/ {v.total.toFixed(2)}</td>
                            <td className="px-3 py-2 text-slate-600">{v.numero_comprobante || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{v.vendedor_id || '—'}</td>
                          </tr>
                        ))}
                        {historialVentas.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-slate-400">Sin compras registradas.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Proformas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Proformas asociadas</h4>
                  <div className="space-y-2">
                    {historialProformas.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500">{p.codigo_proforma}</span>
                          <span className="text-sm text-slate-700">{new Date(p.fecha_emision).toLocaleDateString('es-PE')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-800">S/ {p.total.toFixed(2)}</span>
                          <StatusBadge variant={p.estado === 'APROBADA' ? 'success' : p.estado === 'RECHAZADA' ? 'danger' : p.estado === 'EXPIRADA' ? 'neutral' : 'warning'} dot={false}>{p.estado}</StatusBadge>
                        </div>
                      </div>
                    ))}
                    {historialProformas.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">Sin proformas asociadas.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </GradientDrawer>

      {/* Modal Alta Cliente */}
      <GradientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo cliente"
        size="md"
        footer={
          <>
            <GradientButton variant="ghost" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="md" onClick={handleCrearCliente}>
              Crear cliente
            </GradientButton>
          </>
        }
      >
        <form onSubmit={handleCrearCliente} className="space-y-4">
          {/* Tabs */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            {(['persona', 'empresa', 'contacto'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setModalTab(t)}
                className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${
                  modalTab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'persona' ? 'Persona Natural' : t === 'empresa' ? 'Empresa' : 'Contacto'}
              </button>
            ))}
          </div>

          {/* Campo Documento según tab */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {modalTab === 'empresa' ? 'RUC' : 'DNI'}
            </label>
            <GlassInput
              value={nuevoDoc}
              onChange={(e) => setNuevoDoc(e.target.value.replace(/\D/g, ''))}
              placeholder={modalTab === 'empresa' ? 'Ej: 20123456789 (11 dígitos)' : 'Ej: 45678231 (8 dígitos)'}
              maxLength={modalTab === 'empresa' ? 11 : 8}
              className="font-mono"
            />
          </div>

          {/* Nombre / Razón Social */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {modalTab === 'empresa' ? 'Razón social' : 'Nombre completo'}
            </label>
            <GlassInput
              value={modalTab === 'empresa' ? nuevoRazon : nuevoNombre}
              onChange={(e) =>
                modalTab === 'empresa' ? setNuevoRazon(e.target.value) : setNuevoNombre(e.target.value)
              }
              placeholder={modalTab === 'empresa' ? 'Ej: Constructora del Norte S.A.C.' : 'Ej: Juan Pérez García'}
            />
          </div>

          {/* Contacto de empresa: seleccionar empresa */}
          {modalTab === 'contacto' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Empresa</label>
              <select
                className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-sm text-slate-800 outline-none px-3.5 py-2.5 focus:border-orange-400"
                value={empresaSeleccionadaId}
                onChange={(e) => setEmpresaSeleccionadaId(e.target.value)}
              >
                <option value="">Selecciona una empresa...</option>
                {clientes.filter(c => c.tipoDoc === 'RUC').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — RUC {c.numeroDoc}
                  </option>
                ))}
              </select>
              {clientes.filter(c => c.tipoDoc === 'RUC').length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No hay empresas registradas. Crea una empresa primero.</p>
              )}
            </div>
          )}

          {/* Teléfono + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
              <GlassInput value={nuevoTel} onChange={(e) => setNuevoTel(e.target.value)} placeholder="Ej: 987654321" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <GlassInput value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="Ej: correo@mail.com" />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
            <GlassInput value={nuevoDir} onChange={(e) => setNuevoDir(e.target.value)} placeholder="Ej: Av. Principal 123, Lima" />
          </div>

          {/* Contacto de empresa (solo Empresa) */}
          {modalTab === 'empresa' && (
            <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-3 space-y-3">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Contacto de la empresa</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
                  <GlassInput value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo</label>
                  <GlassInput value={contactoCargo} onChange={(e) => setContactoCargo(e.target.value)} placeholder="Ej: Gerente de Compras" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                  <GlassInput value={contactoTel} onChange={(e) => setContactoTel(e.target.value)} placeholder="Ej: 912449977" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <GlassInput value={contactoEmail} onChange={(e) => setContactoEmail(e.target.value)} placeholder="Ej: contacto@empresa.com" />
                </div>
              </div>
            </div>
          )}

          {/* Contacto de empresa: cargo */}
          {modalTab === 'contacto' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo</label>
              <GlassInput value={contactoCargo} onChange={(e) => setContactoCargo(e.target.value)} placeholder="Ej: Representante de Ventas" />
            </div>
          )}

          {errorModal && <p className="text-sm text-red-600 font-medium">{errorModal}</p>}
        </form>
      </GradientModal>

      {/* Modal Editar Cliente */}
      <GradientModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Editar cliente: ${clienteEditando?.nombre || ''}`}
        size="md"
        footer={
          <>
            <GradientButton variant="ghost" size="md" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="md" onClick={guardarEdicionModal} disabled={editLoading}>
              {editLoading ? 'Guardando...' : 'Guardar cambios'}
            </GradientButton>
          </>
        }
      >
        <form onSubmit={guardarEdicionModal} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre / Razón Social</label>
            <GlassInput value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
              <GlassInput value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} placeholder="987654321" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <GlassInput value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="correo@mail.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
            <GlassInput value={editDireccion} onChange={(e) => setEditDireccion(e.target.value)} placeholder="Av. Principal 123" />
          </div>

          {editError && <p className="text-sm text-red-600 font-medium">{editError}</p>}
        </form>
      </GradientModal>
    </div>
  );
}
