# TASKS.md — 🧛 Alimentos Vampíricos

Backlog priorizado por fases. Se desarrolla **módulo a módulo**: no se abre una
fase nueva sin cerrar (terminar + probar + revisar) la anterior. Leyenda:
`[x]` hecho · `[~]` en curso · `[ ]` pendiente.

> Al terminar cada tarea: `typecheck`, `lint`, `test`, `build` en verde y marcar aquí.

---

## ✅ Fase 0 — Fundaciones  (COMPLETADA)

- [x] Scaffolding Vite + React 19 + TypeScript (strict).
- [x] Stack instalado: React Router, Zustand, RHF, Zod, Dexie + dexie-react-hooks, Framer Motion, Lucide, ULID, TanStack Virtual.
- [x] Tailwind v4 + tokens semánticos (tema claro/oscuro por `data-theme`).
- [x] ESLint (flat) + Prettier (sustituyen a oxlint del scaffold).
- [x] Vitest + Testing Library configurados; primer test de dominio en verde.
- [x] PWA (vite-plugin-pwa) + manifest + logo SVG minimalista.
- [x] Alias `@/*`, scripts npm (dev/build/lint/format/typecheck/test).
- [x] Capa dominio: `Entity` base, ULID, `Clock`, `Result`, tipos de todos los agregados + reglas de producto (stock/caducidad).
- [x] Persistencia: esquema Dexie con índices, `BaseRepository`, `SyncAdapter` stub.
- [x] Servicios base: `HistoryService` (event log), `ensureSeeded` (semillas).
- [x] App shell: layout, Header (con toggle de tema), BottomNav (5 destinos), router, páginas placeholder.
- [x] Primitiva `Button` + `PagePlaceholder`.
- [x] `PROJECT_RULES.md` + `TASKS.md`.

---

## ✅ Fase 1 — Inventario (núcleo)  (COMPLETADA)

**Objetivo:** CRUD de productos + configuración de taxonomías + control rápido de cantidad + búsqueda.

- [x] Zod schema de producto (reutilizable en form + import/export).
- [x] `ProductRepository` (extiende `BaseRepository`) con consultas indexadas.
- [x] `InventoryService`: crear/editar/eliminar, `adjustQuantity`/`setQuantity` (con registro en historial), `toggleFavorite`.
- [x] Servicio genérico `TaxonomyService` para `Category`, `Location`, `Unit`, `Tag` (CRUD + reorder).
- [x] Hooks de lectura reactiva (`useProducts`, `useCategories`, `useSettings`, …) con `useLiveQuery`.
- [x] Primitivas UI: `Stepper` (−/+ inline), `Input`, `TextArea`, `Select`, `Switch`, `Sheet` (bottom sheet, foco atrapado), `IconButton`, `SearchBar`, `EmptyState`, `Fab`, `ColorPicker`, `Field`, `ProductAvatar`.
- [x] `ProductCard` con stepper inline (sin abrir nada) + estado de stock/caducidad (memoizado).
- [x] `ProductList` virtualizada (`useWindowVirtualizer`).
- [x] `ProductForm` (RHF + Zod) en bottom sheet + `ProductFormSheet` (crear/editar/eliminar).
- [x] FAB global "+" → alta rápida de producto.
- [x] Búsqueda en tiempo real (debounce) sobre nombre/notas (sin acentos).
- [x] Pantalla de gestión de Categorías/Ubicaciones/Unidades/Etiquetas (crear/editar/eliminar/reordenar) + hub "Más".
- [x] Fix: `ensureSeeded` a prueba de concurrencia (transacción + dedupe) — evitaba datos duplicados.
- [x] Tests: reglas de producto, `InventoryService` (con fake-indexeddb), `Stepper`.

### Pendiente menor de Fase 1 (arrastrado a fases siguientes)
- [ ] Creación inline de categoría/ubicación/etiqueta desde el propio formulario de producto (UX).
- [ ] `IconPicker` para productos (hoy: emoji + icono de reserva) → Fase 6.
- [ ] Guard de borrado de taxonomía en uso (avisar si hay productos que la referencian) → junto a Fase 2.

---

## ✅ Fase 2 — Dashboard + filtros + favoritos  (COMPLETADA)

- [x] Selectores de dominio puros: `computeStats` (totales, agotados, para comprar, caducan pronto, caducados, favoritos, recientes) y `applyInventoryView` (búsqueda + filtros + orden).
- [x] Primitiva `Stat` (métrica clicable) + grid del dashboard; `FilterChip`.
- [x] Filtros rápidos combinables (chips): favoritos, para comprar, poco stock, sin stock, caduca pronto, caducados + por categoría/ubicación/etiqueta.
- [x] `useFiltersStore` (Zustand) para búsqueda + filtros + orden, con `applyPreset`.
- [x] Dashboard: métricas clicables que fijan un preset y saltan al inventario filtrado + lista "Añadidos recientemente".
- [x] Toggle de favorito desde la tarjeta (y desde el detalle); acceso a Favoritos desde "Más".
- [x] Ordenaciones (nombre, cantidad, caducidad, recientes).
- [x] Tests de `computeStats`, `applyInventoryView` y `hasActiveFilters`.

---

## ✅ Fase 3 — Caducidad + Lista de la compra automática  (COMPLETADA)

- [x] Semáforo de caducidad (🟢🟠🔴) en tarjetas (pastillas) y en el formulario (indicador con días restantes); umbral configurable.
- [x] Cálculo por **días de calendario** (`calendarDaysUntil`) para que "hoy/mañana" coincidan con la intuición.
- [x] Filtro de caducidad (dimensión única): hoy, esta semana, caduca pronto, caducados.
- [x] Lista de la compra automática **derivada** (no materializada): los productos bajo mínimo aparecen/desaparecen solos, sin efectos secundarios ni riesgo de desincronización.
- [x] Elementos manuales (`ShoppingListService`: añadir, marcar, eliminar, limpiar comprados).
- [x] Marcar "comprado" → `InventoryService.restock` repone por encima del mínimo + registra `purchase` + `lastPurchaseAt`.
- [x] Pantalla de lista de compra (auto agrupada por categoría + manuales) con cantidad sugerida.
- [x] **Decisión semántica**: `minStock` = nivel deseado; tenerlo justo es `ok`, solo por debajo es `low` (reponer hasta el mínimo saca el producto de la lista).
- [x] Tests: `shopping.rules`, `ShoppingListService` (fake-indexeddb), `matchesExpiryWindow`.

---

## ✅ Fase 4 — Historial + Estadísticas  (COMPLETADA)

- [x] Pantalla de Historial (lectura del event log) con filtros por tipo (Todo/Compras/Consumo/Cambios), icono por tipo, delta con color y tiempo relativo.
- [x] Estadísticas: productos, nº de categorías, para comprar, agotados, caducan pronto, caducados + rankings "Más consumidos" y "Más comprados".
- [x] Gráficas simples con barras CSS (sin dependencia de librería de charts).
- [x] Agregaciones puras (`topConsumed`, `topPurchased`, `countByType`) por identidad de producto.
- [x] Enlaces activos desde "Más"; helper de tiempo relativo (`formatRelativeTime`).
- [x] Tests de agregaciones.

### Pendiente menor (arrastrado)
- [ ] Filtro de historial por entidad concreta (hoy solo por tipo) → cuando haya vista de detalle de producto.

---

## ✅ Fase 5 — Recetas + Packs  (COMPLETADA)

- [x] `RecipeService`: CRUD + "He cocinado" (`InventoryService.consume` descuenta el stock real sin bajar de 0, registra `cook`/`consume`, avisa de faltantes).
- [x] `PackService`: CRUD + "Añadir pack" (`InventoryService.restock` suma cada línea + `lastPurchaseAt`, registra `pack_apply`/`purchase`).
- [x] Pantallas de Recetas (bottom nav) y Packs (en "Más") con lista + editor en Sheet.
- [x] Editor de líneas `ProductLinesEditor` compartido (selector de productos del inventario + cantidad).
- [x] Sistema de **toasts** (`useToastStore` + `Toaster`) para feedback de cocinar/aplicar pack.
- [x] Tests de descuento (consumo real), casos borde (stock insuficiente) y suma de packs.
- [x] Fix de estilo: `w-full` de `controlClass` anulaba `w-XX` por className → inputs estrechos envueltos en contenedor con ancho fijo (`ProductLinesEditor`, emoji, raciones, abreviaturas).

---

## ✅ Fase 6 — Import/Export + Ajustes  (COMPLETADA)

- [x] Export **JSON** completo (todas las entidades, incluidos tombstones) + export **CSV** de productos (nombres legibles).
- [x] Import **JSON** con validación Zod (del sobre) y **merge last-write-wins** por `updatedAt`/`revision` respetando tombstones (misma política que la sync futura).
- [x] Import **CSV** de productos: empareja categoría/ubicación/unidad/etiquetas por nombre (crea las que falten) y actualiza el producto si ya existe.
- [x] Stub de backups automáticos (`BackupAdapter` + `noopBackupAdapter`).
- [x] Pantalla de **Ajustes**: tema (oscuro/claro/sistema), umbral de caducidad, unidad por defecto, datos (export/import) y "borrar todo".
- [x] Utilidades `download` y `csv` (parser/serializer RFC 4180 básico, sin dependencias).
- [x] Tests: round-trip JSON, last-write-wins, rechazo de formato, import CSV (crear/actualizar).

### ✅ Pase de pulido final (COMPLETADO)
- [x] Iconos PWA en PNG (192/512, any + maskable) + apple-touch-icon, generados desde el SVG con `sharp` (`npm run icons`); manifest actualizado.
- [x] Accesibilidad: enlace "Saltar al contenido", `main` enfocable y **foco al contenido al cambiar de ruta** (mejor para lectores de pantalla y teclado).
- [x] Microinteracciones: transición de página (fade) con Framer Motion respetando `prefers-reduced-motion`; feedback táctil (`active:scale`) en botones.
- [ ] (Opcional futuro) Auditoría de contraste automatizada y captura para stores.

---

## Fase 7 — Avanzado

- [x] **Sincronización entre dispositivos por clave de hogar** (Supabase, tiempo real):
  - Auth anónima + `join_household(secret)` (solo se guarda el hash de la clave).
  - Tabla genérica `documents` + RLS por pertenencia; replicación LWW (`updatedAt`/`revision`, tombstones) reutilizando la política del importador.
  - Motor de sync: pull+push inicial, realtime, hooks de Dexie para cambios locales (con anti-eco). UI en Ajustes (generar/copiar clave, estado, desactivar).
  - Esquema en [`supabase/schema.sql`](./supabase/schema.sql); config por `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. Tests de reconciliación LWW.
- [ ] Compartir inventario con otros hogares.
- [ ] Escáner de códigos de barras.
- [ ] OCR de tickets de compra.
- [ ] Integración con supermercados.
- [ ] IA: sugerencia de recetas según inventario.
- [ ] IA: generación automática de la lista de la compra.
- [ ] Control del gasto mensual.
- [ ] Planificador semanal de comidas + calendario de caducidades.
- [ ] Notificaciones inteligentes.
- [ ] Widgets móvil, Apple Shortcuts / Android Quick Settings.
- [ ] API pública.

---

## Notas de proceso

- Revisar `PROJECT_RULES.md` al inicio de cada sesión.
- Toda mutación de dominio pasa por un servicio y queda en el historial.
- Proponer mejoras antes de implementarlas cuando aporten claridad, rendimiento o UX.
