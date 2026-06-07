// StockBadge.tsx — Badge de estado de stock en modo claro

interface StockBadgeProps {
  stockActual: number;
  stockMinimo: number;
}

export default function StockBadge({ stockActual, stockMinimo }: StockBadgeProps) {
  let label = 'Disponible';
  let styles = 'bg-emerald-50 text-success-green border-emerald-200';

  if (stockActual === 0) {
    label = 'Sin Stock';
    styles = 'bg-red-50 text-danger-red border-red-200';
  } else if (stockActual <= stockMinimo) {
    label = 'Bajo Stock';
    styles = 'bg-amber-50 text-brand-amber border-amber-200';
  } else if (stockActual <= stockMinimo * 2) {
    label = 'Stock Limitado';
    styles = 'bg-orange-50 text-primary border-orange-200';
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border
        text-[10px] font-bold uppercase tracking-wider
        ${styles}
      `}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
      {label} ({stockActual} u)
    </span>
  );
}
