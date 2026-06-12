'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario } from '@/types';
import { login as loginUsuario } from '@/services/usuarioService';
import { getActiveCaja } from '@/services/ventaService';

interface SessionContextType {
  usuario: Usuario | null;
  cajaId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCajaId: (id: string | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cajaId, setCajaIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión persistida al iniciar
  useEffect(() => {
    const initSession = async () => {
      try {
        const storedUser = localStorage.getItem('fadicc_session_user');
        const storedCaja = localStorage.getItem('fadicc_session_caja');

        if (storedUser) {
          const parsedUser: Usuario = JSON.parse(storedUser);
          setUsuario(parsedUser);

          // Si es vendedor, intentar cargar caja activa
          if (storedCaja) {
            setCajaIdState(storedCaja);
          } else if (parsedUser.rol === 'VENDEDOR' || parsedUser.rol === 'ADMIN') {
            const caja = await getActiveCaja(parsedUser.id);
            if (caja) {
              setCajaIdState(caja.id);
              localStorage.setItem('fadicc_session_caja', caja.id);
            }
          }
        }
      } catch (err) {
        console.error('Error al restaurar sesión:', err);
        localStorage.removeItem('fadicc_session_user');
        localStorage.removeItem('fadicc_session_caja');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await loginUsuario(email, password);
      if (!user) return false;

      setUsuario(user);
      localStorage.setItem('fadicc_session_user', JSON.stringify(user));

      // Cargar caja activa si aplica
      if (user.rol === 'VENDEDOR' || user.rol === 'ADMIN') {
        const caja = await getActiveCaja(user.id);
        if (caja) {
          setCajaIdState(caja.id);
          localStorage.setItem('fadicc_session_caja', caja.id);
        }
      }

      return true;
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    setCajaIdState(null);
    localStorage.removeItem('fadicc_session_user');
    localStorage.removeItem('fadicc_session_caja');
  }, []);

  const setCajaId = useCallback((id: string | null) => {
    setCajaIdState(id);
    if (id) {
      localStorage.setItem('fadicc_session_caja', id);
    } else {
      localStorage.removeItem('fadicc_session_caja');
    }
  }, []);

  return (
    <SessionContext.Provider value={{ usuario, cajaId, loading, login, logout, setCajaId }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession debe usarse dentro de un SessionProvider');
  }
  return context;
}
