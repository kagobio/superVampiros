import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  CalendarX2,
  Clock,
  PackageX,
  ShoppingCart,
  Tags,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { computeStats } from '@/domain/inventory/inventory-stats';
import {
  spendSummary,
  topConsumed,
  topPurchased,
  type RankedItem,
  type SpendSummary,
} from '@/domain/statistics/statistics';
import { formatEur } from '@/lib/money';
import { cn } from '@/lib/cn';
import { Stat } from '@/components/ui/Stat';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSettings } from '@/hooks/useSettings';
import { useCategories } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { useHistory } from '@/features/history/hooks/useHistory';

export function StatisticsPage() {
  const products = useProducts();
  const categories = useCategories();
  const settings = useSettings();
  const events = useHistory(1000);
  const [now] = useState(() => Date.now());

  const stats = useMemo(
    () => computeStats(products, now, settings.expirySoonDays),
    [products, now, settings.expirySoonDays],
  );
  const consumed = useMemo(() => topConsumed(events), [events]);
  const purchased = useMemo(() => topPurchased(events), [events]);
  const spend = useMemo(() => spendSummary(events, now), [events, now]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          to="/mas"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl">Estadísticas</h1>
      </div>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Productos" value={stats.total} icon={Boxes} />
        <Stat label="Categorías" value={categories.length} icon={Tags} />
        <Stat label="Para comprar" value={stats.toBuy} icon={ShoppingCart} tone="primary" />
        <Stat label="Agotados" value={stats.outOfStock} icon={PackageX} tone="danger" />
        <Stat label="Caducan pronto" value={stats.expiringSoon} icon={Clock} tone="warning" />
        <Stat label="Caducados" value={stats.expired} icon={CalendarX2} tone="danger" />
      </section>

      <SpendSection spend={spend} />

      <RankSection title="Más consumidos" items={consumed} format={(n) => `${n} uds`} />
      <RankSection title="Más comprados" items={purchased} format={(n) => `${n} uds`} />
    </div>
  );
}

function SpendSection({ spend }: { spend: SpendSummary }) {
  const hasData = spend.months.some((m) => m.total > 0) || spend.topThisMonth.length > 0;
  const max = Math.max(...spend.months.map((m) => m.total), 0);
  const diff = spend.thisMonth - spend.lastMonth;
  const pct = spend.lastMonth > 0 ? Math.round((diff / spend.lastMonth) * 100) : null;

  return (
    <section aria-label="Gasto" className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-sm font-medium text-text">
        <Wallet size={16} aria-hidden="true" className="text-primary" />
        Gasto
      </h2>

      {!hasData ? (
        <EmptyState
          icon={Wallet}
          title="Todavía sin gasto"
          description="Añade el precio a tus productos y márcalos como comprados para ver cuánto gastas al mes."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs text-muted">Este mes</p>
              <p className="font-display text-3xl text-text tabular-nums">
                {formatEur(spend.thisMonth)}
              </p>
            </div>
            {pct !== null ? (
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  diff > 0 ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success',
                )}
              >
                {diff > 0 ? (
                  <TrendingUp size={13} aria-hidden="true" />
                ) : (
                  <TrendingDown size={13} aria-hidden="true" />
                )}
                {Math.abs(pct)}%
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-end justify-between gap-1.5" style={{ height: 76 }}>
            {spend.months.map((m, i) => {
              const isCurrent = i === spend.months.length - 1;
              const h = max > 0 ? Math.round((m.total / max) * 60) : 0;
              return (
                <div key={m.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      title={`${m.label}: ${formatEur(m.total)}`}
                      className={cn(
                        'w-full max-w-8 rounded-md',
                        isCurrent ? 'bg-primary' : 'bg-surface-2',
                      )}
                      style={{ height: Math.max(h, m.total > 0 ? 3 : 2) }}
                    />
                  </div>
                  <span className={cn('text-[10px]', isCurrent ? 'text-text' : 'text-muted')}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {spend.topThisMonth.length > 0 ? (
        <RankSection title="Más gasto este mes" items={spend.topThisMonth} format={formatEur} />
      ) : null}
    </section>
  );
}

interface RankSectionProps {
  title: string;
  items: RankedItem[];
  format: (total: number) => string;
}

function RankSection({ title, items, format }: RankSectionProps) {
  const max = items.length > 0 ? Math.max(...items.map((i) => i.total)) : 0;

  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="text-sm font-medium text-text">{title}</h2>
      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Todavía sin datos" />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-surface p-3">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-text">{item.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {format(item.total)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: max > 0 ? `${(item.total / max) * 100}%` : '0%' }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
