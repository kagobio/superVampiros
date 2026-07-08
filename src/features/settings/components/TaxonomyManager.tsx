import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { DEFAULT_PRODUCT_COLOR } from '@/config/constants';

/** Vista mínima común a cualquier taxonomía gestionable. */
export interface TaxonomyItemVM {
  id: string;
  name: string;
  color?: string | null;
  abbreviation?: string | null;
}

export interface TaxonomyChanges {
  name?: string;
  color?: string;
  abbreviation?: string;
}

interface TaxonomyManagerProps {
  items: TaxonomyItemVM[];
  hasColor?: boolean;
  hasAbbreviation?: boolean;
  ordered?: boolean;
  addPlaceholder?: string;
  onCreate: (data: { name: string; color?: string; abbreviation?: string }) => void;
  onUpdate: (id: string, changes: TaxonomyChanges) => void;
  onRemove: (id: string) => void;
  onReorder?: (ids: string[]) => void;
}

/**
 * Gestor genérico de taxonomías: alta, renombrado, recoloreado, borrado y
 * reordenado (subir/bajar). Se reutiliza para categorías, ubicaciones, unidades
 * y etiquetas, evitando duplicar la misma UI cuatro veces.
 */
export function TaxonomyManager({
  items,
  hasColor = false,
  hasAbbreviation = false,
  ordered = false,
  addPlaceholder = 'Nuevo…',
  onCreate,
  onUpdate,
  onRemove,
  onReorder,
}: TaxonomyManagerProps) {
  const [newName, setNewName] = useState('');
  const [newAbbrev, setNewAbbrev] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_PRODUCT_COLOR);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAbbrev, setEditAbbrev] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_PRODUCT_COLOR);

  const submitNew = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate({
      name,
      color: hasColor ? newColor : undefined,
      abbreviation: hasAbbreviation ? newAbbrev.trim() : undefined,
    });
    setNewName('');
    setNewAbbrev('');
    setNewColor(DEFAULT_PRODUCT_COLOR);
  };

  const startEdit = (item: TaxonomyItemVM) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAbbrev(item.abbreviation ?? '');
    setEditColor(item.color ?? DEFAULT_PRODUCT_COLOR);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (name) {
      onUpdate(editingId, {
        name,
        color: hasColor ? editColor : undefined,
        abbreviation: hasAbbreviation ? editAbbrev.trim() : undefined,
      });
    }
    setEditingId(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    if (!onReorder) return;
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((i) => i.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    onReorder(ids);
  };

  return (
    <div className="space-y-3">
      {/* Alta rápida */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3">
        <div className="min-w-40 flex-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={addPlaceholder}
            onKeyDown={(e) => e.key === 'Enter' && submitNew()}
            aria-label="Nombre nuevo"
          />
        </div>
        {hasAbbreviation ? (
          <div className="w-24">
            <Input
              value={newAbbrev}
              onChange={(e) => setNewAbbrev(e.target.value)}
              placeholder="Abrev."
              aria-label="Abreviatura"
            />
          </div>
        ) : null}
        <Button onClick={submitNew} disabled={!newName.trim()}>
          <Plus size={18} aria-hidden="true" />
          Añadir
        </Button>
        {hasColor ? <ColorPicker value={newColor} onChange={setNewColor} /> : null}
      </div>

      {/* Lista */}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-xl border border-border bg-surface px-3 py-2">
            {editingId === item.id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Editar nombre"
                    autoFocus
                  />
                  {hasAbbreviation ? (
                    <div className="w-24">
                      <Input
                        value={editAbbrev}
                        onChange={(e) => setEditAbbrev(e.target.value)}
                        aria-label="Editar abreviatura"
                      />
                    </div>
                  ) : null}
                  <IconButton icon={Check} label="Guardar" variant="solid" onClick={saveEdit} />
                  <IconButton icon={X} label="Cancelar" onClick={() => setEditingId(null)} />
                </div>
                {hasColor ? <ColorPicker value={editColor} onChange={setEditColor} /> : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {hasColor ? (
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color ?? DEFAULT_PRODUCT_COLOR }}
                  />
                ) : null}
                <span className="min-w-0 flex-1 truncate text-text">
                  {item.name}
                  {item.abbreviation ? (
                    <span className="ml-1.5 text-xs text-muted">({item.abbreviation})</span>
                  ) : null}
                </span>
                {ordered ? (
                  <>
                    <IconButton
                      icon={ArrowUp}
                      label={`Subir ${item.name}`}
                      size="sm"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                    />
                    <IconButton
                      icon={ArrowDown}
                      label={`Bajar ${item.name}`}
                      size="sm"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                    />
                  </>
                ) : null}
                <IconButton
                  icon={Pencil}
                  label={`Editar ${item.name}`}
                  size="sm"
                  onClick={() => startEdit(item)}
                />
                <IconButton
                  icon={Trash2}
                  label={`Eliminar ${item.name}`}
                  size="sm"
                  onClick={() => onRemove(item.id)}
                  className="text-danger"
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
