'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { dbService, Proveedor } from '@/lib/db';
import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import GradientModal from '@/components/ui/GradientModal';

export default function ProveedoresPage() {
  const { usuario } = useSession();
  const router = useRouter();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoRuc, setNuevoRuc] = useState('');
  const [nuevoRazon, setNuevoRazon] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoRubro, setNuevoRubro] = useState('');
  const [errorCrear, setErrorCrear] = useState('');

  useEffect(() => {
    if (!usuario) return;
    const permitidos = ['ADMIN', 'ALMACEN'];
    if (!permitidos.includes(usuario.rol)) {
      router.push('/dashboard');
      return;
    }
    async function load() {
      setIsLoading(true);
      try {
        const data = await dbService.getProveedores();
        setProveedores(data);
      } catch (err) {
        console.error('Error cargando proveedores:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [usuario, router]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return proveedores;
    return proveedores.filter(
      (p) =>
        p.ruc.includes(q) ||
        p.razon_social.toLowerCase().includes(q) ||
        p.contacto.toLowerCase().includes(q) ||
        p.rubro.toLowerCase().includes(q)
    );
  }, [proveedores, busqueda]);

  function abrirModal() {
    setNuevoRuc('');
    setNuevoRazon('');
    setNuevoContacto('');
    setNuevoTelefono('');
    setNuevoRubro('');
    setErrorCrear('');
    setModalOpen(true);
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoRuc.trim() || !nuevoRazon.trim() || !nuevoContacto.trim() || !nuevoTelefono.trim() || !nuevoRubro.trim()) {
      setErrorCrear('Todos los campos son obligatorios.');
      return;
    }
    try {
      await dbService.createProveedor({
        ruc: nuevoRuc.trim(),
        razon_social: nuevoRazon.trim(),
        contacto: nuevoContacto.trim(),
        telefono: nuevoTelefono.trim(),
        rubro: nuevoRubro.trim(),
      });
      const data = await dbService.getProveedores();
      setProveedores(data);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorCrear('Error al crear el proveedor.');
    }
  }

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de proveedores y contactos comerciales</p>
        </div>
        <div className="flex items-center gap-3">
          <GlassInput
            placeholder="Buscar RUC, razón social, rubro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-72"
            iconLeft={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <GradientButton variant="primary" size="md" onClick={abrirModal}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Proveedor
          </GradientButton>
        </div>
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
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">RUC</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Razón Social</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Contacto</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Rubro</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-slate-600">{p.ruc}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.razon_social}</td>
                    <td className="px-4 py-3 text-slate-600">{p.contacto}</td>
                    <td className="px-4 py-3 text-slate-600">{p.telefono}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.rubro}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No se encontraron proveedores.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </GradientCard>

      {/* Modal Nuevo Proveedor */}
      <GradientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo Proveedor"
        size="md"
        footer={
          <>
            <GradientButton variant="ghost" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="md" onClick={handleCrear}>
              Crear proveedor
            </GradientButton>
          </>
        }
      >
        <form onSubmit={handleCrear} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">RUC</label>
              <GlassInput value={nuevoRuc} onChange={(e) => setNuevoRuc(e.target.value)} placeholder="Ej: 20123456789" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Razón Social</label>
              <GlassInput value={nuevoRazon} onChange={(e) => setNuevoRazon(e.target.value)} placeholder="Nombre de la empresa" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contacto</label>
              <GlassInput value={nuevoContacto} onChange={(e) => setNuevoContacto(e.target.value)} placeholder="Nombre del contacto" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
              <GlassInput value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} placeholder="Ej: 01-222-1111" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rubro</label>
              <GlassInput value={nuevoRubro} onChange={(e) => setNuevoRubro(e.target.value)} placeholder="Ej: Materia Prima, Equipos..." />
            </div>
          </div>
          {errorCrear && <p className="text-sm text-red-600 font-medium">{errorCrear}</p>}
        </form>
      </GradientModal>
    </div>
  );
}
