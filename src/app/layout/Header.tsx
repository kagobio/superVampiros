import { Moon, Sun } from 'lucide-react';
import { resolveTheme, useThemeStore } from '@/stores/theme.store';
import { APP_NAME } from '@/config/constants';
import { Logo } from '@/components/ui/Logo';

/** Cabecera con el logotipo y el conmutador de tema. */
export function Header() {
  const preference = useThemeStore((s) => s.preference);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = resolveTheme(preference) === 'dark';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2.5">
          <Logo className="text-primary" />
          <span className="font-display text-lg tracking-tight text-text">{APP_NAME}</span>
        </a>
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
