'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { dbService } from '@/lib/db';
import GlassInput from '@/components/ui/GlassInput';
import GradientButton from '@/components/ui/GradientButton';
import GradientModal from '@/components/ui/GradientModal';
import {
  ComercialIcon,
  IndustrialIcon,
  InventarioIcon,
  ProduccionIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  WarningIcon,
} from '@/components/Icons';

const FEATURES = [
  { icon: ComercialIcon, title: 'Canal Comercial', desc: 'Gestión de ventas directas y control de caja por turno' },
  { icon: IndustrialIcon, title: 'Canal Industrial', desc: 'Proformas corporativas, negociación y conversión a pedidos' },
  { icon: InventarioIcon, title: 'Control de Almacén', desc: 'Inventario en tiempo real con alertas de stock mínimo' },
  { icon: ProduccionIcon, title: 'Planta & Despachos', desc: 'Seguimiento de producción y logística de entregas' },
] as const;

const TEST_ACCOUNTS = [
  { label: 'Administrador', email: 'admin@fadicc.com', color: 'hover:border-orange-500' },
  { label: 'Ventas Comercial', email: 'vendedor@fadicc.com', color: 'hover:border-emerald-500' },
  { label: 'Ventas Industrial', email: 'representante@fadicc.com', color: 'hover:border-blue-500' },
  { label: 'Jefe de Planta', email: 'produccion@fadicc.com', color: 'hover:border-amber-500' },
] as const;

export default function LoginPage() {
  const { usuario, login, loading } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverMessage, setRecoverMessage] = useState('');

  useEffect(() => {
    if (!loading && usuario) {
      router.push('/dashboard');
    }
  }, [usuario, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Credenciales incorrectas o usuario inactivo.');
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const autofill = (acc: string) => {
    setEmail(acc);
    setPassword('123456');
    setError('');
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverLoading(true);
    setRecoverMessage('');
    try {
      await dbService.recuperarPassword(recoverEmail);
      setRecoverMessage('Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.');
      setRecoverEmail('');
    } catch {
      setRecoverMessage('Error de conexión. Intenta nuevamente.');
    } finally {
      setRecoverLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-base gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-500/20 animate-pulse" />
        <p className="text-sm text-slate-500 font-medium tracking-wide animate-pulse">Cargando sistema...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface-base text-text-primary">
      {/* ── Left decorative column (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between p-12 bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-r border-border-standard">
        {/* Logo */}
        <div>
          <img
            src="/logo-transparente.png"
            alt="FADICC S.A. Logo"
            className="h-16 w-auto object-contain select-none mb-3"
          />
          <p className="text-slate-500 font-semibold tracking-wide text-sm">
            Sistema de Ventas
          </p>

          <div className="mt-10 h-px bg-gradient-to-r from-primary/30 to-transparent" />

          {/* Feature list */}
          <div className="mt-10 space-y-6">
            {FEATURES.map((f) => {
              const IconComp = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-4">
                  <span className="shrink-0 mt-0.5 p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-primary">
                    <IconComp className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-slate-800 font-bold text-sm">{f.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom badge */}
        <p className="text-[11px] text-slate-400 font-mono">
          © 2026 FADICC S.A. — Prototipo del Canal de Ventas
        </p>
      </div>

      {/* ── Right form column ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center">
          <img
            src="/logo-transparente.png"
            alt="FADICC S.A. Logo"
            className="h-14 w-auto object-contain mb-2"
          />
          <p className="text-slate-500 text-sm">Sistema de Ventas</p>
        </div>

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white border border-border-standard rounded-2xl p-8 shadow-xl">
            <div className="mb-7">
              <h2 className="text-3xl font-serif font-extrabold text-slate-900">Bienvenido</h2>
              <p className="text-slate-500 text-sm mt-1">Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none">
                    <MailIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@fadicc.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none">
                    <LockIcon className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl pl-10 pr-12 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition duration-150"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 transition cursor-pointer"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 text-xs text-red-800 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg animate-shake">
                  <WarningIcon className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-primary hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecover(true);
                    setRecoverMessage('');
                    setRecoverEmail('');
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>

            {/* Test accounts collapsible */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <details className="group">
                <summary className="list-none flex justify-between items-center cursor-pointer select-none text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition">
                  <span>Cuentas de prueba</span>
                  <span className="text-xs transition-transform group-open:rotate-180">▼</span>
                </summary>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {TEST_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => autofill(acc.email)}
                      className={`p-2.5 bg-slate-50 border border-slate-200 ${acc.color} rounded-xl text-left transition duration-150 cursor-pointer`}
                    >
                      <p className="text-[11px] font-bold text-slate-700 truncate">{acc.label}</p>
                      <p className="text-[9px] text-slate-400 truncate font-mono mt-0.5">{acc.email}</p>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-slate-500 text-center mt-3">
                  Contraseña universal:{' '}
                  <code className="text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">123456</code>
                </p>
              </details>
            </div>

            {/* Recuperar contraseña modal */}
            <GradientModal
              isOpen={showRecover}
              onClose={() => setShowRecover(false)}
              title="Recuperar Contraseña"
              size="sm"
            >
              <form onSubmit={handleRecover} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                </p>
                <GlassInput
                  type="email"
                  placeholder="nombre@fadicc.com"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  iconLeft={<MailIcon className="w-4 h-4" />}
                  required
                />
                {recoverMessage && (
                  <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                    {recoverMessage}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <GradientButton variant="ghost" size="sm" type="button" onClick={() => setShowRecover(false)}>
                    Cancelar
                  </GradientButton>
                  <GradientButton variant="primary" size="sm" loading={recoverLoading} type="submit">
                    Enviar
                  </GradientButton>
                </div>
              </form>
            </GradientModal>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 mt-5 font-mono">
            FADICC Sistema de Ventas v1.0 · Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
