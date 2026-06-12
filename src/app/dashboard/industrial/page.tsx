'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  User,
  Clock,
  AlertTriangle,
  Search,
  ChevronDown,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  Trash2,
  FileText,
  Phone,
  Mail,
  Package,
  ShoppingCart,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import GradientCard from '@/components/ui/GradientCard';
import GradientButton from '@/components/ui/GradientButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/ui/StatusBadge';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GradientModal from '@/components/ui/GradientModal';
import GradientDrawer from '@/components/ui/GradientDrawer';
import GradientToast, { Alert } from '@/components/ui/GradientToast';

import { Proforma, Producto, Cliente } from '@/types';
import { getProformas, updateProformaEstado, createProforma } from '@/services/proformaService';
import { getProducts } from '@/services/productoService';
import { getClients, createCliente, getEmpresaByClienteId, getContactosByEmpresaId } from '@/services/clienteService';
import { convertToOrder } from '@/services/ordenService';
import { generarPdfProforma } from '@/lib/pdfService';
import { enviarProformaEmailApi } from '@/lib/emailClient';
import { useSession } from '@/context/SessionContext';

// =========================================================================
// TIPOS LOCALES
// =========================================================================

const ESTADOS = [
  'PENDIENTE',
  'EN_NEGOCIACION',
  'APROBADA',
  'DESPACHADA',
  'RECHAZADA',
  'EXPIRADA',
] as const;

type EstadoProforma = (typeof ESTADOS)[number];

const ESTADO_CONFIG: Record<
  EstadoProforma,
  {
    label: string;
    badge: 'warning' | 'info' | 'success' | 'danger' | 'neutral' | 'violet';
    accent: string;
  }
> = {
  PENDIENTE: {
    label: 'Pendientes',
    badge: 'warning',
    accent: 'from-amber-500 to-yellow-400',
  },
  EN_NEGOCIACION: {
    label: 'En Negociación',
    badge: 'info',
    accent: 'from-blue-500 to-indigo-400',
  },
  APROBADA: {
    label: 'Aprobadas',
    badge: 'success',
    accent: 'from-emerald-500 to-teal-400',
  },
  DESPACHADA: {
    label: 'Despachadas',
    badge: 'violet',
    accent: 'from-violet-500 to-purple-400',
  },
  RECHAZADA: {
    label: 'Rechazadas',
    badge: 'danger',
    accent: 'from-red-500 to-rose-400',
  },
  EXPIRADA: {
    label: 'Expiradas',
    badge: 'neutral',
    accent: 'from-slate-500 to-gray-400',
  },
};

interface WizardLine {
  producto: Producto;
  cantidad: number;
  precio_pactado: number;
}

// =========================================================================
// HELPERS
// =========================================================================

function formatMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntil(dateIso: string) {
  const diff = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function estadoVariant(e: EstadoProforma) {
  return ESTADO_CONFIG[e].badge as any;
}

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

// =========================================================================
// POPOVER DE CONFIRMACIÓN INLINE
// =========================================================================

function ConfirmPopover({
  open,
  label,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute z-20 bottom-full mb-2 left-0 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-3 animate-fade-in-up">
      <p className="text-xs text-slate-700 mb-2">{label}</p>
      <div className="flex gap-2">
        <GradientButton variant="danger" size="sm" className="flex-1" onClick={onConfirm}>
          Sí
        </GradientButton>
        <GradientButton variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
          No
        </GradientButton>
      </div>
    </div>
  );
}

// =========================================================================
// TARJETA KANBAN
// =========================================================================

function KanbanCard({
  proforma,
  products,
  onSelect,
  onUpdateState,
  onConvert,
  fadingOut,
}: {
  proforma: Proforma;
  products: Producto[];
  onSelect: (p: Proforma) => void;
  onUpdateState: (id: string, estado: EstadoProforma) => void;
  onConvert: (id: string) => void;
  fadingOut?: boolean;
}) {
  const [popover, setPopover] = useState<{
    open: boolean;
    action: 'APROBADA' | 'RECHAZADA' | 'EN_NEGOCIACION' | 'DESPACHADA' | 'convert' | null;
  }>({ open: false, action: null });

  const remaining = daysUntil(proforma.fecha_vencimiento);
  const isUrgent = remaining <= 3 && remaining >= 0;
  const isExpired = remaining < 0;

  const closePopover = () => setPopover({ open: false, action: null });

  const handleConfirm = () => {
    if (!popover.action) return;
    if (popover.action === 'convert') {
      onConvert(proforma.id);
    } else {
      onUpdateState(proforma.id, popover.action);
    }
    closePopover();
  };

  const actionButtons = () => {
    const estado = proforma.estado;
    if (estado === 'RECHAZADA' || estado === 'EXPIRADA') return null;

    if (estado === 'APROBADA') {
      return (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(proforma); }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium underline decoration-blue-300 underline-offset-2"
          >
            Ver Orden {proforma.codigo_proforma}
          </button>
          <GradientButton
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setPopover({ open: true, action: 'DESPACHADA' as any });
            }}
          >
            Marcar Despachada
          </GradientButton>
          <ConfirmPopover
            open={popover.open && popover.action === 'DESPACHADA'}
            label="¿Confirmar que fue despachada?"
            onConfirm={handleConfirm}
            onCancel={closePopover}
          />
        </div>
      );
    }

    if (estado === 'DESPACHADA') {
      return (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs text-violet-600 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Despachado por Almacén
          </span>
        </div>
      );
    }

    if (estado === 'PENDIENTE') {
      return (
        <div className="relative flex gap-2 pt-3 border-t border-slate-100">
          <GradientButton
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setPopover({ open: true, action: 'EN_NEGOCIACION' });
            }}
          >
            Negociar
          </GradientButton>
          <GradientButton
            variant="success"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setPopover({ open: true, action: 'APROBADA' });
            }}
          >
            Aprobar
          </GradientButton>
          <GradientButton
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setPopover({ open: true, action: 'RECHAZADA' });
            }}
          >
            Rechazar
          </GradientButton>
          <ConfirmPopover
            open={popover.open}
            label={`¿Confirmar ${popover.action === 'EN_NEGOCIACION' ? 'negociación' : popover.action === 'APROBADA' ? 'aprobación' : 'rechazo'}?`}
            onConfirm={handleConfirm}
            onCancel={closePopover}
          />
        </div>
      );
    }

    if (estado === 'EN_NEGOCIACION') {
      return (
        <div className="relative flex gap-2 pt-3 border-t border-slate-100">
          <GradientButton
            variant="success"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setPopover({ open: true, action: 'APROBADA' });
            }}
          >
            Aprobar
          </GradientButton>
          <GradientButton
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setPopover({ open: true, action: 'RECHAZADA' });
            }}
          >
            Rechazar
          </GradientButton>
          <ConfirmPopover
            open={popover.open}
            label={`¿Confirmar ${popover.action === 'APROBADA' ? 'aprobación' : 'rechazo'}?`}
            onConfirm={handleConfirm}
            onCancel={closePopover}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`transition-all duration-300 ${fadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <GradientCard
        clickable
        onClick={() => onSelect(proforma)}
        className="p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-orange-600 text-xs font-semibold">{proforma.codigo_proforma}</span>
          <StatusBadge variant={estadoVariant(proforma.estado)}>{proforma.estado.replace('_', ' ')}</StatusBadge>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-800 truncate">{proforma.cliente_nombre}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500">{proforma.representante_nombre}</span>
        </div>

        <div className="text-xl font-bold font-mono text-slate-900 mb-2">{formatMoney(proforma.total)}</div>

        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className={`text-xs font-medium ${isUrgent || isExpired ? 'text-amber-600' : 'text-slate-500'}`}>
            {formatDate(proforma.fecha_vencimiento)}
          </span>
          {(isUrgent || isExpired) && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>

        {actionButtons()}
      </GradientCard>
    </div>
  );
}

// =========================================================================
// DRAWER DETALLE
// =========================================================================

function DetailDrawer({
  proforma,
  open,
  onClose,
  onUpdateState,
  onConvert,
}: {
  proforma: Proforma | null;
  open: boolean;
  onClose: () => void;
  onUpdateState: (id: string, estado: EstadoProforma) => void;
  onConvert: (id: string) => void;
}) {
  const [emailEnviando, setEmailEnviando] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!proforma) return null;

  const remaining = daysUntil(proforma.fecha_vencimiento);
  const isUrgent = remaining <= 3 && remaining >= 0;

  const handleAction = (estado: EstadoProforma) => {
    if (estado === 'APROBADA') {
      onConvert(proforma.id);
    } else {
      onUpdateState(proforma.id, estado);
    }
    onClose();
  };

  const handleEnviarEmail = async () => {
    setEmailEnviando(true);
    setEmailStatus(null);
    try {
      const result = await enviarProformaEmailApi({
        to: proforma.cliente_email || 'gonzalo.rojas.c@uni.pe',
        proformaCodigo: proforma.codigo_proforma,
        clienteNombre: proforma.cliente_nombre || 'Cliente',
        representanteNombre: proforma.representante_nombre || 'Representante',
      });
      setEmailStatus({ ok: result.success, msg: result.success ? 'Proforma enviada por email.' : `Error: ${result.error}` });
    } catch {
      setEmailStatus({ ok: false, msg: 'Error al enviar email.' });
    } finally {
      setEmailEnviando(false);
      setTimeout(() => setEmailStatus(null), 4000);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hola ${proforma.cliente_nombre || ''}, le enviamos la proforma ${proforma.codigo_proforma} de FADICC S.A. por S/ ${proforma.total.toFixed(2)}. ¿Podría revisarla?`);
    window.open(`https://wa.me/51912449977?text=${msg}`, '_blank');
  };

  return (
    <GradientDrawer isOpen={open} onClose={onClose} title="Detalle de Proforma" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-mono text-orange-600 font-bold">{proforma.codigo_proforma}</h2>
          <StatusBadge variant={estadoVariant(proforma.estado)}>{proforma.estado.replace('_', ' ')}</StatusBadge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Emisión: {formatDate(proforma.fecha_emision)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className={isUrgent ? 'text-amber-600 font-medium' : ''}>
              Vence: {formatDate(proforma.fecha_vencimiento)}
            </span>
            {isUrgent && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>
        </div>

        <GradientCard className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Building2 className="w-4 h-4 text-orange-500" />
            {proforma.cliente_nombre}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText className="w-4 h-4 text-slate-400" />
            RUC: 20123456789
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            {proforma.representante_nombre}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            +51 912 449 977
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            compras@empresa.pe
          </div>
        </GradientCard>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Líneas de Proforma</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Producto</th>
                  <th className="text-center px-3 py-2 font-medium">Cant</th>
                  <th className="text-right px-3 py-2 font-medium">Precio</th>
                  <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(proforma.detalles || []).map((d, i) => {
                  const base = 1000; // placeholder si no tenemos precio_base en detalle
                  const diff = base - d.precio_pactado;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{d.nombre}</div>
                        <div className="text-xs text-slate-500">{d.sku}</div>
                        {diff > 0 && (
                          <div className="text-xs text-green-600 font-medium">Ahorro: S/ {diff.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">{d.cantidad}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatMoney(d.precio_pactado)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatMoney(d.subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Timeline de Estados</h3>
          <div className="relative pl-4">
            <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-slate-200 rounded" />
            <div className="space-y-4">
              <div className="relative flex items-start gap-3">
                <div className="absolute left-[-10px] mt-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                <div className="pl-4">
                  <div className="text-xs font-semibold text-slate-700">Creada</div>
                  <div className="text-xs text-slate-500">{formatDate(proforma.fecha_emision)} · Sistema</div>
                </div>
              </div>
              <div className="relative flex items-start gap-3">
                <div className="absolute left-[-10px] mt-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                <div className="pl-4">
                  <div className="text-xs font-semibold text-slate-700">Actual: {proforma.estado.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-500">Última actualización reciente</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 pt-4 border-t border-slate-100 mt-4">
        {proforma.estado === 'PENDIENTE' && (
          <>
            <GradientButton variant="secondary" size="sm" onClick={() => handleAction('EN_NEGOCIACION')}>
              Negociar
            </GradientButton>
            <GradientButton variant="success" size="sm" onClick={() => handleAction('APROBADA')}>
              Aprobar
            </GradientButton>
            <GradientButton variant="danger" size="sm" onClick={() => handleAction('RECHAZADA')}>
              Rechazar
            </GradientButton>
          </>
        )}
        {proforma.estado === 'EN_NEGOCIACION' && (
          <>
            <GradientButton variant="success" size="sm" onClick={() => handleAction('APROBADA')}>
              Aprobar
            </GradientButton>
            <GradientButton variant="danger" size="sm" onClick={() => handleAction('RECHAZADA')}>
              Rechazar
            </GradientButton>
          </>
        )}
        {proforma.estado === 'APROBADA' && (
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Convertida a orden de pedido
          </span>
        )}
        <div className="flex-1" />
        {emailStatus && (
          <span className={`text-xs font-medium ${emailStatus.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {emailStatus.msg}
          </span>
        )}
        <GradientButton
          variant="secondary"
          size="sm"
          loading={emailEnviando}
          onClick={handleEnviarEmail}
        >
          <Mail className="w-4 h-4" />
          Enviar email
        </GradientButton>
        <GradientButton
          variant="success"
          size="sm"
          onClick={handleWhatsApp}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </GradientButton>
        <GradientButton
          variant="secondary"
          size="sm"
          onClick={async () => {
            await generarPdfProforma(proforma);
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </GradientButton>
      </div>
    </GradientDrawer>
  );
}

// =========================================================================
// WIZARD NUEVA PROFORMA
// =========================================================================

function WizardModal({
  open,
  onClose,
  onCreated,
  products,
  clients,
  representanteId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  products: Producto[];
  clients: Cliente[];
  representanteId: string;
}) {
  const [step, setStep] = useState(1);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [lines, setLines] = useState<WizardLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoClienteDoc, setNuevoClienteDoc] = useState('');
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [nuevoClienteTel, setNuevoClienteTel] = useState('');
  const [nuevoClienteEmail, setNuevoClienteEmail] = useState('');
  const [nuevoClienteDir, setNuevoClienteDir] = useState('');
  const [nuevoClienteTipo, setNuevoClienteTipo] = useState<'RUC' | 'DNI'>('RUC');
  const [nuevoClienteError, setNuevoClienteError] = useState('');
  const [nuevoClienteLoading, setNuevoClienteLoading] = useState(false);
  const [selectedContacto, setSelectedContacto] = useState<{ id: string; nombre: string; cargo?: string; email?: string } | null>(null);
  const [contactosEmpresa, setContactosEmpresa] = useState<{ id: string; nombre: string; cargo?: string; email?: string; es_principal?: boolean }[]>([]);
  const [loadingContactos, setLoadingContactos] = useState(false);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      c =>
        c.razon_social_o_nombre.toLowerCase().includes(q) || c.numero_documento.includes(q)
    );
  }, [clients, clientSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      p =>
        p.sku.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.cantidad * l.precio_pactado, 0),
    [lines]
  );

  const addProduct = (p: Producto) => {
    setLines(prev => {
      if (prev.find(l => l.producto.id === p.id)) return prev;
      return [...prev, { producto: p, cantidad: 1, precio_pactado: p.precio_base }];
    });
  };

  const updateLine = (idx: number, patch: Partial<WizardLine>) => {
    setLines(prev =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              ...patch,
              cantidad: Math.max(1, patch.cantidad ?? l.cantidad),
              precio_pactado: Math.max(0, patch.precio_pactado ?? l.precio_pactado),
            }
          : l
      )
    );
  };

  const removeLine = (idx: number) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    setStep(1);
    setClientSearch('');
    setSelectedClient(null);
    setSelectedContacto(null);
    setContactosEmpresa([]);
    setLines([]);
    setProductSearch('');
    setDueDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      return d.toISOString().split('T')[0];
    });
    setLoading(false);
  };

  const handleSelectClient = async (cliente: Cliente) => {
    setSelectedClient(cliente);
    setSelectedContacto(null);
    setContactosEmpresa([]);
    if (cliente.tipo_documento === 'RUC') {
      setLoadingContactos(true);
      try {
        const empresa = await getEmpresaByClienteId(cliente.id);
        if (empresa) {
          const contactos = await getContactosByEmpresaId(empresa.id);
          setContactosEmpresa(contactos);
          // Auto-seleccionar el principal si existe
          const principal = contactos.find(c => c.es_principal);
          if (principal) {
            setSelectedContacto({ id: principal.id, nombre: principal.nombre, cargo: principal.cargo, email: principal.email });
          }
        }
      } catch {
        // Silencioso
      } finally {
        setLoadingContactos(false);
      }
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCrearClienteWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    setNuevoClienteError('');
    const doc = nuevoClienteDoc.trim();
    const nombre = nuevoClienteNombre.trim();
    if (!doc || !nombre) {
      setNuevoClienteError('Documento y nombre son obligatorios.');
      return;
    }
    if (nuevoClienteTipo === 'RUC' && doc.length !== 11) {
      setNuevoClienteError('El RUC debe tener 11 dígitos.');
      return;
    }
    if (nuevoClienteTipo === 'DNI' && doc.length !== 8) {
      setNuevoClienteError('El DNI debe tener 8 dígitos.');
      return;
    }
    setNuevoClienteLoading(true);
    try {
      const created = await createCliente({
        tipo_documento: nuevoClienteTipo,
        numero_documento: doc,
        razon_social_o_nombre: nombre,
        telefono: nuevoClienteTel.trim() || undefined,
        email: nuevoClienteEmail.trim() || undefined,
        direccion: nuevoClienteDir.trim() || undefined,
        tipo_cliente: nuevoClienteTipo === 'RUC' ? 'EMPRESA' : 'PERSONA',
      });
      setSelectedClient(created);
      setShowNuevoCliente(false);
      setNuevoClienteDoc('');
      setNuevoClienteNombre('');
      setNuevoClienteTel('');
      setNuevoClienteEmail('');
      setNuevoClienteDir('');
      setNuevoClienteTipo('RUC');
      setNuevoClienteError('');
    } catch (err: any) {
      setNuevoClienteError(err?.message || 'Error al crear cliente.');
    } finally {
      setNuevoClienteLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      await createProforma({
        cliente_id: selectedClient.id,
        contacto_id: selectedContacto?.id || undefined,
        contacto_nombre: selectedContacto?.nombre || undefined,
        contacto_email: selectedContacto?.email || undefined,
        representante_id: representanteId,
        fecha_vencimiento: new Date(dueDate).toISOString(),
        total,
        detalles: lines.map(l => ({
          producto_id: l.producto.id,
          nombre: l.producto.nombre,
          sku: l.producto.sku,
          cantidad: l.cantidad,
          precio_pactado: l.precio_pactado,
          subtotal: l.cantidad * l.precio_pactado,
        })),
      });
      onCreated();
      handleClose();
    } catch {
      setLoading(false);
    }
  };

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const stepValid = (s: number) => {
    if (s === 1) return !!selectedClient;
    if (s === 2) return lines.length > 0;
    return true;
  };

  const Stepper = () => (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((n, i) => {
        const completed = step > n;
        const active = step === n;
        return (
          <React.Fragment key={n}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border transition-colors ${
                active
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white border-transparent'
                  : completed
                  ? 'bg-white text-green-600 border-green-300'
                  : 'bg-white text-slate-300 border-slate-200'
              }`}
            >
              {completed ? <Check className="w-4 h-4" /> : n}
            </div>
            {i < 2 && (
              <div
                className={`flex-1 h-0.5 rounded ${
                  step > n ? 'bg-green-300' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <GradientModal isOpen={open} onClose={handleClose} title="Nueva Proforma" size="xl">
      <div className="space-y-4">
        <Stepper />

        {step === 1 && (
          <div className="space-y-4">
            <GlassInput
              placeholder="Buscar cliente por RUC o nombre..."
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              iconLeft={<Search className="w-4 h-4" />}
            />
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredClients.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedClient?.id === c.id
                      ? 'border-orange-400 bg-orange-50/50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-800">{c.razon_social_o_nombre}</div>
                    <span className="text-xs font-mono text-slate-500">{c.numero_documento}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.direccion}</div>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">No se encontraron clientes</div>
              )}
            </div>

            {/* Contactos de la empresa (solo si es RUC) */}
            {selectedClient?.tipo_documento === 'RUC' && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contacto de la empresa</div>
                {loadingContactos ? (
                  <div className="text-sm text-slate-400 py-2">Cargando contactos...</div>
                ) : contactosEmpresa.length > 0 ? (
                  <div className="space-y-1.5">
                    {contactosEmpresa.map(co => (
                      <div
                        key={co.id}
                        onClick={() => setSelectedContacto({ id: co.id, nombre: co.nombre, cargo: co.cargo, email: co.email })}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          selectedContacto?.id === co.id
                            ? 'border-orange-400 bg-orange-50/50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-800">{co.nombre}</div>
                          {co.es_principal && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Principal</span>}
                        </div>
                        <div className="text-xs text-slate-500">{co.cargo || '—'} {co.email && `· ${co.email}`}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 py-2">No hay contactos registrados para esta empresa.</div>
                )}
              </div>
            )}

            <GradientButton variant="ghost" size="sm" className="w-full" onClick={() => setShowNuevoCliente(true)}>
              <Plus className="w-4 h-4" />
              Crear nuevo cliente
            </GradientButton>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-3 space-y-3">
              <GlassInput
                placeholder="Buscar producto por SKU o nombre..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                iconLeft={<Search className="w-4 h-4" />}
              />
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-colors"
                  >
                    {p.imagen ? (
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden shadow-sm shrink-0">
                        <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 truncate">{p.nombre}</div>
                      <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-mono text-slate-700">{formatMoney(p.precio_base)}</span>
                      <GradientButton
                        variant="primary"
                        size="sm"
                        onClick={() => addProduct(p)}
                        disabled={lines.some(l => l.producto.id === p.id)}
                      >
                        {lines.some(l => l.producto.id === p.id) ? 'Agregado' : 'Agregar'}
                      </GradientButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Líneas seleccionadas</h4>
              {lines.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">
                  <Package className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  Agrega productos
                </div>
              ) : (
                <div className="space-y-2">
                  {lines.map((l, i) => {
                    const discount = ((l.producto.precio_base - l.precio_pactado) / l.producto.precio_base) * 100;
                    const isOver = l.precio_pactado > l.producto.precio_base;
                    return (
                      <div key={l.producto.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                        <div className="text-xs font-semibold text-slate-800 mb-1 truncate">{l.producto.nombre}</div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 font-semibold">Cant</label>
                            <input
                              type="number"
                              min={1}
                              value={l.cantidad}
                              onChange={e => updateLine(i, { cantidad: parseInt(e.target.value) || 1 })}
                              className="w-full mt-0.5 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-slate-500 font-semibold">Precio</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={l.precio_pactado}
                              onChange={e => updateLine(i, { precio_pactado: parseFloat(e.target.value) || 0 })}
                              className="w-full mt-0.5 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/20"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-mono font-semibold text-slate-900">
                            {formatMoney(l.cantidad * l.precio_pactado)}
                          </div>
                          <div className="flex items-center gap-2">
                            {discount > 0 && !isOver && (
                              <span className="text-[10px] text-green-600 font-semibold">
                                Descuento: {discount.toFixed(1)}%
                              </span>
                            )}
                            {isOver && (
                              <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Mayor a lista
                              </span>
                            )}
                            <button
                              onClick={() => removeLine(i)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className="text-lg font-bold font-mono text-slate-900">{formatMoney(total)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <GradientCard className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Building2 className="w-4 h-4 text-orange-500" />
                {selectedClient?.razon_social_o_nombre}
              </div>
              <div className="text-xs text-slate-500 font-mono">{selectedClient?.numero_documento}</div>
              {selectedClient?.tipo_cliente === 'EMPRESA' && selectedContacto && (
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <div className="text-xs font-semibold text-slate-600">Contacto: {selectedContacto.nombre}</div>
                  {selectedContacto.cargo && <div className="text-[10px] text-slate-500">{selectedContacto.cargo}</div>}
                </div>
              )}
            </GradientCard>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Producto</th>
                    <th className="text-center px-3 py-2 font-medium">Cant</th>
                    <th className="text-right px-3 py-2 font-medium">Precio</th>
                    <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-sm text-slate-800">{l.producto.nombre}</td>
                      <td className="px-3 py-2 text-center text-sm">{l.cantidad}</td>
                      <td className="px-3 py-2 text-right text-sm font-mono">{formatMoney(l.precio_pactado)}</td>
                      <td className="px-3 py-2 text-right text-sm font-mono font-semibold">
                        {formatMoney(l.cantidad * l.precio_pactado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-700">Total final</span>
              <span className="text-2xl font-bold font-mono text-slate-900">{formatMoney(total)}</span>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Fecha de vencimiento</label>
              <input
                type="date"
                min={minDate}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <GradientButton variant="ghost" size="md" onClick={handleClose} disabled={loading}>
            Cancelar
          </GradientButton>
          <div className="flex gap-2">
            {step > 1 && (
              <GradientButton variant="secondary" size="md" onClick={() => setStep(s => s - 1)} disabled={loading}>
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </GradientButton>
            )}
            {step < 3 ? (
              <GradientButton
                variant="primary"
                size="md"
                onClick={() => setStep(s => s + 1)}
                disabled={!stepValid(step) || loading}
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </GradientButton>
            ) : (
              <GradientButton
                variant="primary"
                size="lg"
                className="w-48"
                loading={loading}
                onClick={handleSubmit}
              >
                <ShoppingCart className="w-4 h-4" />
                Generar Proforma
              </GradientButton>
            )}
          </div>
        </div>
      </div>

      {/* Modal crear cliente rápido */}
      <GradientModal
        isOpen={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        title="Nuevo cliente"
        size="sm"
        footer={
          <>
            <GradientButton variant="ghost" size="md" onClick={() => setShowNuevoCliente(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="primary" size="md" onClick={handleCrearClienteWizard} disabled={nuevoClienteLoading}>
              {nuevoClienteLoading ? 'Guardando...' : 'Crear cliente'}
            </GradientButton>
          </>
        }
      >
        <form onSubmit={handleCrearClienteWizard} className="space-y-3">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            {(['RUC', 'DNI'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNuevoClienteTipo(t)}
                className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${
                  nuevoClienteTipo === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'RUC' ? 'Empresa (RUC)' : 'Persona (DNI)'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{nuevoClienteTipo}</label>
            <GlassInput
              value={nuevoClienteDoc}
              onChange={(e) => setNuevoClienteDoc(e.target.value.replace(/\D/g, ''))}
              placeholder={nuevoClienteTipo === 'RUC' ? '11 dígitos' : '8 dígitos'}
              maxLength={nuevoClienteTipo === 'RUC' ? 11 : 8}
              className="font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{nuevoClienteTipo === 'RUC' ? 'Razón social' : 'Nombre completo'}</label>
            <GlassInput value={nuevoClienteNombre} onChange={(e) => setNuevoClienteNombre(e.target.value)} placeholder={nuevoClienteTipo === 'RUC' ? 'Ej: Constructora del Norte' : 'Ej: Juan Pérez'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
              <GlassInput value={nuevoClienteTel} onChange={(e) => setNuevoClienteTel(e.target.value)} placeholder="987654321" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <GlassInput value={nuevoClienteEmail} onChange={(e) => setNuevoClienteEmail(e.target.value)} placeholder="correo@mail.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
            <GlassInput value={nuevoClienteDir} onChange={(e) => setNuevoClienteDir(e.target.value)} placeholder="Av. Principal 123" />
          </div>
          {nuevoClienteError && <p className="text-sm text-red-600 font-medium">{nuevoClienteError}</p>}
        </form>
      </GradientModal>
    </GradientModal>
  );
}

// =========================================================================
// PÁGINA PRINCIPAL
// =========================================================================

export default function IndustrialPage() {
  const { usuario } = useSession();
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoProforma | 'TODOS'>('TODOS');
  const [drawerProforma, setDrawerProforma] = useState<Proforma | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const addAlert = (type: Alert['type'], message: string) => {
    const id = randomId();
    setAlerts(prev => [...prev, { id, type, message }]);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, pr, cl] = await Promise.all([
        getProformas(),
        getProducts(),
        getClients(),
      ]);
      setProformas(p);
      setProducts(pr);
      setClients(cl);
    } catch {
      addAlert('error', 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return proformas.filter(p => {
      const matchEstado = estadoFilter === 'TODOS' || p.estado === estadoFilter;
      const matchSearch =
        !q ||
        p.codigo_proforma.toLowerCase().includes(q) ||
        (p.cliente_nombre || '').toLowerCase().includes(q);
      return matchEstado && matchSearch;
    });
  }, [proformas, search, estadoFilter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of ESTADOS) map[e] = proformas.filter(p => p.estado === e).length;
    return map;
  }, [proformas]);

  const handleUpdateState = async (id: string, estado: EstadoProforma) => {
    setFadingIds(prev => new Set(prev).add(id));
    setTimeout(async () => {
      await updateProformaEstado(id, estado);
      setProformas(prev => prev.map(p => (p.id === id ? { ...p, estado } : p)));
      setFadingIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      addAlert('success', `Proforma actualizada a ${estado.replace('_', ' ')}`);
    }, 300);
  };

  const handleConvert = async (id: string) => {
    const prof = proformas.find(p => p.id === id);
    if (!prof) return;
    setFadingIds(prev => new Set(prev).add(id));
    setTimeout(async () => {
      try {
        await convertToOrder(id, prof);
        setProformas(prev => prev.map(p => (p.id === id ? { ...p, estado: 'APROBADA' } : p)));
        addAlert('success', 'Proforma convertida a orden de pedido');
      } catch {
        addAlert('error', 'Error al convertir proforma');
      }
      setFadingIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }, 300);
  };

  const columns = ESTADOS.map(estado => ({
    estado,
    items: filtered.filter(p => p.estado === estado),
  }));

  return (
    <div className="min-h-full p-6">
      <GradientToast alerts={alerts} onRemove={removeAlert} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Canal Industrial — Proformas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestión de cotizaciones industriales, negociaciones y conversiones a órdenes de pedido.
        </p>
      </div>

      {/* Contadores */}
      <div className="flex flex-wrap gap-3 mb-6">
        {ESTADOS.map(e => (
          <button
            key={e}
            onClick={() => setEstadoFilter(estadoFilter === e ? 'TODOS' : e)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              estadoFilter === e
                ? 'border-orange-300 bg-orange-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <StatusBadge variant={estadoVariant(e)} dot={false}>
              {ESTADO_CONFIG[e].label}
            </StatusBadge>
            <AnimatedCounter
              value={counts[e]}
              className="text-sm font-bold text-slate-700"
            />
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <GradientButton variant="primary" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4" />
          Nueva Proforma
        </GradientButton>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {estadoFilter === 'TODOS' ? 'Todos los estados' : ESTADO_CONFIG[estadoFilter].label}
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1">
              <button
                onClick={() => { setEstadoFilter('TODOS'); setDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Todos los estados
              </button>
              {ESTADOS.map(e => (
                <button
                  key={e}
                  onClick={() => { setEstadoFilter(e); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${ESTADO_CONFIG[e].badge === 'warning' ? 'bg-amber-500' : ESTADO_CONFIG[e].badge === 'info' ? 'bg-blue-500' : ESTADO_CONFIG[e].badge === 'success' ? 'bg-emerald-500' : ESTADO_CONFIG[e].badge === 'danger' ? 'bg-red-500' : 'bg-slate-400'}`} />
                  {ESTADO_CONFIG[e].label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-[200px] max-w-sm">
          <GlassInput
            placeholder="Buscar por cliente o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            iconLeft={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.estado} className="flex-shrink-0 w-[300px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <StatusBadge variant={estadoVariant(col.estado)}>
                {ESTADO_CONFIG[col.estado].label}
              </StatusBadge>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {col.items.length}
              </span>
            </div>
            <div className="space-y-3">
              {col.items.map(p => (
                <KanbanCard
                  key={p.id}
                  proforma={p}
                  products={products}
                  onSelect={setDrawerProforma}
                  onUpdateState={handleUpdateState}
                  onConvert={handleConvert}
                  fadingOut={fadingIds.has(p.id)}
                />
              ))}
              {col.items.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-lg">
                  Sin proformas
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando proformas...</span>
        </div>
      )}

      {/* Drawer */}
      <DetailDrawer
        proforma={drawerProforma}
        open={!!drawerProforma}
        onClose={() => setDrawerProforma(null)}
        onUpdateState={handleUpdateState}
        onConvert={handleConvert}
      />

      {/* Wizard */}
      <WizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={() => {
          loadData();
          addAlert('success', 'Proforma creada exitosamente');
        }}
        products={products}
        clients={clients}
        representanteId={usuario?.id || 'u2'}
      />
    </div>
  );
}
