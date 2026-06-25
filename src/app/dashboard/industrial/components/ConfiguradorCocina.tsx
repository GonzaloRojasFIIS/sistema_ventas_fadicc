import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Flame, 
  Ruler, 
  Layers, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  AlertTriangle,
  TrendingUp,
  Package,
  Shield,
  Info,
  X,
  Plus,
  Minus,
  Factory
} from 'lucide-react';
import { Producto } from '@/types';

// --- Tipos locales ---
export interface WizardLine {
  producto: Producto;
  cantidad: number;
  precio_pactado: number;
}

// --- Constantes de Configuración ---
const MATERIALES = [
  { 
    id: '304' as const, 
    nombre: 'Acero Inox 304', 
    subtitulo: 'Premium · Máxima resistencia',
    costo: 2800, 
    sugerido: 4200,
    color: '#e8f5e9',
    borderColor: '#4caf50',
    icon: Shield,
    specs: ['Resistencia a la corrosión', 'Uso intensivo', 'Vida útil 15+ años']
  },
  { 
    id: '430' as const, 
    nombre: 'Acero Inox 430', 
    subtitulo: 'Estándar · Buen rendimiento',
    costo: 1800, 
    sugerido: 2800,
    color: '#e3f2fd',
    borderColor: '#2196f3',
    icon: Layers,
    specs: ['Resistencia moderada', 'Uso comercial', 'Vida útil 10 años']
  },
  { 
    id: 'FIERRO' as const, 
    nombre: 'Fierro Galvanizado', 
    subtitulo: 'Económico · Uso básico',
    costo: 900, 
    sugerido: 1400,
    color: '#fff3e0',
    borderColor: '#ff9800',
    icon: Factory,
    specs: ['Mantenimiento periódico', 'Uso ligero', 'Vida útil 5 años']
  },
];

const PRESIONES = [
  { 
    id: 'ALTA' as const, 
    nombre: 'Alta Presión', 
    subtitulo: 'Comercial · 28-30 mbar',
    costoPorHornilla: 180, 
    sugeridoPorHornilla: 270,
    icon: Flame,
    color: '#ff5722',
    desc: 'Ideal para restaurantes y cocinas de alto rendimiento. Mayor potencia calórica.'
  },
  { 
    id: 'BAJA' as const, 
    nombre: 'Baja Presión', 
    subtitulo: 'Semi-Industrial · 19-21 mbar',
    costoPorHornilla: 90, 
    sugeridoPorHornilla: 140,
    icon: Zap,
    color: '#03a9f4',
    desc: 'Para cocinas medianas y uso continuo moderado. Mayor eficiencia energética.'
  },
];

const BASES = [
  { 
    id: 'MESA' as const, 
    nombre: 'Patas de Mesa', 
    costo: 350, 
    sugerido: 550,
    icon: Ruler,
    altura: '85 cm',
    peso: '12 kg',
    desc: 'Estructura abierta con 4 patas regulables. Fácil limpieza.'
  },
  { 
    id: 'HORNO' as const, 
    nombre: 'Horno Integrado', 
    costo: 1800, 
    sugerido: 2800,
    icon: Package,
    altura: '110 cm',
    peso: '45 kg',
    desc: 'Incluye horno a gas con termostato y 3 niveles de rack.'
  },
  { 
    id: 'PAGOPLANCHA' as const, 
    nombre: 'Plancha + Parrilla', 
    costo: 900, 
    sugerido: 1400,
    icon: Layers,
    altura: '95 cm',
    peso: '28 kg',
    desc: 'Superficie de plancha + parrilla de hierro fundido.'
  },
];

interface ConfiguradorCocinaProps {
  isOpen: boolean;
  onClose: () => void;
  onAgregar: (linea: WizardLine) => void;
}

export const ConfiguradorCocina: React.FC<ConfiguradorCocinaProps> = ({ 
  isOpen, 
  onClose, 
  onAgregar 
}) => {
  // Estados
  const [step, setStep] = useState(1);
  const [material, setMaterial] = useState<'304' | '430' | 'FIERRO'>('304');
  const [hornillas, setHornillas] = useState(4);
  const [presion, setPresion] = useState<'ALTA' | 'BAJA'>('ALTA');
  const [tipoBase, setTipoBase] = useState<'MESA' | 'HORNO' | 'PAGOPLANCHA'>('MESA');
  const [anchoEspecial, setAnchoEspecial] = useState(false);
  const [precioPactado, setPrecioPactado] = useState(0);

  // Cálculos memoizados
  const calculos = useMemo(() => {
    const matData = MATERIALES.find(m => m.id === material)!;
    const presData = PRESIONES.find(p => p.id === presion)!;
    const baseData = BASES.find(b => b.id === tipoBase)!;

    const costoMat = matData.costo;
    const sugeridoMat = matData.sugerido;
    
    const costoHorn = hornillas * 280;
    const sugeridoHorn = hornillas * 420;
    
    const costoPres = hornillas * presData.costoPorHornilla;
    const sugeridoPres = hornillas * presData.sugeridoPorHornilla;
    
    const costoB = baseData.costo;
    const sugeridoB = baseData.sugerido;
    
    const anchoExtra = anchoEspecial ? costoMat * 0.25 : 0;
    const anchoExtraS = anchoEspecial ? sugeridoMat * 0.25 : 0;

    const costoTotal = Math.round(costoMat + costoHorn + costoPres + costoB + anchoExtra);
    const precioSugerido = Math.round(sugeridoMat + sugeridoHorn + sugeridoPres + sugeridoB + anchoExtraS);

    return {
      costoTotal,
      precioSugerido,
      desglose: [
        { label: `Material (${matData.nombre})`, costo: costoMat, sugerido: sugeridoMat, pct: Math.round((costoMat/costoTotal)*100) },
        { label: `${hornillas} Hornillas`, costo: costoHorn, sugerido: sugeridoHorn, pct: Math.round((costoHorn/costoTotal)*100) },
        { label: `Quemadores ${presData.nombre}`, costo: costoPres, sugerido: sugeridoPres, pct: Math.round((costoPres/costoTotal)*100) },
        { label: `Base: ${baseData.nombre}`, costo: costoB, sugerido: sugeridoB, pct: Math.round((costoB/costoTotal)*100) },
        ...(anchoEspecial ? [{ 
          label: 'Extra ancho especial (+25%)', 
          costo: Math.round(anchoExtra), 
          sugerido: Math.round(anchoExtraS),
          pct: Math.round((anchoExtra/costoTotal)*100)
        }] : []),
      ],
      matData,
      presData,
      baseData,
    };
  }, [material, hornillas, presion, tipoBase, anchoEspecial]);

  // Sincronizar precio pactado
  useEffect(() => {
    setPrecioPactado(calculos.precioSugerido);
  }, [calculos.precioSugerido]);

  // Margen
  const margen = useMemo(() => {
    if (precioPactado <= 0) return 0;
    return Math.round(((precioPactado - calculos.costoTotal) / precioPactado) * 100);
  }, [precioPactado, calculos.costoTotal]);

  // Validaciones
  const isValid = precioPactado >= calculos.costoTotal && hornillas >= 1 && hornillas <= 20;
  const margenColor = margen >= 40 ? 'green' : margen >= 25 ? 'amber' : 'red';
  const margenLabel = margen >= 40 ? 'Margen saludable' : margen >= 25 ? 'Margen aceptable' : margen >= 0 ? 'Margen bajo' : 'Por debajo de costo';

  // Handlers de navegación
  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  
  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return hornillas >= 1 && hornillas <= 20;
    if (step === 3) return isValid;
    return false;
  };

  // Generar SVG dinámico del producto
  const generatePreviewSVG = useCallback(() => {
    const w = 320;
    const h = 200;
    const hornillaColor = presion === 'ALTA' ? '#ff5722' : '#03a9f4';
    const bodyColor = material === '304' ? '#c0c0c0' : material === '430' ? '#a8a8a8' : '#5a5a5a';
    const baseColor = tipoBase === 'HORNO' ? '#455a64' : tipoBase === 'PAGOPLANCHA' ? '#6d4c41' : '#8d6e63';
    
    const hornillaSpacing = w / (hornillas + 1);
    const hornillasSVG = Array.from({ length: hornillas }, (_, i) => {
      const cx = hornillaSpacing * (i + 1);
      return `<circle cx="${cx}" cy="60" r="18" fill="${hornillaColor}" opacity="0.9"/>
        <circle cx="${cx}" cy="60" r="12" fill="#ff9800" opacity="0.6"/>
        <circle cx="${cx}" cy="60" r="6" fill="#fff" opacity="0.4"/>`;
    }).join('');

    const baseSVG = tipoBase === 'MESA' 
      ? `<rect x="40" y="140" width="20" height="50" fill="${baseColor}" rx="2"/>
         <rect x="260" y="140" width="20" height="50" fill="${baseColor}" rx="2"/>
         <rect x="30" y="185" width="40" height="8" fill="#333" rx="2"/>
         <rect x="250" y="185" width="40" height="8" fill="#333" rx="2"/>`
      : tipoBase === 'HORNO'
      ? `<rect x="50" y="110" width="220" height="80" fill="${baseColor}" rx="4"/>
         <rect x="70" y="125" width="180" height="50" fill="#263238" rx="2"/>
         <circle cx="90" cy="150" r="4" fill="#ff5722" opacity="0.8"/>
         <text x="160" y="155" text-anchor="middle" fill="#fff" font-size="10" font-family="sans-serif">HORNO</text>`
      : `<rect x="50" y="110" width="220" height="70" fill="${baseColor}" rx="4"/>
         <rect x="60" y="120" width="90" height="50" fill="#5d4037" rx="2"/>
         <rect x="160" y="120" width="100" height="50" fill="#3e2723" rx="2"/>
         <line x1="155" y1="120" x2="155" y2="170" stroke="#8d6e63" stroke-width="2"/>`;

    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="metal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${bodyColor}" stop-opacity="0.9"/>
          <stop offset="50%" stop-color="${bodyColor}" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="${bodyColor}" stop-opacity="0.9"/>
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15"/>
        </filter>
      </defs>
      <rect width="${w}" height="${h}" fill="#f8fafc" rx="12"/>
      <!-- Cuerpo principal -->
      <rect x="20" y="20" width="${w-40}" height="100" fill="url(#metal)" rx="8" filter="url(#shadow)"/>
      <rect x="25" y="25" width="${w-50}" height="90" fill="none" stroke="#fff" stroke-width="1" opacity="0.3" rx="6"/>
      <!-- Hornillas -->
      ${hornillasSVG}
      <!-- Panel de control -->
      <rect x="${w-60}" y="30" width="30" height="50" fill="#37474f" rx="4"/>
      <circle cx="${w-45}" cy="42" r="3" fill="#4caf50"/>
      <circle cx="${w-45}" cy="55" r="3" fill="#ff5722"/>
      <circle cx="${w-45}" cy="68" r="3" fill="#2196f3"/>
      <!-- Base -->
      ${baseSVG}
      <!-- Badge de ancho especial -->
      ${anchoEspecial ? `<rect x="10" y="10" width="80" height="20" fill="#ff9800" rx="10" opacity="0.9"/>
        <text x="50" y="24" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold" font-family="sans-serif">ANCHO ESPECIAL</text>` : ''}
      <!-- Badge de material -->
      <rect x="${w-90}" y="10" width="80" height="20" fill="${material === '304' ? '#4caf50' : material === '430' ? '#2196f3' : '#ff9800'}" rx="10" opacity="0.9"/>
      <text x="${w-50}" y="24" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold" font-family="sans-serif">${material}</text>
    </svg>`)}`;
  }, [material, hornillas, presion, tipoBase, anchoEspecial]);

  // Agregar a proforma
  const handleAgregar = () => {
    if (!isValid) return;
    
    const matLabel = material === '304' ? 'AISI 304' : material === '430' ? 'AISI 430' : 'Fierro';
    const baseLabel = tipoBase === 'HORNO' ? 'c/Horno' : tipoBase === 'PAGOPLANCHA' ? 'c/Plancha-Parrilla' : 'c/Mesa y Patas';
    const specialLabel = anchoEspecial ? ' [Medidas Especiales]' : '';
    
    const customName = `Cocina a Medida ${hornillas}H ${presion === 'ALTA' ? 'Alta' : 'Baja'} Presión, ${matLabel}, ${baseLabel}${specialLabel}`;
    const customSku = `CUS-${material}-${hornillas}H-${presion[0]}-${tipoBase.slice(0,3)}`;

    onAgregar({
      producto: {
        id: '00000000-0000-0000-0000-000000000000',
        sku: customSku,
        nombre: customName,
        precio_base: calculos.precioSugerido,
        imagen: generatePreviewSVG(),
        stock_actual: 999,
        stock_minimo: 0,
      },
      cantidad: 1,
      precio_pactado: precioPactado,
    });

    // Reset y cerrar
    setStep(1);
    setMaterial('304');
    setHornillas(4);
    setPresion('ALTA');
    setTipoBase('MESA');
    setAnchoEspecial(false);
    setPrecioPactado(0);
    onClose();
  };

  if (!isOpen) return null;

  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configurador de Cocina a Medida</h2>
              <p className="text-xs text-orange-100">Diseña tu equipo industrial paso a paso</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Stepper */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-center gap-2">
            {[
              { num: 1, label: 'Material', icon: Layers },
              { num: 2, label: 'Configuración', icon: Flame },
              { num: 3, label: 'Costeo & Precio', icon: TrendingUp },
            ].map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isActive ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' : 
                    isDone ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? 'bg-orange-500 text-white' : 
                      isDone ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-500'
                    }`}>
                      {isDone ? <Check className="w-3 h-3" /> : s.num}
                    </div>
                    <span className="text-sm font-semibold hidden sm:block">{s.label}</span>
                    <Icon className="w-4 h-4 sm:hidden" />
                  </div>
                  {i < 2 && (
                    <div className={`w-12 h-0.5 rounded-full ${
                      step > s.num ? 'bg-green-400' : 'bg-slate-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Panel Izquierdo: Configuración */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* PASO 1: MATERIAL */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Selecciona el Material</h3>
                    <p className="text-sm text-slate-500">El material determina la durabilidad, resistencia y precio final.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {MATERIALES.map((m) => {
                      const Icon = m.icon;
                      const isSelected = material === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMaterial(m.id)}
                          className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg ${
                            isSelected 
                              ? 'shadow-md' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          style={isSelected ? { borderColor: m.borderColor, backgroundColor: m.color } : {}}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white shadow-sm' : 'bg-slate-100'
                            }`}>
                              <Icon className="w-6 h-6" style={{ color: m.borderColor }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-900">{m.nombre}</h4>
                                {isSelected && <Check className="w-4 h-4 text-green-600" />}
                              </div>
                              <p className="text-sm text-slate-500 mb-3">{m.subtitulo}</p>
                              <div className="flex flex-wrap gap-2">
                                {m.specs.map((spec, i) => (
                                  <span key={i} className="text-[11px] font-medium px-2 py-1 rounded-md bg-white/80 text-slate-600 border border-slate-200">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs text-slate-400">Desde</div>
                              <div className="text-lg font-bold text-slate-900">S/ {m.sugerido.toLocaleString()}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 2: CONFIGURACIÓN */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Configura tu Equipo</h3>
                    <p className="text-sm text-slate-500">Define las especificaciones técnicas de tu cocina.</p>
                  </div>

                  {/* Hornillas */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <label className="text-sm font-bold text-slate-800 block">Número de Hornillas</label>
                        <p className="text-xs text-slate-500 mt-0.5">Capacidad de cocción simultánea</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                        <button 
                          type="button"
                          onClick={() => setHornillas(Math.max(1, hornillas - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-slate-600" />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900 text-lg">{hornillas}</span>
                        <button 
                          type="button"
                          onClick={() => setHornillas(Math.min(20, hornillas + 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-slate-600" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[2, 4, 6, 8, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setHornillas(n)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            hornillas === n 
                              ? 'bg-orange-500 text-white shadow-md' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {n}H
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Presión */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <label className="text-sm font-bold text-slate-800 block mb-3">Sistema de Quemadores</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PRESIONES.map((p) => {
                        const Icon = p.icon;
                        const isSelected = presion === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPresion(p.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected 
                                ? 'border-orange-500 bg-orange-50' 
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-orange-100' : 'bg-slate-100'
                              }`}>
                                <Icon className="w-5 h-5" style={{ color: p.color }} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{p.nombre}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{p.subtitulo}</p>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Base */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <label className="text-sm font-bold text-slate-800 block mb-3">Estructura Base</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {BASES.map((b) => {
                        const Icon = b.icon;
                        const isSelected = tipoBase === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setTipoBase(b.id)}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                              isSelected 
                                ? 'border-orange-500 bg-orange-50' 
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                              isSelected ? 'bg-orange-100' : 'bg-slate-100'
                            }`}>
                              <Icon className="w-5 h-5 text-slate-600" />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{b.nombre}</h4>
                            <div className="flex justify-center gap-2 mt-2 text-[10px] text-slate-400">
                              <span>{b.altura}</span>
                              <span>·</span>
                              <span>{b.peso}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ancho Especial */}
                  <button
                    type="button"
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                      anchoEspecial 
                        ? 'border-orange-400 bg-orange-50' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`} 
                    onClick={() => setAnchoEspecial(!anchoEspecial)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      anchoEspecial ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                    }`}>
                      {anchoEspecial && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Ancho Especial</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Más de 1.20 metros de ancho. Requiere 25% más material.</p>
                      {anchoEspecial && (
                        <p className="text-xs text-orange-600 font-semibold mt-1">+ S/ {Math.round(calculos.matData.costo * 0.25).toLocaleString()} adicional</p>
                      )}
                    </div>
                  </button>
                </div>
              )}

              {/* PASO 3: COSTEO */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Revisa y Cotiza</h3>
                    <p className="text-sm text-slate-500">Verifica el desglose de costos y define el precio pactado.</p>
                  </div>

                  {/* Preview del producto */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Vista Previa</h4>
                    <div className="flex justify-center">
                      <img 
                        src={generatePreviewSVG()} 
                        alt="Vista previa" 
                        className="rounded-xl shadow-lg"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
                        {calculos.matData.nombre}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
                        {hornillas} Hornillas
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
                        {calculos.presData.nombre}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
                        {calculos.baseData.nombre}
                      </span>
                      {anchoEspecial && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-orange-100 border border-orange-200 text-orange-700">
                          Ancho Especial
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Precio Pactado */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <label className="text-sm font-bold text-slate-800 block mb-2">Precio Pactado (S/)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">S/</span>
                      <input
                        type="number"
                        min={calculos.costoTotal}
                        value={precioPactado || ''}
                        onChange={e => setPrecioPactado(Number(e.target.value))}
                        className={`w-full pl-12 pr-4 py-3 text-xl font-bold rounded-xl border-2 transition-all ${
                          precioPactado < calculos.costoTotal 
                            ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-200 focus:outline-none' 
                            : 'border-slate-200 bg-white text-slate-900 focus:ring-orange-200 focus:border-orange-400 focus:outline-none'
                        }`}
                      />
                    </div>
                    {precioPactado < calculos.costoTotal && (
                      <div className="flex items-center gap-2 mt-2 text-red-600 text-xs font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        El precio no puede ser menor al costo de fabricación (S/ {calculos.costoTotal.toLocaleString()})
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <Info className="w-3 h-3" />
                      Precio sugerido: S/ {calculos.precioSugerido.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Derecho: Resumen de Costos (SIEMPRE VISIBLE) */}
            <div className="lg:col-span-2">
              <div className="sticky top-0 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Desglose de Costos</h4>
                </div>

                {/* Gráfico de barras de costos */}
                <div className="space-y-3">
                  {calculos.desglose.map((item, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600 font-medium truncate pr-2">{item.label}</span>
                        <span className="text-xs font-mono font-bold text-slate-700 shrink-0">S/ {item.costo.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">Costo Total</span>
                    <span className="text-lg font-mono font-bold text-slate-900">S/ {calculos.costoTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Precio Sugerido</span>
                    <span className="text-sm font-mono font-semibold text-slate-500">S/ {calculos.precioSugerido.toLocaleString()}</span>
                  </div>
                </div>

                {/* Margen */}
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600">Margen de Ganancia</span>
                    <span className={`text-sm font-bold ${
                      margenColor === 'green' ? 'text-green-600' : 
                      margenColor === 'amber' ? 'text-amber-600' : 'text-red-600'
                    }`}>{margen}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        margenColor === 'green' ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                        margenColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, margen))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-center mt-2 font-medium text-slate-500">
                    {margenLabel}
                  </p>
                </div>

                {/* Resumen de configuración */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuración Actual</h5>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Material</span>
                      <span className="font-semibold text-slate-700">{calculos.matData.nombre}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Hornillas</span>
                      <span className="font-semibold text-slate-700">{hornillas}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Presión</span>
                      <span className="font-semibold text-slate-700">{calculos.presData.nombre}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Base</span>
                      <span className="font-semibold text-slate-700">{calculos.baseData.nombre}</span>
                    </div>
                    {anchoEspecial && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Ancho</span>
                        <span className="font-semibold text-orange-600">Especial (+25%)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Navegación */}
        <div className="border-t border-slate-200 px-6 py-4 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                step === 1 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-3">
              {step === 3 && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 mr-4">
                  <span>Costo: <strong className="text-slate-700">S/ {calculos.costoTotal.toLocaleString()}</strong></span>
                  <span>·</span>
                  <span>Sugerido: <strong className="text-slate-700">S/ {calculos.precioSugerido.toLocaleString()}</strong></span>
                </div>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    canProceed()
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAgregar}
                  disabled={!isValid}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isValid
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Agregar a Proforma
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
