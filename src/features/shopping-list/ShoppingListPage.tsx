import { useMemo, useState } from 'react';
import { Check, Clock, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import { productsToRestock, suggestedBuyQuantity } from '@/domain/shopping/shopping.rules';
import { productsRunningLow } from '@/domain/inventory/prediction';
import type { ShoppingListItem } from '@/domain/shopping/shopping.types';
import { shoppingListService } from '@/services/shopping/shopping-list.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { useCategories, useUnits } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { useHistory } from '@/features/history/hooks/useHistory';
import { useManualItems } from './hooks/useShoppingList';
import { ReceiptScanner } from './components/ReceiptScanner';
import { VoiceAdd } from './components/VoiceAdd';

const NO_CATEGORY = '__none__';

/** Texto amable de cuándo se agota un producto según su ritmo de consumo. */
function describeDaysLeft(days: number): string {
  const d = Math.round(days);
  if (d <= 0) return 'se acaba hoy';
  if (d === 1) return 'se acaba mañana';
  return `se acaba en ~${d} días`;
}

export function ShoppingListPage() {
  const products = useProducts();
  const categories = useCategories();
  const units = useUnits();
  const manualItems = useManualItems();
  const events = useHistory(1000);
  const [now] = useState(() => Date.now());
  const [newName, setNewName] = useState('');

  // Reposición predictiva: productos que se agotarán pronto por su ritmo de
  // consumo, aunque todavía no estén bajo mínimo.
  const upcoming = useMemo(
    () => productsRunningLow(products, events, now),
    [products, events, now],
  );

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u.abbreviation])), [units]);

  // Sección automática: derivada en vivo de los productos bajo mínimo, agrupada
  // por categoría. No se persiste, así que siempre está sincronizada.
  const autoGroups = useMemo(() => {
    const toRestock = productsToRestock(products).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );
    const map = new Map<string, Product[]>();
    for (const p of toRestock) {
      const key = p.categoryId ?? NO_CATEGORY;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [products]);

  const autoCount = useMemo(() => productsToRestock(products).length, [products]);
  const pendingManual = manualItems.filter((i) => !i.checked);
  const checkedManual = manualItems.filter((i) => i.checked);

  const addManual = () => {
    const name = newName.trim();
    if (!name) return;
    void shoppingListService.addManual({ name });
    setNewName('');
  };

  const isEmpty = autoCount === 0 && manualItems.length === 0 && upcoming.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl">Lista de la compra</h1>
        <span className="text-sm text-muted">{autoCount + pendingManual.length}</span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addManual()}
          placeholder="Añadir a la lista…"
          aria-label="Añadir elemento a la lista"
        />
        <Button onClick={addManual} disabled={!newName.trim()}>
          <Plus size={18} aria-hidden="true" />
          Añadir
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ReceiptScanner />
        <VoiceAdd />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={ShoppingCart}
          title="Tu lista está vacía"
          description="Los productos aparecen aquí solos cuando bajan de su stock mínimo. También puedes añadir cosas a mano."
        />
      ) : null}

      {autoCount > 0 ? (
        <section aria-label="Por reponer" className="space-y-3">
          <h2 className="text-sm font-medium text-text">
            Por reponer <span className="text-muted">· {autoCount}</span>
          </h2>
          {autoGroups.map(([categoryId, items]) => (
            <div key={categoryId} className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted">
                {categoryId === NO_CATEGORY ? 'Sin categoría' : categoryById.get(categoryId)}
              </p>
              <ul className="space-y-2">
                {items.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-text">{p.name}</span>
                      <span className="text-xs text-muted">
                        Comprar ×{suggestedBuyQuantity(p)}
                        {p.unitId ? ` ${unitById.get(p.unitId) ?? ''}` : ''} · quedan {p.quantity}
                      </span>
                    </span>
                    <IconButton
                      icon={Check}
                      label={`Marcar ${p.name} como comprado`}
                      variant="solid"
                      onClick={() => void shoppingListService.buyProduct(p.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section aria-label="Se agotará pronto" className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-text">
            <Clock size={15} aria-hidden="true" className="text-warning" />
            Se agotará pronto <span className="text-muted">· {upcoming.length}</span>
          </h2>
          <ul className="space-y-2">
            {upcoming.map(({ product: p, prediction }) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-text">{p.name}</span>
                  <span className="text-xs text-muted">
                    {describeDaysLeft(prediction.daysLeft)} · quedan {p.quantity}
                    {p.unitId ? ` ${unitById.get(p.unitId) ?? ''}` : ''}
                  </span>
                </span>
                <IconButton
                  icon={Check}
                  label={`Marcar ${p.name} como comprado`}
                  variant="solid"
                  onClick={() => void shoppingListService.buyProduct(p.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {manualItems.length > 0 ? (
        <section aria-label="Añadidos a mano" className="space-y-2">
          <h2 className="text-sm font-medium text-text">Añadidos a mano</h2>
          <ul className="space-y-2">
            {pendingManual.map((item) => (
              <ManualRow key={item.id} item={item} unitById={unitById} />
            ))}
          </ul>

          {checkedManual.length > 0 ? (
            <div className="space-y-2 pt-1">
              <ul className="space-y-2">
                {checkedManual.map((item) => (
                  <ManualRow key={item.id} item={item} unitById={unitById} />
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void shoppingListService.clearChecked()}
                className="text-sm text-muted hover:text-text"
              >
                Limpiar comprados ({checkedManual.length})
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

interface ManualRowProps {
  item: ShoppingListItem;
  unitById: Map<string, string>;
}

function ManualRow({ item, unitById }: ManualRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={item.checked ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`}
        onClick={() => void shoppingListService.toggleChecked(item.id)}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors',
          item.checked ? 'border-transparent bg-primary text-primary-fg' : 'border-border',
        )}
      >
        {item.checked ? <Check size={14} aria-hidden="true" /> : null}
      </button>
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          item.checked ? 'text-muted line-through' : 'text-text',
        )}
      >
        {item.name}
        {item.quantity ? (
          <span className="ml-1.5 text-xs text-muted">
            ×{item.quantity}
            {item.unitId ? ` ${unitById.get(item.unitId) ?? ''}` : ''}
          </span>
        ) : null}
      </span>
      <IconButton
        icon={Trash2}
        label={`Eliminar ${item.name}`}
        size="sm"
        onClick={() => void shoppingListService.removeManual(item.id)}
        className="text-danger"
      />
    </li>
  );
}
