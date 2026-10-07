import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Boxes,
  CalendarX2,
  Clock,
  PackageOpen,
  PackageX,
  ShoppingCart,
  Sparkles,
  Star,
  ChevronRight,
} from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import { computeStats } from '@/domain/inventory/inventory-stats';
import type { InventoryFilters } from '@/domain/inventory/inventory-view';
import { Stat } from '@/components/ui/Stat';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useFiltersStore } from '@/stores/filters.store';
import { useSettings } from '@/hooks/useSettings';
import { useProducts } from '@/features/inventory/hooks/useProducts';

export function DashboardPage() {
  const products = useProducts();
  const settings = useSettings();
  const applyPreset = useFiltersStore((s) => s.applyPreset);
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [now] = useState(() => Date.now());

  const stats = useMemo(
    () => computeStats(products, now, settings.expirySoonDays),
    [products, now, settings.expirySoonDays],
  );

  const recent = useMemo(
    () => [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [products],
  );

  /** Aplica un preset de filtros y salta al inventario. */
  const goToInventory = (preset: Partial<InventoryFilters>) => {
    applyPreset(preset);
    navigate('/inventario');
  };

  if (products.length === 0) {
    return (
      <div className="space-y-5">
        <header className="space-y-1">
          <h1 className="text-[1.75rem]">Inicio</h1>
          <p className="text-sm text-muted">Tu despensa, de un vistazo.</p>
        </header>
        <EmptyState
          icon={PackageOpen}
          title="Tu despensa está vacía"
          description="Añade productos en el inventario y aquí verás el resumen de un vistazo."
          action={<Button onClick={() => navigate('/inventario')}>Ir al inventario</Button>}
        />
      </div>
    );
  }

  const statCards = [
    { label: 'Productos', value: stats.total, icon: Boxes, onClick: () => goToInventory({}) },
    {
      label: 'Para comprar',
      value: stats.toBuy,
      icon: ShoppingCart,
      tone: 'primary' as const,
      onClick: () => goToInventory({ quick: ['toBuy'] }),
    },
    {
      label: 'Agotados',
      value: stats.outOfStock,
      icon: PackageX,
      tone: 'danger' as const,
      onClick: () => goToInventory({ quick: ['out'] }),
    },
    {
      label: 'Caducan pronto',
      value: stats.expiringSoon,
      icon: Clock,
      tone: 'warning' as const,
      onClick: () => goToInventory({ expiryWindow: 'soon' }),
    },
    {
      label: 'Caducados',
      value: stats.expired,
      icon: CalendarX2,
      tone: 'danger' as const,
      onClick: () => goToInventory({ expiryWindow: 'expired' }),
    },
    {
      label: 'Favoritos',
      value: stats.favorites,
      icon: Star,
      tone: 'warning' as const,
      onClick: () => goToInventory({ quick: ['favorites'] }),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-[2.1rem] leading-[1.05]">
          Hola, <span className="text-gradient-primary">a cocinar</span>
        </h1>
        <p className="text-sm text-muted">
          {stats.total} {stats.total === 1 ? 'producto' : 'productos'} en tu despensa.
        </p>
      </header>

      <motion.section
        aria-label="Resumen"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
        initial={reduce ? false : 'hidden'}
        animate={reduce ? undefined : 'show'}
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            className="h-full w-full"
            variants={{
              hidden: { opacity: 0, y: 14, scale: 0.97 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 460, damping: 32, mass: 0.6 },
              },
            }}
          >
            <Stat
              label={s.label}
              value={s.value}
              icon={s.icon}
              tone={s.tone}
              onClick={s.onClick}
            />
          </motion.div>
        ))}
      </motion.section>

      {recent.length > 0 ? (
        <section aria-label="Añadidos recientemente" className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Sparkles size={16} aria-hidden="true" />
            <h2 className="text-sm font-medium text-text">Añadidos recientemente</h2>
          </div>
          <ul className="space-y-1.5">
            {recent.map((p: Product) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => navigate('/inventario')}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-2.5 pr-2 text-left transition-[transform,background-color,border-color] hover:border-primary/30 hover:bg-surface-2 active:scale-[0.99] motion-reduce:active:scale-100"
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: p.color || 'var(--primary)' }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-text">{p.name}</span>
                  <span className="text-sm tabular-nums text-muted">{p.quantity}</span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-muted/60 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
