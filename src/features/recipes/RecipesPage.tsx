import { useState } from 'react';
import { ChefHat, Sparkles, Utensils } from 'lucide-react';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { normalizeText } from '@/domain/inventory/inventory-view';
import { recipeService } from '@/services/recipe/recipe.service';
import { type SuggestedRecipe } from '@/services/recipe/suggest.service';
import { toast } from '@/stores/toast.store';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { useRecipes } from './hooks/useRecipes';
import { RecipeEditorSheet } from './components/RecipeEditorSheet';
import { RecipeChatSheet } from './components/RecipeChatSheet';

export function RecipesPage() {
  const recipes = useRecipes();
  const products = useProducts();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  // Cambia en cada apertura para forzar el remontaje (reset) del editor.
  const [openKey, setOpenKey] = useState(0);

  const [chatOpen, setChatOpen] = useState(false);
  // Fuerza el remontaje (reset) del chat en cada apertura.
  const [chatKey, setChatKey] = useState(0);

  const openChat = () => {
    const items = products.filter((p) => p.quantity > 0).map((p) => p.name);
    if (items.length === 0) {
      toast('No tienes productos en stock para sugerir recetas', 'default');
      return;
    }
    setChatKey((k) => k + 1);
    setChatOpen(true);
  };

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

  // Guarda una sugerencia como receta, emparejando ingredientes con el inventario.
  const saveSuggestion = async (s: SuggestedRecipe) => {
    const findProduct = (ingName: string) => {
      const n = normalizeText(ingName);
      return products.find((p) => {
        const pn = normalizeText(p.name);
        return pn === n || pn.includes(n) || n.includes(pn);
      });
    };
    const ingredients = s.ingredientes
      .map((i) => findProduct(i.nombre))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ productId: p.id, quantity: 1, unitId: p.unitId }));
    const missing = s.ingredientes.filter((i) => !findProduct(i.nombre)).map((i) => i.nombre);
    const description = [s.pasos.join('\n'), missing.length ? `Faltan: ${missing.join(', ')}` : '']
      .filter(Boolean)
      .join('\n\n');

    await recipeService.create({ name: s.nombre, description, ingredients });
    toast(`Receta guardada: ${s.nombre}`, 'success');
  };

  const chatItems = products.filter((p) => p.quantity > 0).map((p) => p.name);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl">Recetas</h1>
        <span className="text-sm text-muted">{recipes.length}</span>
      </div>

      {products.length > 0 ? (
        <Button variant="secondary" className="w-full" onClick={openChat}>
          <Sparkles size={18} aria-hidden="true" />
          Chef IA · recetas con lo que tengo
        </Button>
      ) : null}

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
        key={`editor-${openKey}`}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        recipe={editing}
      />

      <RecipeChatSheet
        key={`chat-${chatKey}`}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        items={chatItems}
        onSave={saveSuggestion}
      />
    </div>
  );
}
