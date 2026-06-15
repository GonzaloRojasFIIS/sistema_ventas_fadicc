export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'REPRESENTANTE' | 'ALMACEN' | 'PRODUCCION';
  activo: boolean;
}

export interface Cliente {
  id: string;
  tipo_documento: 'DNI' | 'RUC';
  numero_documento: string;
  razon_social_o_nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo_cliente: 'PERSONA' | 'EMPRESA';
  created_at?: string;
}

export interface Empresa {
  id: string;
  cliente_id: string;
  ruc: string;
  razon_social: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  created_at?: string;
}

export interface Contacto {
  id: string;
  empresa_id: string;
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  es_principal?: boolean;
  created_at?: string;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  precio_base: number;
  costo?: number;
  stock_actual: number;
  stock_minimo: number;
  imagen?: string;
  updated_at?: string;
}

export interface MovimientoStock {
  id: string;
  producto_id: string;
  producto_nombre?: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'CORRECCION';
  motivo: 'COMPRA_PROVEEDOR' | 'DEVOLUCION_CLIENTE' | 'MERMA' | 'AJUSTE_CONTEO' | 'VENTA';
  cantidad_anterior: number;
  cantidad_nueva: number;
  diferencia: number;
  usuario_id: string;
  usuario_nombre?: string;
  fecha: string;
  observacion?: string;
}

export interface CajaTurno {
  id: string;
  vendedor_id: string;
  vendedor_nombre?: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_apertura: number;
  monto_cierre?: number;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface VentaDetalle {
  producto_id: string;
  nombre?: string;
  sku?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaComercial {
  id: string;
  cliente_id: string;
  cliente_nombre?: string;
  vendedor_id: string;
  vendedor_nombre?: string;
  caja_turno_id: string;
  tipo_comprobante: 'BOLETA' | 'FACTURA';
  numero_comprobante: string;
  total: number;
  fecha_venta: string;
  detalles?: VentaDetalle[];
  forma_pago?: 'CONTADO' | 'CREDITO';
  metodo_pago?: 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'YAPE_PLIN';
  monto_recibido?: number;
  vuelto?: number;
  moneda?: 'SOLES' | 'DOLARES';
  guia_remision?: string;
  orden_compra?: string;
  emisor_razon_social?: string;
  emisor_direccion?: string;
  emisor_ruc?: string;
  receptor_nombre?: string;
  receptor_direccion?: string;
  receptor_ruc?: string;
  subtotal?: number;
  anticipos?: number;
  descuentos?: number;
  valor_venta?: number;
  isc?: number;
  igv?: number;
  icbper?: number;
  otros_cargos?: number;
  otros_tributos?: number;
  monto_redondeo?: number;
  importe_total?: number;
  monto_letras?: string;
  valor_venta_gratuitas?: number;
  detraccion_leyenda?: string;
  detraccion_bien_servicio?: string;
  detraccion_medio_pago?: string;
  detraccion_cta_banco_nacion?: string;
  detraccion_porcentaje?: number;
  detraccion_monto?: number;
  credito_monto_neto?: number;
  credito_total_cuotas?: number;
  credito_cuotas?: { nro: number; fecha_vencimiento: string; monto: number }[];
}

export interface ProformaDetalle {
  producto_id: string;
  nombre?: string;
  sku?: string;
  cantidad: number;
  precio_pactado: number;
  subtotal: number;
}

export interface Proforma {
  id: string;
  cliente_id: string;
  contacto_id?: string;
  contacto_nombre?: string;
  contacto_email?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  representante_id: string;
  representante_nombre?: string;
  codigo_proforma: string;
  estado: 'PENDIENTE' | 'EN_NEGOCIACION' | 'APROBADA' | 'DESPACHADA' | 'RECHAZADA' | 'EXPIRADA';
  fecha_emision: string;
  fecha_vencimiento: string;
  total: number;
  detalles?: ProformaDetalle[];
}

export interface OrdenPedido {
  id: string;
  proforma_id: string;
  codigo_pedido: string;
  estado_produccion: 'EN_PRODUCCION' | 'LISTO_PARA_DESPACHO' | 'ENTREGADO';
  fecha_aprobacion: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  cliente_nombre?: string;
  codigo_proforma?: string;
  total?: number;
}

export interface KpiData {
  venta_comercial_hoy: number;
  venta_comercial_ayer: number;
  venta_industrial_activa: number;
  tasa_conversion_proformas: number;
  proformas_total: number;
  proformas_aprobadas: number;
  proformas_vencidas: number;
  productos_bajo_minimo: number;
  ventas_hoy_count: number;
  ordenes_activas: number;
  ticket_promedio: number;
  margen_bruto_estimado: number;
  meta_mensual: number;
  real_mensual: number;
}

export interface VentaPorDia {
  fecha: string;
  comercial: number;
  industrial: number;
}

export interface TopProducto {
  nombre: string;
  unidades: number;
  ingreso: number;
  stock_restante: number;
}

export interface Actividad {
  id: string;
  tipo: 'venta' | 'proforma' | 'stock' | 'pedido';
  descripcion: string;
  usuario: string;
  timestamp: string;
}

export interface VendedorPerformance {
  nombre: string;
  meta: number;
  real: number;
  porcentaje: number;
}

export interface MetasConfig {
  vendedor: number;
  representante: number;
}
