# 🧛 Alimentos Vampíricos

Sistema de gestión de inventario doméstico. **Local-first**, offline, mobile-first
y pensado para que mantener el inventario al día no cueste ningún esfuerzo:
_cualquier acción frecuente en menos de 2 segundos_.

No es una lista de la compra: sabe en todo momento qué hay, qué falta, qué se
acaba, qué caduca, qué comprar y qué se consume más.

## Stack

React 19 · Vite · TypeScript (strict) · Tailwind v4 · React Router · Zustand ·
React Hook Form · Zod · Dexie (IndexedDB) · Framer Motion · Lucide · ULID ·
TanStack Virtual · PWA · Vitest + Testing Library · ESLint + Prettier.

## Arquitectura

Local-first por capas (UI → Servicios → Dominio puro → Repositorios → Dexie),
con el historial actuando como log de operaciones (outbox) para una futura
sincronización sin reescribir. Un único hogar, sin cuentas ni permisos.

- **Planificación completa:** ver el plan del proyecto.
- **Normas de arquitectura y estilo:** [`PROJECT_RULES.md`](./PROJECT_RULES.md).
- **Backlog priorizado:** [`TASKS.md`](./TASKS.md).

## Scripts

```bash
npm run dev          # servidor de desarrollo
npm run build        # typecheck + build de producción
npm run preview      # previsualiza el build
npm run lint         # ESLint
npm run format       # Prettier (escribe)
npm run typecheck    # tsc --build
npm run test         # Vitest (run)
npm run test:watch   # Vitest (watch)
```

## Estado

**Fases 0–5 completadas** (fundaciones + inventario núcleo + dashboard/filtros/
favoritos + caducidad y lista de la compra automática + historial y estadísticas
+ recetas y packs). Siguiente: Fase 6 — importar/exportar, ajustes y pulido. Ver
[`TASKS.md`](./TASKS.md) para el detalle por fases.
