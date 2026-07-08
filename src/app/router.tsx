import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { ShoppingListPage } from '@/features/shopping-list/ShoppingListPage';
import { RecipesPage } from '@/features/recipes/RecipesPage';
import { MorePage } from '@/features/settings/MorePage';
import { TaxonomySettingsPage } from '@/features/settings/TaxonomySettingsPage';
import { HistoryPage } from '@/features/history/HistoryPage';
import { StatisticsPage } from '@/features/statistics/StatisticsPage';
import { PacksPage } from '@/features/packs/PacksPage';
import { NotFoundPage } from '@/components/ui/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'inventario', element: <InventoryPage /> },
      { path: 'compra', element: <ShoppingListPage /> },
      { path: 'recetas', element: <RecipesPage /> },
      { path: 'mas', element: <MorePage /> },
      { path: 'ajustes/taxonomias', element: <TaxonomySettingsPage /> },
      { path: 'historial', element: <HistoryPage /> },
      { path: 'estadisticas', element: <StatisticsPage /> },
      { path: 'packs', element: <PacksPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
