import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Pack } from '@/domain/pack/pack.types';
import { packService } from '@/services/pack/pack.service';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { ProductLinesEditor, type ProductLine } from '@/components/ui/ProductLinesEditor';
import { useUnits } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';

interface PackEditorSheetProps {
  open: boolean;
  onClose: () => void;
  pack: Pack | null;
}

export function PackEditorSheet({ open, onClose, pack }: PackEditorSheetProps) {
  const products = useProducts();
  const units = useUnits();
  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u.abbreviation])), [units]);

  // Estado inicializado desde el pack; el padre remonta (vía `key`) en cada apertura.
  const [name, setName] = useState(pack?.name ?? '');
  const [lines, setLines] = useState<ProductLine[]>(pack?.items ?? []);

  const isEdit = pack !== null;

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload = { name, items: lines };
    if (isEdit) await packService.update(pack.id, payload);
    else await packService.create(payload);
    onClose();
  };

  const handleDelete = async () => {
    if (pack) {
      await packService.remove(pack.id);
      onClose();
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar pack' : 'Nuevo pack'}
      footer={
        <div className="flex items-center gap-2">
          {isEdit ? (
            <Button variant="ghost" onClick={handleDelete} className="text-danger">
              <Trash2 size={18} aria-hidden="true" />
              Eliminar
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={!name.trim()} className="ml-auto">
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre">
          {({ id }) => (
            <Input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Compra Mercadona"
              autoFocus
            />
          )}
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-text">Productos del pack</p>
          <ProductLinesEditor
            value={lines}
            onChange={setLines}
            products={products}
            unitById={unitById}
            addLabel="Añadir producto…"
          />
        </div>
      </div>
    </Sheet>
  );
}
