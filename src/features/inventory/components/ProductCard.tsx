import { memo } from 'react';
import { Check, Star } from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import { expiryStatus, stockStatus } from '@/domain/product/product.rules';
import { Stepper } from '@/components/ui/Stepper';
import { cn } from '@/lib/cn';

interface ProductCardProps {
  product: Product;
  unitAbbrev?: string;
  subtitle?: string;
  now: number;
  expirySoonDays: number;
  onAdjust: (id: string, delta: number) => void;
  onOpen: (product: Product) => void;
  /** En modo selección la tarjeta marca/desmarca en vez de abrir la edición. */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const stockDot: Record<ReturnType<typeof stockStatus>, string> = {
  out: 'bg-danger',
  low: 'bg-warning',
  ok: 'bg-success',
};

function ProductCardBase({
  product,
  unitAbbrev,
  subtitle,
  now,
  expirySoonDays,
  onAdjust,
  onOpen,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: ProductCardProps) {
  const stock = stockStatus(product);
  const expiry = expiryStatus(product, now, expirySoonDays);

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-2xl border bg-surface p-3.5 transition-colors',
        selectionMode && selected ? 'border-primary bg-primary/5' : 'border-border',
      )}
    >
      {/* Zona pulsable: abre la edición o, en modo selección, marca/desmarca. */}
      <button
        type="button"
        onClick={() => (selectionMode ? onToggleSelect?.(product.id) : onOpen(product))}
        aria-pressed={selectionMode ? selected : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {selectionMode ? (
          <span
            aria-hidden="true"
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
              selected ? 'border-transparent bg-primary text-primary-fg' : 'border-border',
            )}
          >
            {selected ? <Check size={14} /> : null}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn('h-2 w-2 shrink-0 rounded-full', stockDot[stock])}
            />
            <span className="truncate text-base font-semibold text-text">{product.name}</span>
            {product.favorite ? (
              <Star
                size={14}
                aria-label="Favorito"
                className="shrink-0 fill-warning text-warning"
              />
            ) : null}
          </span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            {subtitle ? <span className="truncate">{subtitle}</span> : null}
            {expiry === 'expired' ? (
              <span className="rounded-full bg-danger/15 px-1.5 py-0.5 text-danger">Caducado</span>
            ) : expiry === 'soon' ? (
              <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-warning">
                Caduca pronto
              </span>
            ) : null}
          </span>
        </span>
      </button>

      {selectionMode ? null : (
        <Stepper
          value={product.quantity}
          label={product.name}
          unit={unitAbbrev}
          onDecrement={() => onAdjust(product.id, -1)}
          onIncrement={() => onAdjust(product.id, 1)}
        />
      )}
    </div>
  );
}

export const ProductCard = memo(ProductCardBase);
