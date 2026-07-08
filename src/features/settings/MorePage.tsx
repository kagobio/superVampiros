import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Clock,
  Download,
  Heart,
  Package2,
  Settings,
  ShoppingBasket,
  Tags,
  type LucideIcon,
} from 'lucide-react';
import { useFiltersStore } from '@/stores/filters.store';

interface Item {
  icon: LucideIcon;
  label: string;
  description: string;
  to?: string;
  onClick?: () => void;
  ready?: boolean;
}

export function MorePage() {
  const navigate = useNavigate();
  const applyPreset = useFiltersStore((s) => s.applyPreset);

  const items: Item[] = [
    {
      to: '/ajustes/taxonomias',
      icon: Tags,
      label: 'Categorías, ubicaciones y unidades',
      description: 'Crea, edita, reordena y elimina tus taxonomías.',
      ready: true,
    },
    {
      icon: Heart,
      label: 'Favoritos',
      description: 'Tus productos marcados como favoritos.',
      ready: true,
      onClick: () => {
        applyPreset({ quick: ['favorites'] });
        navigate('/inventario');
      },
    },
    {
      to: '/estadisticas',
      icon: Package2,
      label: 'Estadísticas',
      description: 'Consumo, compras y estado del inventario.',
      ready: true,
    },
    {
      to: '/historial',
      icon: Clock,
      label: 'Historial',
      description: 'Registro de toda la actividad.',
      ready: true,
    },
    {
      to: '/packs',
      icon: ShoppingBasket,
      label: 'Packs',
      description: 'Compras recurrentes que añades de un toque.',
      ready: true,
    },
    { icon: Download, label: 'Importar / Exportar', description: 'JSON y CSV. (Fase 6)' },
    { icon: Settings, label: 'Ajustes', description: 'Preferencias generales. (Fase 6)' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">Más</h1>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          const content = (
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-primary">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-text">{item.label}</span>
                <span className="block truncate text-xs text-muted">{item.description}</span>
              </span>
              <ChevronRight size={18} className="text-muted" aria-hidden="true" />
            </span>
          );
          const cardClass =
            'block w-full rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-2';

          return (
            <li key={`${item.label}-${i}`}>
              {item.to ? (
                <Link to={item.to} className={cardClass}>
                  {content}
                </Link>
              ) : item.onClick ? (
                <button type="button" onClick={item.onClick} className={cardClass}>
                  {content}
                </button>
              ) : (
                <div className="block rounded-2xl border border-border bg-surface p-3 opacity-60">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
