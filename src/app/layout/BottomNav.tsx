import { NavLink } from 'react-router-dom';
import { Home, Boxes, ShoppingCart, ChefHat, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const items: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/compra', label: 'Compra', icon: ShoppingCart },
  { to: '/recetas', label: 'Recetas', icon: ChefHat },
  { to: '/mas', label: 'Más', icon: Menu },
];

/** Navegación principal (mobile-first). En escritorio se puede migrar a sidebar. */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="sticky bottom-0 z-20 border-t border-border bg-surface/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
