import { useLayoutEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { Product } from '@/domain/product/product.types';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: Product[];
  unitById: Map<string, string>;
  subtitleFor: (product: Product) => string;
  now: number;
  expirySoonDays: number;
  onAdjust: (id: string, delta: number) => void;
  onToggleFavorite: (id: string) => void;
  onOpen: (product: Product) => void;
}

const ROW_HEIGHT = 76;
const GAP = 8;

/**
 * Lista de productos virtualizada contra el scroll de la ventana. Solo renderiza
 * las filas visibles, por lo que rinde bien con miles de productos.
 */
export function ProductList({
  products,
  unitById,
  subtitleFor,
  now,
  expirySoonDays,
  onAdjust,
  onToggleFavorite,
  onOpen,
}: ProductListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    setOffset(listRef.current?.offsetTop ?? 0);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: products.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    gap: GAP,
    scrollMargin: offset,
  });

  return (
    <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((item) => {
        const product = products[item.index]!;
        return (
          <div
            key={product.id}
            data-index={item.index}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
          >
            <ProductCard
              product={product}
              unitAbbrev={product.unitId ? unitById.get(product.unitId) : undefined}
              subtitle={subtitleFor(product)}
              now={now}
              expirySoonDays={expirySoonDays}
              onAdjust={onAdjust}
              onToggleFavorite={onToggleFavorite}
              onOpen={onOpen}
            />
          </div>
        );
      })}
    </div>
  );
}
