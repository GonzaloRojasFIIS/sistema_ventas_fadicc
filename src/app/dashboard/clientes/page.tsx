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
  contactoNombre?: string;
  contactoCargo?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
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
  { id: 'c2', tipoDoc: 'RUC', numeroDoc: '20123456789', nombre: 'Constructora del Norte S.A.C.', razonSocial: 'Constructora del Norte S.A.C.', telefono: '987123456', email: 'contacto@cdn.com', direccion: 'Calle Industrial 456, Callao', contactoNombre: 'Roberto Díaz', contactoCargo: 'Jefe de Compras', contactoTelefono: '987123457', contactoEmail: 'rdiaz@cdn.com' },
  { id: 'c3', tipoDoc: 'DNI', numeroDoc: '78451236', nombre: 'María López Torres', telefono: '912345678', email: 'maria.lopez@mail.com', direccion: 'Jr. Comercio 789, Arequipa' },
  { id: 'c4', tipoDoc: 'RUC', numeroDoc: '20567890123', nombre: 'Inversiones Metálicas E.I.R.L.', razonSocial: 'Inversiones Metálicas E.I.R.L.', telefono: '934567890', email: 'ventas@imetalicas.com', direccion: 'Av. del Ejército 890, Trujillo', contactoNombre: 'Sofía Ramírez', contactoCargo: 'Gerente General', contactoTelefono: '934567891', contactoEmail: 'sramirez@imetalicas.com' },
  { id: 'c5', tipoDoc: 'DNI', numeroDoc: '10236547', nombre: 'Carlos Ruiz Díaz', telefono: '956789012', email: 'carlos.ruiz@mail.com', direccion: 'Calle 5 de Mayo 321, Cusco' },
  { id: 'c6', tipoDoc: 'RUC', numeroDoc: '20987654321', nombre: 'Soluciones Constructivas S.A.', razonSocial: 'Soluciones Constructivas S.A.', telefono: '978901234', email: 'admin@soluciones.com', direccion: 'Av. Prolongación 654, Chiclayo', contactoNombre: 'Miguel Ángel Torres', contactoCargo: 'Administrador', contactoTelefono: '978901235', contactoEmail: 'mtorres@soluciones.com' },
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

/* ── Página ── */
export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_INICIALES);
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

  const [activeTab, setActiveTab] = useState<'empresas' | 'contactos'>('empresas');

  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState<'DNI' | 'RUC'>('DNI');
  const [nuevoDoc, setNuevoDoc] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRazon, setNuevoRazon] = useState('');
  const [nuevoTel, setNuevoTel] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoDir, setNuevoDir] = useState('');
  const [errorModal, setErrorModal] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return clientes
      .filter(c => activeTab === 'empresas' ? c.tipoDoc === 'RUC' : true)
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.numeroDoc.includes(q) ||
          (c.contactoNombre && c.contactoNombre.toLowerCase().includes(q))
      );
  }, [clientes, busqueda, activeTab]);

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

  function handleCrearCliente(e: React.FormEvent) {
    e.preventDefault();
    const numeroDoc = nuevoDoc.trim();
    const nombre = nuevoNombre.trim();
    const duplicado = clientes.some((c) => c.numeroDoc === numeroDoc);
    if (duplicado) {
      setErrorModal('Ya existe un cliente con ese número de documento.');
      return;
    }
    if (!numeroDoc || !nombre) {
      setErrorModal('Número de documento y nombre son obligatorios.');
      return;
    }
    const nuevo: Cliente = {
      id: `c${Date.now()}`,
      tipoDoc: nuevoTipo,
      numeroDoc,
      nombre,
      razonSocial: nuevoRazon.trim() || undefined,
      telefono: nuevoTel.trim(),
      email: nuevoEmail.trim(),
      direccion: nuevoDir.trim(),
    };
    setClientes((prev) => [nuevo, ...prev]);
    setModalOpen(false);
    setNuevoDoc('');
    setNuevoNombre('');
    setNuevoRazon('');
    setNuevoTel('');
    setNuevoEmail('');
    setNuevoDir('');
    setErrorModal('');
    setPage(1);
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

      {/* Tabs Empresas / Contactos */}
      <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 w-fit">
        <button
          onClick={() => { setActiveTab('empresas'); setPage(1); }}
          className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
            activeTab === 'empresas' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Empresas
        </button>
        <button
          onClick={() => { setActiveTab('contactos'); setPage(1); }}
          className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
            activeTab === 'contactos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Contactos
        </button>
      </div>

      {/* Tabla Empresas */}
      {activeTab === 'empresas' && (
        <GradientCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Razón Social</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">RUC</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Contacto principal</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.nombre}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.numeroDoc}</td>
                    <td className="px-4 py-3 text-slate-600">{c.telefono}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.contactoNombre ? (
                        <div>
                          <div className="font-medium text-slate-800">{c.contactoNombre}</div>
                          {c.contactoCargo && <div className="text-[10px] text-slate-500">{c.contactoCargo}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <GradientButton variant="ghost" size="sm" onClick={() => abrirDrawer(c)} title="Ver ficha">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </GradientButton>
                    </td>
                  </tr>
                ))}
                {paginados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No se encontraron empresas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
            <span className="text-xs text-slate-500">Página {page} de {totalPages} — {filtrados.length} resultados</span>
            <div className="flex items-center gap-2">
              <GradientButton variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</GradientButton>
              <GradientButton variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</GradientButton>
            </div>
          </div>
        </GradientCard>
      )}

      {/* Tabla Contactos */}
      {activeTab === 'contactos' && (
        <GradientCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Cargo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Empresa</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const contactos = clientes
                    .filter(c => c.tipoDoc === 'RUC' && c.contactoNombre)
                    .map(c => ({
                      id: c.id + '_contacto',
                      nombre: c.contactoNombre!,
                      cargo: c.contactoCargo || '',
                      telefono: c.contactoTelefono || '',
                      email: c.contactoEmail || '',
                      empresa: c.nombre,
                    }));
                  const q = busqueda.toLowerCase();
                  const filtradosContactos = contactos.filter(c =>
                    c.nombre.toLowerCase().includes(q) || c.empresa.toLowerCase().includes(q)
                  );
                  const totalPagesContactos = Math.max(1, Math.ceil(filtradosContactos.length / PAGE_SIZE));
                  const paginadosContactos = filtradosContactos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
                  return (
                    <>
                      {paginadosContactos.map((c) => (
                        <tr key={c.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-medium text-slate-900">{c.nombre}</td>
                          <td className="px-4 py-3 text-slate-600">{c.cargo || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.telefono || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.email || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{c.empresa}</td>
                        </tr>
                      ))}
                      {paginadosContactos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No se encontraron contactos.</td>
                        </tr>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </GradientCard>
      )}

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
                  {ultimoVendedor && ultimoVendedor !== '—' && (
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Último vendedor</div>
                      <div className="text-xs font-medium text-orange-600 mt-0.5">{ultimoVendedor}</div>
                    </div>
                  )}
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
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{clienteDrawer.tipoDoc === 'RUC' ? 'Contacto de la empresa' : 'Datos de contacto'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-500">Nombre</span>
                      <p className="font-semibold text-slate-800">{clienteDrawer.contactoNombre || clienteDrawer.nombre}</p>
                    </div>
                    {clienteDrawer.contactoCargo && (
                      <div>
                        <span className="text-xs text-slate-500">Cargo</span>
                        <p className="text-slate-700">{clienteDrawer.contactoCargo}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-slate-500">Teléfono</span>
                      <p className="text-slate-700">{clienteDrawer.contactoTelefono || clienteDrawer.telefono || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Email</span>
                      <p className="text-slate-700">{clienteDrawer.contactoEmail || clienteDrawer.email || '—'}</p>
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
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de documento</label>
            <div className="flex items-center gap-2">
              <GradientButton
                type="button"
                variant={nuevoTipo === 'DNI' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setNuevoTipo('DNI')}
                className="flex-1"
              >
                DNI
              </GradientButton>
              <GradientButton
                type="button"
                variant={nuevoTipo === 'RUC' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setNuevoTipo('RUC')}
                className="flex-1"
              >
                RUC
              </GradientButton>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Número de documento</label>
            <GlassInput
              value={nuevoDoc}
              onChange={(e) => setNuevoDoc(e.target.value)}
              placeholder={nuevoTipo === 'DNI' ? 'Ej: 45678231' : 'Ej: 20123456789'}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {nuevoTipo === 'RUC' ? 'Razón social' : 'Nombre completo'}
            </label>
            <GlassInput
              value={nuevoTipo === 'RUC' ? nuevoRazon : nuevoNombre}
              onChange={(e) =>
                nuevoTipo === 'RUC' ? setNuevoRazon(e.target.value) : setNuevoNombre(e.target.value)
              }
              placeholder={nuevoTipo === 'RUC' ? 'Ej: Constructora del Norte S.A.C.' : 'Ej: Juan Pérez García'}
            />
          </div>
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
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
            <GlassInput value={nuevoDir} onChange={(e) => setNuevoDir(e.target.value)} placeholder="Ej: Av. Principal 123, Lima" />
          </div>
          {errorModal && <p className="text-sm text-red-600 font-medium">{errorModal}</p>}
        </form>
      </GradientModal>
    </div>
  );
}
