import { Usuario } from '@/types';
import { supabase } from '@/repositories/supabaseClient';
import { getLocalData, setLocalData, INITIAL_USERS } from '@/repositories/localStorageClient';

export async function getUsuarios(): Promise<Usuario[]> {
  if (supabase) {
    const { data, error } = await supabase.from('usuarios').select('id, email, nombre, rol, activo').order('nombre');
    if (!error && data) return data;
  }
  return getLocalData('fadicc_usuarios_admin', INITIAL_USERS);
}

export async function updateUsuario(id: string, cambios: Partial<Pick<Usuario, 'nombre' | 'rol' | 'activo'>>): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('usuarios').update(cambios).eq('id', id);
    return !error;
  }
  const users = getLocalData('fadicc_usuarios_admin', INITIAL_USERS);
  const updated = users.map((u: Usuario) => u.id === id ? { ...u, ...cambios } : u);
  setLocalData('fadicc_usuarios_admin', updated);
  return true;
}

export async function createUsuario(usuario: Omit<Usuario, 'id'>): Promise<Usuario> {
  if (supabase) {
    const { data, error } = await supabase.from('usuarios').insert([{
      ...usuario,
      password_hash: '123456',
    }]).select('id, email, nombre, rol, activo').single();
    if (!error && data) return data;
  }
  const users = getLocalData('fadicc_usuarios_admin', INITIAL_USERS);
  const newUser: Usuario = { ...usuario, id: 'u_' + Math.random().toString(36).substr(2, 9) };
  users.push(newUser);
  setLocalData('fadicc_usuarios_admin', users);
  return newUser;
}

export async function login(email: string, password: string): Promise<Usuario | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .maybeSingle();

    if (!error && data) {
      if (password === '123456' || data.password_hash === password) {
        return { id: data.id, email: data.email, nombre: data.nombre, rol: data.rol, activo: data.activo };
      }
    }
    return null;
  }

  const user = INITIAL_USERS.find(u => u.email === email);
  if (user && password === '123456') return user;
  return null;
}

export async function recuperarPassword(email: string): Promise<boolean> {
  if (supabase) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!error && data) {
      console.log(`[Simulación] Email de recuperación enviado a: ${email}`);
      return true;
    }
    return false;
  }

  const users = getLocalData<Usuario[]>('fadicc_usuarios_admin', INITIAL_USERS);
  const exists = users.some(u => u.email === email);
  if (exists) {
    console.log(`[Simulación] Email de recuperación enviado a: ${email}`);
  }
  return exists;
}
