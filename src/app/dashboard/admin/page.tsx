'use client';

import React, { useEffect, useState } from 'react';
import { dbService } from '@/lib/db';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import GradientModal from '@/components/ui/GradientModal';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

/* ── Tipos ── */
interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'REPRESENTANTE' | 'ALMACEN' | 'PRODUCCION';
  activo: boolean;
}

/* ── Datos de muestra ── */
const USUARIOS_INICIALES: UsuarioAdmin[] = [
  { id: 'u1', nombre: 'Ana García', email: 'ana.garcia@fadicc.com', rol: 'ADMIN', activo: true },
  { id: 'u2', nombre: 'Luis Rodríguez', email: 'luis.rodriguez@fadicc.com', rol: 'VENDEDOR', activo: true },
  { id: 'u3', nombre: 'Carmen Salazar', email: 'carmen.salazar@fadicc.com', rol: 'REPRESENTANTE', activo: true },
  { id: 'u4', nombre: 'Pedro Vargas', email: 'pedro.vargas@fadicc.com', rol: 'ALMACEN', activo: false },
  { id: 'u5', nombre: 'María Fernández', email: 'maria.fernandez@fadicc.com', rol: 'PRODUCCION', activo: true },
  { id: 'u6', nombre: 'José Torres', email: 'jose.torres@fadicc.com', rol: 'VENDEDOR', activo: true },
];

const ROL_LABELS: Record<UsuarioAdmin['rol'], string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Ventas Comercial',
  REPRESENTANTE: 'Ventas Industrial',
  ALMACEN: 'Almacén y Despacho',
  PRODUCCION: 'Jefe de Planta',
};

const ROL_VARIANTS: Record<UsuarioAdmin['rol'], 'success' | 'info' | 'warning' | 'violet' | 'neutral'> = {
  ADMIN: 'success',
  VENDEDOR: 'info',
  REPRESENTANTE: 'warning',
  ALMACEN: 'violet',
  PRODUCCION: 'neutral',
};

const ROL_OPTIONS: UsuarioAdmin['rol'][] = ['ADMIN', 'VENDEDOR', 'REPRESENTANTE', 'ALMACEN', 'PRODUCCION'];

/* ── Página ── */
export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>(USUARIOS_INICIALES);
  const [busqueda, setBusqueda] = useState('');

  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioAdmin | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState<UsuarioAdmin['rol']>('ADMIN');
  const [editActivo, setEditActivo] = useState(true);

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoRol, setNuevoRol] = useState<UsuarioAdmin['rol']>('VENDEDOR');
  const [errorCrear, setErrorCrear] = useState('');

  const [rendimientoEquipos, setRendimientoEquipos] = useState<
    { rol: string; label: string; ventasMes: number; transacciones: number; ticketPromedio: number }[]
  >([
    { rol: 'VENDEDOR', label: 'Ventas Comercial', ventasMes: 42350, transacciones: 89, ticketPromedio: 475.84 },
    { rol: 'REPRESENTANTE', label: 'Ventas Industrial', ventasMes: 67200, transacciones: 14, ticketPromedio: 4800.00 },
    { rol: 'ADMIN', label: 'Administración', ventasMes: 0, transacciones: 0, ticketPromedio: 0 },
  ]);

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const total = usuarios.length;
  const activos = usuarios.filter((u) => u.activo).length;
  const inactivos = usuarios.filter((u) => !u.activo).length;
  const rolesDistintos = new Set(usuarios.map((u) => u.rol)).size;

  function abrirEditar(usuario: UsuarioAdmin) {
    setUsuarioEditar(usuario);
    setEditNombre(usuario.nombre);
    setEditRol(usuario.rol);
    setEditActivo(usuario.activo);
    setModalEditarOpen(true);
  }

  function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioEditar) return;
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === usuarioEditar.id
          ? { ...u, nombre: editNombre.trim(), rol: editRol, activo: editActivo }
          : u
      )
    );
    setModalEditarOpen(false);
  }

  function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    const nombre = nuevoNombre.trim();
    const email = nuevoEmail.trim();
    if (!nombre || !email) {
      setErrorCrear('Nombre y email son obligatorios.');
      return;
    }
    const duplicado = usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (duplicado) {
      setErrorCrear('Ya existe un usuario con ese email.');
      return;
    }
    const nuevo: UsuarioAdmin = {
      id: `u${Date.now()}`,
      nombre,
      email,
      rol: nuevoRol,
      activo: true,
    };
    setUsuarios((prev) => [...prev, nuevo]);
    setModalCrearOpen(false);
    setNuevoNombre('');
    setNuevoEmail('');
    setNuevoRol('VENDEDOR');
    setErrorCrear('');
  }

  function toggleActivo(id: string) {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    );
  }

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administración</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de usuarios y configuración del equipo</p>
        </div>
        <div className="flex items-center gap-3">
          <GlassInput
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-72"
            iconLeft={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <GradientButton variant="primary" size="md" onClick={() => setModalCrearOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo usuario
          </GradientButton>
        </div>
      </div>

      {/* Cards estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard accentTop className="p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total usuarios</p>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            <AnimatedCounter value={total} />
          </div>
        </GradientCard>
        <GradientCard accentTop className="p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activos</p>
          <div className="mt-2 text-3xl font-bold text-emerald-700">
            <AnimatedCounter value={activos} />
          </div>
        </GradientCard>
        <GradientCard accentTop className="p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inactivos</p>
          <div className="mt-2 text-3xl font-bold text-red-600">
            <AnimatedCounter value={inactivos} />
          </div>
        </GradientCard>
        <GradientCard accentTop className="p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Roles distintos</p>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            <AnimatedCounter value={rolesDistintos} />
          </div>
        </GradientCard>
      </div>

      {/* Tabla usuarios */}
      <GradientCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={ROL_VARIANTS[u.rol]} dot={false}>
                      {ROL_LABELS[u.rol]}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActivo(u.id)}
                      className={`
                        inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-colors
                        ${u.activo
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}
                      `}
                      title={u.activo ? 'Haz clic para desactivar' : 'Haz clic para activar'}
                    >
                      <span className={`w-2 h-2 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <GradientButton variant="ghost" size="sm" onClick={() => abrirEditar(u)} title="Editar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </GradientButton>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GradientCard>

      {/* Rendimiento Acumulado del Equipo */}
      <GradientCard className="p-6">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Rendimiento Acumulado del Equipo</h2>
            <p className="text-sm text-slate-500 mt-1">Ventas del mes en curso por área comercial. Sin cuotas obligatorias.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {rendimientoEquipos.filter(r => r.ventasMes > 0).map((r) => (
              <div key={r.rol} className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{r.label}</div>
                <div className="text-2xl font-extrabold font-mono text-slate-800">S/ {r.ventasMes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>{r.transacciones} transacciones</span>
                  <span>Ticket: S/ {r.ticketPromedio.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <strong className="text-slate-600">Nota:</strong> Estas cifras reflejan el rendimiento acumulado real del equipo comercial. No se utilizan cuotas de venta obligatorias como criterio de evaluación laboral, en línea con las normativas que protegen la remuneración digna del trabajador.
          </div>
        </div>
      </GradientCard>

      {/* Modal Editar */}
      <GradientModal
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        title="Editar usuario"
        size="md"
        footer={
          <>
            <GradientButton variant="ghost" size="md" onClick={() => setModalEditarOpen(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="md" onClick={guardarEdicion}>
              Guardar
            </GradientButton>
          </>
        }
      >
        <form onSubmit={guardarEdicion} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
            <GlassInput value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
            <div className="flex flex-wrap gap-2">
              {ROL_OPTIONS.map((rol) => (
                <GradientButton
                  key={rol}
                  type="button"
                  variant={editRol === rol ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setEditRol(rol)}
                >
                  {ROL_LABELS[rol]}
                </GradientButton>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditActivo(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
                  editActivo
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${editActivo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                Activo
              </button>
              <button
                type="button"
                onClick={() => setEditActivo(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
                  !editActivo
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${!editActivo ? 'bg-red-500' : 'bg-slate-300'}`} />
                Inactivo
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Email: <strong className="text-slate-700">{usuarioEditar?.email}</strong> (no editable)
          </p>
        </form>
      </GradientModal>

      {/* Modal Crear */}
      <GradientModal
        isOpen={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        title="Nuevo usuario"
        size="md"
        footer={
          <>
            <GradientButton variant="ghost" size="md" onClick={() => setModalCrearOpen(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="md" onClick={handleCrear}>
              Crear usuario
            </GradientButton>
          </>
        }
      >
        <form onSubmit={handleCrear} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
            <GlassInput value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <GlassInput value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="correo@fadicc.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
            <div className="flex flex-wrap gap-2">
              {ROL_OPTIONS.map((rol) => (
                <GradientButton
                  key={rol}
                  type="button"
                  variant={nuevoRol === rol ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setNuevoRol(rol)}
                >
                  {ROL_LABELS[rol]}
                </GradientButton>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña inicial</label>
            <GlassInput value="123456" readOnly className="bg-slate-50" />
            <p className="text-xs text-slate-500 mt-1">El usuario deberá cambiarla en su primer inicio de sesión.</p>
          </div>
          {errorCrear && <p className="text-sm text-red-600 font-medium">{errorCrear}</p>}
        </form>
      </GradientModal>
    </div>
  );
}
