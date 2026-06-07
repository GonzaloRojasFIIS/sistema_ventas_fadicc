'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { Usuario } from '@/lib/db';
import {
  DashboardIcon,
  ComercialIcon,
  IndustrialIcon,
  ProduccionIcon,
  InventarioIcon,
  ClientesIcon,
  AdminIcon,
  LogoutIcon,
} from '@/components/Icons';

const navItems = [
  { href: '/dashboard', label: 'Dashboard KPIs', icon: DashboardIcon, roles: ['ADMIN'] },
  { href: '/dashboard/comercial', label: 'Canal Comercial', icon: ComercialIcon, roles: ['ADMIN', 'VENDEDOR', 'REPRESENTANTE'] },
  { href: '/dashboard/industrial', label: 'Canal Industrial', icon: IndustrialIcon, roles: ['ADMIN', 'VENDEDOR', 'REPRESENTANTE'] },
  { href: '/dashboard/produccion', label: 'Planta y Despachos', icon: ProduccionIcon, roles: ['ADMIN', 'PRODUCCION', 'ALMACEN'] },
  { href: '/dashboard/inventario', label: 'Inventario', icon: InventarioIcon, roles: ['ADMIN', 'ALMACEN', 'VENDEDOR', 'REPRESENTANTE'] },
  { href: '/dashboard/clientes', label: 'Clientes', icon: ClientesIcon, roles: ['ADMIN', 'VENDEDOR', 'REPRESENTANTE'] },
  { href: '/dashboard/admin', label: 'Administración', icon: AdminIcon, roles: ['ADMIN'] },
] as const;

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

const rolLabels: Record<Usuario['rol'], string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Ventas Comercial',
  REPRESENTANTE: 'Ventas Industrial',
  ALMACEN: 'Almacén y Despacho',
  PRODUCCION: 'Jefe de Planta',
};

const rolBadgeStyles: Record<Usuario['rol'], string> = {
  ADMIN: 'bg-orange-50 text-orange-700 border-orange-200',
  VENDEDOR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REPRESENTANTE: 'bg-blue-50 text-blue-700 border-blue-200',
  ALMACEN: 'bg-violet-50 text-violet-700 border-violet-200',
  PRODUCCION: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Sidebar() {
  const { usuario, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  if (!usuario) return null;

  const visibleItems = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(usuario.rol)
  );

  function handleLogout() {
    logout();
    router.push('/');
  }

  const sidebarWidth = expanded ? 'w-64' : 'w-[72px]';

  return (
    <aside
      className={`
        relative flex flex-col h-screen
        bg-white/80 backdrop-blur-xl
        border-r border-slate-200/60
        shadow-lg shadow-slate-200/30
        transition-all duration-300 ease-in-out flex-shrink-0 z-40
        ${sidebarWidth}
      `}
    >
      {/* Toggle button */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        aria-label={expanded ? 'Colapsar sidebar' : 'Expandir sidebar'}
        className="
          absolute -right-3 top-6 z-55
          w-6 h-6 rounded-full
          bg-white border border-slate-200
          flex items-center justify-center
          text-slate-400 hover:text-orange-500
          transition-colors duration-200
          shadow-sm cursor-pointer
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3 h-3 transition-transform duration-300 ${expanded ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Header: Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-100/80 overflow-hidden">
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden bg-white border border-slate-100 shadow-sm">
          <img
            src="/logo-transparente.png"
            alt="FADICC"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        {expanded && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-slate-900 font-extrabold text-sm tracking-tight">
              FADICC S.A.
            </span>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
              Sistema de Ventas
            </span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 px-2">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              title={!expanded ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                transition-all duration-200 group cursor-pointer
                ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50/50 border-l-4 border-orange-500 text-orange-700 font-bold pl-[calc(0.75rem-4px)]'
                    : 'border-l-4 border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }
              `}
            >
              <span className="flex-shrink-0">
                <item.icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              </span>
              {expanded && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: Usuario + logout */}
      <div className="border-t border-slate-100/80 p-3 space-y-3 bg-white/50">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Avatar */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center shadow-sm shadow-orange-500/20">
            <span className="text-white font-bold text-xs leading-none">
              {getInitials(usuario.nombre)}
            </span>
          </div>
          {expanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-slate-900 text-sm font-bold truncate">
                {usuario.nombre}
              </span>
              <span
                className={`
                  mt-0.5 inline-block self-start text-[9px] font-bold px-2 py-0.5
                  rounded-full border uppercase
                  ${rolBadgeStyles[usuario.rol]}
                `}
              >
                {rolLabels[usuario.rol]}
              </span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`
            w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
            text-slate-500 hover:bg-red-50 hover:text-red-600
            transition-colors duration-200 text-xs font-bold cursor-pointer
            border border-transparent hover:border-red-100
          `}
        >
          <LogoutIcon className="flex-shrink-0 w-4 h-4" />
          {expanded && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
