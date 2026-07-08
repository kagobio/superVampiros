import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { recipeService } from '@/services/recipe/recipe.service';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { ProductLinesEditor, type ProductLine } from '@/components/ui/ProductLinesEditor';
import { useUnits } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';

interface RecipeEditorSheetProps {
  open: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

export function RecipeEditorSheet({ open, onClose, recipe }: RecipeEditorSheetProps) {
  const products = useProducts();
  const units = useUnits();
  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u.abbreviation])), [units]);

  // El estado se inicializa desde la receta; el padre remonta este componente
  // (vía `key`) en cada apertura, por lo que no hace falta sincronizar con efecto.
  const [name, setName] = useState(recipe?.name ?? '');
  const [servings, setServings] = useState(recipe?.servings != null ? String(recipe.servings) : '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [lines, setLines] = useState<ProductLine[]>(recipe?.ingredients ?? []);

  const isEdit = recipe !== null;

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload = {
      name,
      description,
      servings: servings === '' ? null : Number(servings),
      ingredients: lines,
    };
    if (isEdit) await recipeService.update(recipe.id, payload);
    else await recipeService.create(payload);
    onClose();
  };

  const handleDelete = async () => {
    if (recipe) {
      await recipeService.remove(recipe.id);
      onClose();
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar receta' : 'Nueva receta'}
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
              placeholder="Pasta carbonara"
              autoFocus
            />
          )}
        </Field>

        <Field label="Raciones">
          {({ id }) => (
            <div className="w-24">
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={0}
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="—"
              />
            </div>
          )}
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-text">Ingredientes</p>
          <ProductLinesEditor
            value={lines}
            onChange={setLines}
            products={products}
            unitById={unitById}
            addLabel="Añadir ingrediente…"
          />
        </div>

        <Field label="Notas">
          {({ id }) => (
            <TextArea
              id={id}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pasos o comentarios…"
            />
          )}
        </Field>
      </div>
    </Sheet>
  );
}
