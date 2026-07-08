import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PackagePlus, ShoppingBasket } from 'lucide-react';
import type { Pack } from '@/domain/pack/pack.types';
import { packService } from '@/services/pack/pack.service';
import { toast } from '@/stores/toast.store';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePacks } from './hooks/usePacks';
import { PackEditorSheet } from './components/PackEditorSheet';

export function PacksPage() {
  const packs = usePacks();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Pack | null>(null);
  const [openKey, setOpenKey] = useState(0);

  const openEditor = (pack: Pack | null) => {
    setEditing(pack);
    setOpenKey((k) => k + 1);
    setSheetOpen(true);
  };
  const openCreate = () => openEditor(null);

  const apply = async (pack: Pack) => {
    const ok = await packService.apply(pack.id);
    if (ok) toast(`"${pack.name}" añadido al inventario`, 'success');
  };

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
        <h1 className="flex-1 text-2xl">Packs</h1>
        <span className="text-sm text-muted">{packs.length}</span>
      </div>

      {packs.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Aún no hay packs"
          description="Crea un pack con tus compras recurrentes y añádelas todas al inventario de un toque."
          action={<Button onClick={openCreate}>Crear pack</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {packs.map((pack) => (
            <li
              key={pack.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <button
                type="button"
                onClick={() => openEditor(pack)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBasket size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate font-medium text-text">{pack.name}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {pack.items.length} producto{pack.items.length === 1 ? '' : 's'}
                </span>
              </button>
              <Button size="sm" onClick={() => apply(pack)} disabled={pack.items.length === 0}>
                <PackagePlus size={16} aria-hidden="true" />
                Añadir
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={openCreate} label="Crear pack" />

      <PackEditorSheet
        key={openKey}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        pack={editing}
      />
    </div>
  );
}
