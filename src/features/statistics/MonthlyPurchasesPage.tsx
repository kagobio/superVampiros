import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Wallet } from 'lucide-react';
import { purchaseMonths, purchasesInMonth } from '@/domain/statistics/statistics';
import { formatEur } from '@/lib/money';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHistory } from '@/features/history/hooks/useHistory';

export function MonthlyPurchasesPage() {
  const events = useHistory(2000);
  const [selected, setSelected] = useState('');

  const months = useMemo(() => purchaseMonths(events), [events]);
  const activeKey = selected && months.some((m) => m.key === selected) ? selected : months[0]?.key;
  const activeMonth = months.find((m) => m.key === activeKey);
  const items = useMemo(
    () => (activeKey ? purchasesInMonth(events, activeKey) : []),
    [events, activeKey],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          to="/mas"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl">Compras por mes</h1>
      </div>

      {months.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Todavía sin compras"
          description="Cuando marques productos como comprados o escanees un ticket, aquí verás lo que compraste cada mes."
        />
      ) : (
        <>
          <Select
            aria-label="Mes"
            value={activeKey ?? ''}
            onChange={(e) => setSelected(e.target.value)}
          >
            {months.map((m) => (
              <option key={m.key} value={m.key}>
                {`${m.label} · ${formatEur(m.total)}`}
              </option>
            ))}
          </Select>

          {activeMonth ? (
            <div className="flex items-end justify-between gap-2 rounded-2xl border border-border bg-surface p-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Wallet size={13} aria-hidden="true" className="text-primary" />
                  Gasto del mes
                </p>
                <p className="font-display text-3xl text-text tabular-nums">
                  {formatEur(activeMonth.total)}
                </p>
              </div>
              <p className="text-xs text-muted">
                {activeMonth.count} compra{activeMonth.count === 1 ? '' : 's'} ·{' '}
                {items.length} producto{items.length === 1 ? '' : 's'}
              </p>
            </div>
          ) : null}

          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-text">{item.name}</span>
                  <span className="text-xs text-muted">
                    ×{item.units}
                    {item.count > 1 ? ` · ${item.count} compras` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-text">
                  {item.cost > 0 ? formatEur(item.cost) : '—'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
