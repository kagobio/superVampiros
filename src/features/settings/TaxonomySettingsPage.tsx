import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  categoryService,
  locationService,
  tagService,
  unitService,
} from '@/services/taxonomy/taxonomy.service';
import { useCategories, useLocations, useTags, useUnits } from '@/hooks/useTaxonomies';
import { cn } from '@/lib/cn';
import { TaxonomyManager } from './components/TaxonomyManager';

type Tab = 'categories' | 'locations' | 'units' | 'tags';

const TABS: { id: Tab; label: string }[] = [
  { id: 'categories', label: 'Categorías' },
  { id: 'locations', label: 'Ubicaciones' },
  { id: 'units', label: 'Unidades' },
  { id: 'tags', label: 'Etiquetas' },
];

export function TaxonomySettingsPage() {
  const [tab, setTab] = useState<Tab>('categories');
  const categories = useCategories();
  const locations = useLocations();
  const units = useUnits();
  const tags = useTags();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          to="/mas"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl">Categorías y más</h1>
      </div>

      <div role="tablist" aria-label="Tipo de taxonomía" className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1.5 text-sm transition-colors',
              tab === t.id ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-surface-2',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'categories' ? (
        <TaxonomyManager
          items={categories}
          hasColor
          ordered
          addPlaceholder="Nueva categoría…"
          onCreate={({ name, color }) =>
            void categoryService.create({ name, icon: 'tag', color: color! })
          }
          onUpdate={(id, changes) => void categoryService.update(id, changes)}
          onRemove={(id) => void categoryService.remove(id)}
          onReorder={(ids) => void categoryService.reorder(ids)}
        />
      ) : tab === 'locations' ? (
        <TaxonomyManager
          items={locations}
          hasColor
          ordered
          addPlaceholder="Nueva ubicación…"
          onCreate={({ name, color }) =>
            void locationService.create({ name, icon: 'map-pin', color: color! })
          }
          onUpdate={(id, changes) => void locationService.update(id, changes)}
          onRemove={(id) => void locationService.remove(id)}
          onReorder={(ids) => void locationService.reorder(ids)}
        />
      ) : tab === 'units' ? (
        <TaxonomyManager
          items={units}
          hasAbbreviation
          ordered
          addPlaceholder="Nueva unidad…"
          onCreate={({ name, abbreviation }) =>
            void unitService.create({ name, abbreviation: abbreviation ?? '' })
          }
          onUpdate={(id, changes) => void unitService.update(id, changes)}
          onRemove={(id) => void unitService.remove(id)}
          onReorder={(ids) => void unitService.reorder(ids)}
        />
      ) : (
        <TaxonomyManager
          items={tags}
          hasColor
          addPlaceholder="Nueva etiqueta…"
          onCreate={({ name, color }) => void tagService.create({ name, color: color! })}
          onUpdate={(id, changes) => void tagService.update(id, changes)}
          onRemove={(id) => void tagService.remove(id)}
        />
      )}
    </div>
  );
}
