import { memo } from 'react';
import { Star } from 'lucide-react';
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
}: ProductCardProps) {
  const stock = stockStatus(product);
  const expiry = expiryStatus(product, now, expirySoonDays);

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface p-3.5">
      {/* Zona pulsable que abre la edición (no incluye favorito ni stepper). */}
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
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

      <Stepper
        value={product.quantity}
        label={product.name}
        unit={unitAbbrev}
        onDecrement={() => onAdjust(product.id, -1)}
        onIncrement={() => onAdjust(product.id, 1)}
      />
    </div>
  );
}

export const ProductCard = memo(ProductCardBase);
