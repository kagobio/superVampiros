import { Loader2, Plus, Receipt, Trash2 } from 'lucide-react';
import type { ReceiptItem } from '@/services/receipt/receipt.service';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';

interface ItemsReviewSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  loading?: boolean;
  loadingText?: string;
  error?: string | null;
  emptyTitle: string;
  emptyDescription: string;
  items: ReceiptItem[];
  onChange: (items: ReceiptItem[]) => void;
  onConfirm: () => void;
  applying?: boolean;
}

const field =
  'w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]';

/**
 * Hoja de revisión de productos antes de añadirlos al inventario. La comparten
 * el escaneo de ticket y el dictado por voz: la IA propone y el usuario corrige.
 */
export function ItemsReviewSheet({
  open,
  onClose,
  title,
  loading = false,
  loadingText = 'Procesando…',
  error = null,
  emptyTitle,
  emptyDescription,
  items,
  onChange,
  onConfirm,
  applying = false,
}: ItemsReviewSheetProps) {
  const editItem = (index: number, patch: Partial<ReceiptItem>) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const addItem = () => onChange([...items, { nombre: '', cantidad: 1, precio: null }]);

  const validCount = items.filter((it) => it.nombre.trim()).length;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        !loading && !error && items.length > 0 ? (
          <Button className="w-full" onClick={onConfirm} disabled={applying || validCount === 0}>
            {applying ? <Loader2 size={18} aria-hidden="true" className="animate-spin" /> : null}
            Añadir {validCount} al inventario
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted">
          <Loader2 className="animate-spin" aria-hidden="true" />
          <p className="text-sm">{loadingText}</p>
        </div>
      ) : error ? (
        <EmptyState icon={Receipt} title="No se pudo procesar" description={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={emptyTitle}
          description={emptyDescription}
          action={<Button onClick={addItem}>Añadir a mano</Button>}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted">
            Revisa y corrige antes de añadir. El precio es por unidad.
          </p>
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border bg-surface-2 p-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={item.nombre}
                  onChange={(e) => editItem(i, { nombre: e.target.value })}
                  placeholder="Nombre del producto"
                  aria-label="Nombre"
                  className={field}
                />
                <IconButton
                  icon={Trash2}
                  label="Quitar línea"
                  size="sm"
                  onClick={() => removeItem(i)}
                  className="text-danger"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-muted">
                  Cant.
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={item.cantidad}
                    onChange={(e) => editItem(i, { cantidad: Number(e.target.value) || 0 })}
                    aria-label="Cantidad"
                    className={`${field} w-16`}
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted">
                  Precio/ud
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="—"
                    value={item.precio ?? ''}
                    onChange={(e) =>
                      editItem(i, {
                        precio: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    aria-label="Precio por unidad"
                    className={`${field} w-20`}
                  />
                  €
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted transition-colors hover:text-text"
          >
            <Plus size={16} aria-hidden="true" />
            Añadir línea
          </button>
        </div>
      )}
    </Sheet>
  );
}
