# PROJECT_RULES.md — 🧛 Alimentos Vampíricos

Normas arquitectónicas y de estilo del proyecto. **Se revisan al inicio de cada
sesión de desarrollo** para mantener la coherencia. Si una regla estorba al
producto, se discute y se actualiza este documento; no se ignora en silencio.

---

## 1. Principios rectores

1. **Regla de oro:** cualquier acción frecuente debe completarse en **< 2 s** y sin abrir pantallas nuevas cuando sea posible.
2. **Local-first / offline-first:** la app funciona al 100 % sin red. IndexedDB (Dexie) es la fuente de verdad.
3. **Preparado para sync, sin implementarla:** todo dato lleva metadatos de sincronización; nada se diseña de forma que impida añadir sync/escáner/OCR/IA después.
4. **Simplicidad > cleverness.** Menos es más: menos menús, menos formularios, menos estado.
5. **SOLID y bajo acoplamiento.** Cada capa depende solo de la de debajo mediante interfaces.
6. **Un hogar, sin usuarios.** No hay auth, perfiles ni permisos. `householdId = 'local'` hasta activar sync.

---

## 2. Arquitectura por capas (flujo unidireccional)

```
UI (features / components)
  → Application Services (casos de uso)
    → Domain (entidades puras + reglas, sin dependencias externas)
      → Repositories (interfaces) → Dexie + Event Log
UI ⟵ useLiveQuery (reactividad desde la BD)
```

**Reglas de dependencia (obligatorias):**

- `domain/` es **puro**: prohibido importar React, Dexie, servicios o nada de infraestructura. Solo tipos y funciones.
- La **UI nunca** accede a Dexie directamente. Lee con `useLiveQuery` (o hooks de feature) y escribe **solo** a través de servicios.
- Los **servicios** orquestan dominio + repositorios y **registran todo cambio en el historial** (event log).
- Los **repositorios** ocultan Dexie tras una interfaz estable (`BaseRepository`).
- `config/` no importa de `features/`. `features/` sí puede importar de todas las capas inferiores.

---

## 3. Estructura de carpetas

```
src/
├─ app/            # shell, router, providers, layout
├─ config/         # features (flags), constants, defaults (semillas)
├─ domain/         # entidades puras + reglas (por agregado)
├─ persistence/    # db.ts (Dexie), repositories/, mappers/, sync/
├─ services/       # casos de uso (por dominio) + bootstrap + history
├─ features/       # UI por módulo (pantalla + componentes + hooks del módulo)
├─ components/ui/  # sistema de diseño (primitivas reutilizables)
├─ hooks/          # hooks compartidos
├─ stores/         # zustand (solo estado de UI)
├─ lib/            # utilidades puras
├─ styles/         # globals.css + tokens
├─ types/          # tipos globales
└─ test/           # setup de tests
```

Nuevo módulo funcional = una carpeta en `features/<modulo>/` que compone
primitivas de `components/ui/` y llama a `services/`. Lógica de negocio nueva →
`domain/` + `services/`, nunca dentro del componente.

---

## 4. Gestión del estado

| Tipo de estado | Dónde vive | Cómo se accede |
|---|---|---|
| Datos persistentes (productos, listas…) | Dexie | `useLiveQuery` / hooks de feature |
| UI efímera (tema, sheet abierto, filtros activos, orden) | Zustand | `stores/*.store.ts` |
| Estado de formulario | React Hook Form | dentro del componente de formulario |

- **Prohibido** duplicar datos de Dexie dentro de Zustand.
- Zustand solo para UI. Si un dato debe sobrevivir a un reinicio y es "de negocio", va a Dexie.

---

## 5. Modelo de datos y sincronización

- Toda entidad extiende `Entity` (`id`, `householdId`, `createdAt`, `updatedAt`, `deletedAt`, `revision`).
- **IDs con ULID** (`newId()`), nunca autoincrement.
- **Borrado lógico** (tombstone `deletedAt`), nunca `delete` físico de registros de negocio.
- Cada mutación actualiza `updatedAt`/`revision` (helper `touch()`).
- **Todo cambio de dominio se registra en `history`** (event log = outbox para sync futura).
- Cambios de esquema Dexie → nueva `version(n).stores(...)` con migración; nunca editar una versión existente.

---

## 6. Estilo de diseño y UI

- **Tokens semánticos** (`bg`, `surface`, `text`, `primary`, `danger`…) vía CSS variables + Tailwind. **Prohibido** hex crudos o colores literales en componentes; usar utilidades de token (`bg-surface`, `text-muted`, …).
- Tema claro/oscuro por `data-theme`. Todo componente debe verse bien en ambos.
- **Mobile-first.** Objetivos táctiles ≥ 44 px. Radios `rounded-xl/2xl`. Espaciado generoso.
- Tipografía: `font-display` (Fraunces) para títulos/logo; `font-sans` (Inter) para el resto.
- **Framer Motion** discreto (120–200 ms). Respetar siempre `prefers-reduced-motion` (ya global en CSS).
- Iconos **Lucide** con `aria-hidden` cuando son decorativos.

---

## 7. Accesibilidad (no negociable)

- HTML semántico; roles/ARIA en sheets, modales y steppers.
- `aria-label` en botones de solo icono. `focus-visible` siempre visible.
- Foco gestionado y atrapado en modales/sheets.
- Contraste mínimo AA en ambos temas.
- Acciones rápidas anunciadas con `aria-live` (p. ej. cambio de cantidad).

---

## 8. Rendimiento

- Consultas Dexie **indexadas**; no cargar toda la tabla en memoria para filtrar.
- **Virtualizar** listas potencialmente largas (`@tanstack/react-virtual`).
- Memoizar tarjetas/steppers (`memo`, `useMemo`, `useCallback`) donde el perfil lo justifique.
- `debounce` en búsqueda (`SEARCH_DEBOUNCE_MS`).
- Escrituras **optimistas**: la UI reacciona a Dexie, no espera confirmaciones de red.
- Code-splitting por ruta cuando el bundle crezca.

---

## 9. TypeScript y código

- `strict` activado + `noUncheckedIndexedAccess`. **Prohibido `any`** (usar `unknown` + narrowing).
- `import type` para tipos (auto-fix por ESLint).
- `erasableSyntaxOnly` activo: **no** usar parameter properties ni enums; declarar campos y asignar en el constructor; usar `union types`/`as const` en vez de `enum`.
- Alias `@/*` → `src/*` para imports absolutos.
- Nombres: `PascalCase` componentes/tipos, `camelCase` funciones/variables, `kebab-case` archivos no-componente, `*.types.ts` / `*.rules.ts` / `*.service.ts` / `*.store.ts` por rol.
- Comentarios **en español**, solo donde aportan el *por qué* (no narrar el *qué*).

---

## 10. Validación

- **Zod** es la fuente de verdad de validación. Los schemas se reutilizan en formularios (RHF) **y** en import/export.
- El dominio puede devolver `Result<T, E>` en operaciones que fallan de forma esperada, en vez de lanzar.

---

## 11. Testing

- **Vitest + React Testing Library.** Cada módulo se cierra con sus tests en verde.
- Obligatorio testear: **reglas de dominio** y **servicios** (casos de uso). UI: tests de comportamiento en flujos críticos.
- Tests colocados junto al código (`*.test.ts(x)`).
- Reloj inyectable (`Clock`) para tests deterministas de tiempo/caducidad.

---

## 12. Calidad y flujo de trabajo

- Antes de cerrar cualquier tarea: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` en verde.
- `npm run format` (Prettier) antes de dar por terminado.
- **Desarrollo módulo a módulo**: no empezar el siguiente hasta terminar, probar y revisar el actual.
- Cada decisión arquitectónica relevante se justifica; si aparece una opción claramente mejor, se propone antes de implementarla.
- Actualizar `TASKS.md` (marcar hecho / añadir descubrimientos) al avanzar.

---

## 13. Feature flags (futuro preparado, no implementado)

`config/features.ts` controla: `sync`, `barcodeScanner`, `ocrReceipts`,
`aiRecipes`, `aiShoppingList`, `spendingTracker`, `mealPlanner`,
`notifications`, `publicApi`. Cada uno tiene (o tendrá) su interfaz/stub. Añadir
uno = implementar su adaptador tras la interfaz existente, sin reescribir.
