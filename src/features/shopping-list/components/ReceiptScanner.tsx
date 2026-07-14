import { useRef, useState, type ChangeEvent } from 'react';
import { Loader2, Plus, Receipt, Trash2 } from 'lucide-react';
import {
  applyReceiptItems,
  parseReceipt,
  type ReceiptItem,
} from '@/services/receipt/receipt.service';
import { fileToDataUrl } from '@/lib/image';
import { toast } from '@/stores/toast.store';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCategories } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';

type Phase = 'idle' | 'reading' | 'review';

const numberField =
  'w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]';

/**
 * Escanea un ticket de compra: foto → la IA lee productos/precios → el usuario
 * revisa/corrige → se añaden al inventario registrando la compra (cuenta para el
 * gasto). Solo funciona en producción (la función Netlify con la clave de Groq).
 */
export function ReceiptScanner() {
  const products = useProducts();
  const categories = useCategories();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir la misma foto
    if (!file) return;
    setError(null);
    setItems([]);
    setPhase('reading');
    let dataUrl: string;
    try {
      dataUrl = await fileToDataUrl(file);
    } catch {
      setPhase('review');
      setError('No se pudo procesar la foto. Prueba con otra imagen.');
      return;
    }
    try {
      const parsed = await parseReceipt(dataUrl);
      setItems(parsed);
      setPhase('review');
    } catch (err) {
      setPhase('review');
      setError(err instanceof Error ? err.message : 'No se pudo leer el ticket.');
    }
  };

  const editItem = (index: number, patch: Partial<ReceiptItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const addItem = () => setItems((prev) => [...prev, { nombre: '', cantidad: 1, precio: null }]);

  const close = () => {
    setPhase('idle');
    setItems([]);
    setError(null);
  };

  const confirm = async () => {
    const clean = items.filter((it) => it.nombre.trim());
    if (clean.length === 0) return;
    setApplying(true);
    try {
      const { added, updated } = await applyReceiptItems(clean, products, categories);
      const parts = [
        added > 0 ? `${added} ${added === 1 ? 'nuevo' : 'nuevos'}` : '',
        updated > 0 ? `${updated} actualizado${updated === 1 ? '' : 's'}` : '',
      ].filter(Boolean);
      toast(`Ticket añadido · ${parts.join(' y ') || 'sin cambios'}`, 'success');
      close();
    } finally {
      setApplying(false);
    }
  };

  const open = phase !== 'idle';

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
      <Button variant="secondary" className="w-full" onClick={() => inputRef.current?.click()}>
        <Receipt size={18} aria-hidden="true" />
        Escanear ticket
      </Button>

      <Sheet
        open={open}
        onClose={close}
        title="Revisa el ticket"
        footer={
          phase === 'review' && items.length > 0 ? (
            <Button className="w-full" onClick={confirm} disabled={applying}>
              {applying ? (
                <Loader2 size={18} aria-hidden="true" className="animate-spin" />
              ) : null}
              Añadir {items.filter((it) => it.nombre.trim()).length} al inventario
            </Button>
          ) : undefined
        }
      >
        {phase === 'reading' ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted">
            <Loader2 className="animate-spin" aria-hidden="true" />
            <p className="text-sm">Leyendo el ticket…</p>
          </div>
        ) : error ? (
          <EmptyState icon={Receipt} title="No se pudo leer el ticket" description={error} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No se han encontrado productos"
            description="Prueba con una foto más nítida y bien encuadrada del ticket."
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
                    className={numberField}
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
                      className={`${numberField} w-16`}
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
                      className={`${numberField} w-20`}
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
    </>
  );
}
