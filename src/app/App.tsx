import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { applyTheme, useThemeStore } from '@/stores/theme.store';
import { ensureSeeded } from '@/services/bootstrap/seed.service';

export function App() {
  const preference = useThemeStore((s) => s.preference);

  // Aplica el tema y siembra los datos iniciales al arrancar.
  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    void ensureSeeded();
  }, []);

  return <RouterProvider router={router} />;
}
