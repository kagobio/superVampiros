import { NavLink } from 'react-router-dom';
import { Home, Boxes, ShoppingCart, ChefHat, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
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
  const reduce = useReducedMotion();

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
                  'relative flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Pastilla compartida que se desliza entre pestañas al navegar. */}
                  {isActive ? (
                    <motion.span
                      layoutId="nav-active-pill"
                      aria-hidden="true"
                      className="absolute inset-x-2 inset-y-1 -z-10 rounded-2xl bg-primary/15 ring-1 ring-inset ring-primary/25"
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 500, damping: 38, mass: 0.7 }
                      }
                    />
                  ) : null}
                  <motion.span
                    aria-hidden="true"
                    animate={reduce ? undefined : { scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }}
                    transition={
                      reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 20, mass: 0.6 }
                    }
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} aria-hidden="true" />
                  </motion.span>
                  <span className={isActive ? 'font-semibold' : undefined}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
