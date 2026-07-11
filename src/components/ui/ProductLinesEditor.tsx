import { Trash2 } from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import { Select } from './Select';
import { Input } from './Input';
import { IconButton } from './IconButton';

/** Línea genérica producto + cantidad (sirve para ingredientes y packs). */
export interface ProductLine {
  productId: string;
  quantity: number;
  unitId: string | null;
}

interface ProductLinesEditorProps {
  value: ProductLine[];
  onChange: (lines: ProductLine[]) => void;
  products: Product[];
  unitById: Map<string, string>;
  addLabel?: string;
}

/**
 * Editor de una lista de líneas producto+cantidad. Presentacional: recibe los
 * productos por props. Lo comparten el editor de recetas y el de packs.
 */
export function ProductLinesEditor({
  value,
  onChange,
  products,
  unitById,
  addLabel = 'Añadir producto…',
}: ProductLinesEditorProps) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const usedIds = new Set(value.map((l) => l.productId));
  const available = products.filter((p) => !usedIds.has(p.id));

  const addLine = (productId: string) => {
    const product = productById.get(productId);
    if (!product) return;
    onChange([...value, { productId, quantity: 1, unitId: product.unitId }]);
  };

  const setQuantity = (productId: string, quantity: number) => {
    onChange(value.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  };

  const removeLine = (productId: string) => {
    onChange(value.filter((l) => l.productId !== productId));
  };

  return (
    <div className="space-y-2">
      {value.map((line) => {
        const product = productById.get(line.productId);
        const unit = line.unitId ? unitById.get(line.unitId) : undefined;
        return (
          <div
            key={line.productId}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-text">
              {product?.name ?? 'Producto eliminado'}
            </span>
            <div className="w-16 shrink-0">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                aria-label={`Cantidad de ${product?.name ?? 'producto'}`}
                value={line.quantity}
                onChange={(e) => setQuantity(line.productId, Number(e.target.value))}
                className="h-9 text-center"
              />
            </div>
            {unit ? <span className="w-8 text-xs text-muted">{unit}</span> : null}
            <IconButton
              icon={Trash2}
              label={`Quitar ${product?.name ?? 'producto'}`}
              size="sm"
              onClick={() => removeLine(line.productId)}
              className="text-danger"
            />
          </div>
        );
      })}

      {available.length > 0 ? (
        <Select
          aria-label={addLabel}
          value=""
          onChange={(e) => {
            if (e.target.value) addLine(e.target.value);
          }}
        >
          <option value="">{addLabel}</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      ) : products.length === 0 ? (
        <p className="text-xs text-muted">Primero crea productos en el inventario.</p>
      ) : null}
    </div>
  );
}
