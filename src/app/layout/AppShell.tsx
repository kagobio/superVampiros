import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Toaster } from '@/components/ui/Toaster';

/** Estructura común de la app: cabecera + contenido con scroll + navegación. */
export function AppShell() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Al cambiar de ruta, lleva el foco al contenido principal para que lectores
  // de pantalla y usuarios de teclado sepan que la página ha cambiado.
  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Saltar al contenido
      </a>
      <Header />
      <main
        id="contenido"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 outline-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.15 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <Toaster />
    </div>
  );
}
