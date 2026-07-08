import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Boxes, CalendarX2, Clock, PackageX, ShoppingCart, Tags } from 'lucide-react';
import { computeStats } from '@/domain/inventory/inventory-stats';
import { topConsumed, topPurchased, type RankedItem } from '@/domain/statistics/statistics';
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

      <RankSection title="Más consumidos" items={consumed} unit="uds" />
      <RankSection title="Más comprados" items={purchased} unit="uds" />
    </div>
  );
}

interface RankSectionProps {
  title: string;
  items: RankedItem[];
  unit: string;
}

function RankSection({ title, items, unit }: RankSectionProps) {
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
                  {item.total} {unit}
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
