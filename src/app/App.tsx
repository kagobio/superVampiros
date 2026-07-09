import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { applyTheme, useThemeStore } from '@/stores/theme.store';
import { ensureSeeded } from '@/services/bootstrap/seed.service';
import { isSyncConfigured } from '@/config/env';
import { useSyncStore } from '@/stores/sync.store';
import { connectSync } from '@/persistence/sync';

export function App() {
  const preference = useThemeStore((s) => s.preference);

  // Aplica el tema y siembra los datos iniciales al arrancar.
  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    void ensureSeeded();
  }, []);

  // Reconecta la sincronización si estaba activada.
  useEffect(() => {
    const { enabled, householdKey } = useSyncStore.getState();
    if (isSyncConfigured && enabled && householdKey) void connectSync(householdKey);
  }, []);

  return <RouterProvider router={router} />;
}
