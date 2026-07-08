import { useState } from 'react';
import { ChefHat, Utensils } from 'lucide-react';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { recipeService } from '@/services/recipe/recipe.service';
import { toast } from '@/stores/toast.store';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRecipes } from './hooks/useRecipes';
import { RecipeEditorSheet } from './components/RecipeEditorSheet';

export function RecipesPage() {
  const recipes = useRecipes();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  // Cambia en cada apertura para forzar el remontaje (reset) del editor.
  const [openKey, setOpenKey] = useState(0);

  const openEditor = (recipe: Recipe | null) => {
    setEditing(recipe);
    setOpenKey((k) => k + 1);
    setSheetOpen(true);
  };
  const openCreate = () => openEditor(null);

  const cook = async (recipe: Recipe) => {
    const res = await recipeService.cook(recipe.id);
    if (!res.ok) return;
    if (res.shortages.length > 0) {
      toast(`Cocinado. Faltaba stock de ${res.shortages.length} ingrediente(s)`, 'warning');
    } else {
      toast('¡Cocinado! Ingredientes descontados', 'success');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl">Recetas</h1>
        <span className="text-sm text-muted">{recipes.length}</span>
      </div>

      {recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Aún no hay recetas"
          description="Crea una receta con sus ingredientes. Al cocinarla, se descuentan del inventario."
          action={<Button onClick={openCreate}>Crear receta</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {recipes.map((recipe) => (
            <li
              key={recipe.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <button
                type="button"
                onClick={() => openEditor(recipe)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="flex items-center gap-2">
                  <Utensils size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate font-medium text-text">{recipe.name}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {recipe.ingredients.length} ingrediente
                  {recipe.ingredients.length === 1 ? '' : 's'}
                  {recipe.servings ? ` · ${recipe.servings} raciones` : ''}
                </span>
              </button>
              <Button
                size="sm"
                onClick={() => cook(recipe)}
                disabled={recipe.ingredients.length === 0}
              >
                <ChefHat size={16} aria-hidden="true" />
                He cocinado
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Fab onClick={openCreate} label="Crear receta" />

      <RecipeEditorSheet
        key={openKey}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        recipe={editing}
      />
    </div>
  );
}
