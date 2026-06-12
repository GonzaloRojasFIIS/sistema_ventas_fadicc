import { Producto, MovimientoStock } from '@/types';
import { supabase } from '@/repositories/supabaseClient';
import { getLocalData, setLocalData, INITIAL_PRODUCTS } from '@/repositories/localStorageClient';

// --- PRODUCTOS ---

export async function getProducts(categoria?: string): Promise<Producto[]> {
  if (supabase) {
    let query = supabase.from('productos').select('*').order('sku');
    if (categoria) query = query.eq('categoria', categoria);
    const { data, error } = await query;
    if (!error && data) return data;
  }
  const prods = getLocalData('fadicc_productos', INITIAL_PRODUCTS);
  return categoria ? prods.filter(p => p.categoria === categoria) : prods;
}

export async function createProducto(producto: Omit<Producto, 'id' | 'updated_at'>): Promise<Producto> {
  if (supabase) {
    const { data, error } = await supabase.from('productos').insert([producto]).select().single();
    if (!error && data) return data;
  }
  const prods = getLocalData('fadicc_productos', INITIAL_PRODUCTS);
  const newProd: Producto = { ...producto, id: 'p_' + Math.random().toString(36).substr(2, 9) };
  prods.push(newProd);
  setLocalData('fadicc_productos', prods);
  return newProd;
}

export async function updateProducto(id: string, cambios: Partial<Omit<Producto, 'id'>>): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('productos').update(cambios).eq('id', id);
    return !error;
  }
  const prods = getLocalData('fadicc_productos', INITIAL_PRODUCTS);
  const updated = prods.map(p => p.id === id ? { ...p, ...cambios } : p);
  setLocalData('fadicc_productos', updated);
  return true;
}

export async function updateProductStock(id: string, newStock: number): Promise<boolean> {
  return updateProducto(id, { stock_actual: newStock });
}

// --- MOVIMIENTOS DE STOCK ---

export async function addMovimientoStock(mov: Omit<MovimientoStock, 'id' | 'fecha'>, skipStockUpdate = false): Promise<MovimientoStock> {
  const newMov: MovimientoStock = {
    ...mov,
    id: 'mov_' + Math.random().toString(36).substr(2, 9),
    fecha: new Date().toISOString(),
  };

  if (supabase) {
    console.log('[db] Insertando movimiento en Supabase:', mov);
    const { data, error } = await supabase.from('movimientos_stock').insert([{
      producto_id: mov.producto_id,
      tipo: mov.tipo,
      motivo: mov.motivo,
      cantidad_anterior: mov.cantidad_anterior,
      cantidad_nueva: mov.cantidad_nueva,
      usuario_id: mov.usuario_id,
      observacion: mov.observacion,
    }]).select().single();
    if (error) {
      console.error('[db] Supabase insert error:', error);
      throw new Error(`Supabase insert movimiento_stock: ${error.message}`);
    }
    if (data) {
      console.log('[db] Movimiento insertado OK en Supabase, id:', data.id);
      if (!skipStockUpdate) await updateProductStock(mov.producto_id, mov.cantidad_nueva);
      const movs = getLocalData<MovimientoStock[]>('fadicc_movimientos_stock', []);
      movs.unshift(data as MovimientoStock);
      setLocalData('fadicc_movimientos_stock', movs);
      return data;
    }
    console.warn('[db] Supabase insert devolvió data vacío, usando localStorage');
  }

  const movs = getLocalData<MovimientoStock[]>('fadicc_movimientos_stock', []);
  movs.unshift(newMov);
  setLocalData('fadicc_movimientos_stock', movs);

  if (!skipStockUpdate) await updateProductStock(mov.producto_id, mov.cantidad_nueva);
  return newMov;
}

export async function getMovimientosStock(productoId?: string): Promise<MovimientoStock[]> {
  if (supabase) {
    let q = supabase.from('movimientos_stock').select(`
      *, 
      productos(nombre, sku),
      usuarios(nombre)
    `).order('fecha', { ascending: false }).limit(100);
    if (productoId) q = q.eq('producto_id', productoId);
    const { data, error } = await q;
    if (error) {
      console.error('[db] Supabase get movimientos_stock error:', error);
      throw new Error(`Supabase get movimientos_stock: ${error.message}`);
    }
    const supabaseMovs = (data || []).map((m: any) => ({
      ...m,
      producto_nombre: m.productos?.nombre,
      usuario_nombre: m.usuarios?.nombre,
    }));
    console.log('[db] Supabase devolvió', supabaseMovs.length, 'movimientos');
    if (supabaseMovs.length > 0) return supabaseMovs;

    console.warn('[db] Supabase devolvió 0 movimientos; leyendo fallback localStorage');
  }
  const movs = getLocalData<MovimientoStock[]>('fadicc_movimientos_stock', []);
  const resultado = productoId ? movs.filter(m => m.producto_id === productoId) : movs;
  console.log('[db] localStorage devolvió', resultado.length, 'movimientos');
  return resultado;
}
