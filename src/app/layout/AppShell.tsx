import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Toaster } from '@/components/ui/Toaster';

/** Estructura común de la app: cabecera + contenido con scroll + navegación. */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster />
    </div>
  );
}
