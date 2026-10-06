import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChefHat, Sparkles, Utensils } from 'lucide-react';
import type { Recipe } from '@/domain/recipe/recipe.types';
import { recipeService } from '@/services/recipe/recipe.service';
import { matchIngredientsToProducts } from '@/services/recipe/ingredient-match';
import { type SuggestedRecipe } from '@/services/recipe/suggest.service';
import { toast } from '@/stores/toast.store';
import { AnimatePresence } from 'framer-motion';
import { Fab } from '@/components/ui/Fab';
import { Button } from '@/components/ui/Button';
import { AnimatedListItem } from '@/components/ui/AnimatedListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { useRecipes } from './hooks/useRecipes';
import { RecipeEditorSheet } from './components/RecipeEditorSheet';
import { RecipeChatSheet } from './components/RecipeChatSheet';

export function RecipesPage() {
  const navigate = useNavigate();
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
    const { ingredients, missing } = matchIngredientsToProducts(
      s.ingredientes.map((i) => i.nombre),
      products,
    );
    const description = [s.pasos.join('\n'), missing.length ? `Faltan: ${missing.join(', ')}` : '']
      .filter(Boolean)
      .join('\n\n');

    await recipeService.create({ name: s.nombre, description, ingredients });
    toast(`Receta guardada: ${s.nombre}`, 'success');
  };

  const chatItems = products.filter((p) => p.quantity > 0).map((p) => p.name);

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.75rem]">Recetas</h1>
          <p className="text-sm text-muted">Tus recetas y qué cocinar con lo que tienes.</p>
        </div>
        {recipes.length > 0 ? (
          <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted">
            {recipes.length}
          </span>
        ) : null}
      </header>

      {products.length > 0 ? (
        <Button variant="secondary" className="w-full" onClick={openChat}>
          <Sparkles size={18} aria-hidden="true" />
          Chef IA · recetas con lo que tengo
        </Button>
      ) : null}

      <Button variant="secondary" className="w-full" onClick={() => navigate('/recetas/menus')}>
        <CalendarDays size={18} aria-hidden="true" />
        Menús semanales
      </Button>

      {recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Aún no hay recetas"
          description="Crea una receta con sus ingredientes. Al cocinarla, se descuentan del inventario."
          action={<Button onClick={openCreate}>Crear receta</Button>}
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {recipes.map((recipe) => (
              <AnimatedListItem
                key={recipe.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <button
                  type="button"
                  onClick={() => openEditor(recipe)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Utensils size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-text">{recipe.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {recipe.ingredients.length} ingrediente
                      {recipe.ingredients.length === 1 ? '' : 's'}
                      {recipe.servings ? ` · ${recipe.servings} raciones` : ''}
                    </span>
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
              </AnimatedListItem>
            ))}
          </AnimatePresence>
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
