import { useRef, useState, type ChangeEvent } from 'react';
import { Receipt } from 'lucide-react';
import {
  applyReceiptItems,
  parseReceipt,
  type ReceiptItem,
} from '@/services/receipt/receipt.service';
import { fileToDataUrl } from '@/lib/image';
import { toast } from '@/stores/toast.store';
import { Button } from '@/components/ui/Button';
import { useCategories } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { ItemsReviewSheet } from './ItemsReviewSheet';

type Phase = 'idle' | 'reading' | 'review';

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
      setItems(await parseReceipt(dataUrl));
      setPhase('review');
    } catch (err) {
      setPhase('review');
      setError(err instanceof Error ? err.message : 'No se pudo leer el ticket.');
    }
  };

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

      <ItemsReviewSheet
        open={phase !== 'idle'}
        onClose={close}
        title="Revisa el ticket"
        loading={phase === 'reading'}
        loadingText="Leyendo el ticket…"
        error={error}
        emptyTitle="No se han encontrado productos"
        emptyDescription="Prueba con una foto más nítida y bien encuadrada del ticket."
        items={items}
        onChange={setItems}
        onConfirm={confirm}
        applying={applying}
      />
    </>
  );
}
