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

## Sincronización entre dispositivos (opcional)

Local-first por defecto. Para compartir el inventario entre varios móviles con
**tiempo real** mediante **Firebase (Firestore)**, sin cuentas: solo una clave de
hogar.

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. **Firestore Database → Crear base de datos** (modo producción, la región que quieras).
3. **Firestore Database → Reglas** → pega [`firebase/firestore.rules`](./firebase/firestore.rules) → **Publicar**.
4. **Authentication → Sign-in method** → habilita **Anónimo**.
5. **Configuración del proyecto → Tus apps → Web (`</>`)**: registra una app web y copia
   los valores de `firebaseConfig` (`apiKey`, `authDomain`, `projectId`, `appId`).
6. Ponlos en `.env.local` (ver [`.env.example`](./.env.example)) para desarrollo y en
   **Netlify → Environment variables** para producción.
7. En la app: **Más → Ajustes → Sincronización**, genera una clave y actívala;
   introduce la **misma clave** en el otro dispositivo.

El `householdId` es el SHA-256 de la clave (imposible de adivinar). Los datos se
replican con la política _last-write-wins_ (`updatedAt`/`revision`, tombstones) ya
usada por importar/exportar.

## Estado

**Fases 0–6 completadas** + **sincronización (Fase 7)** con Firebase/Firestore en
tiempo real. Ver [`TASKS.md`](./TASKS.md) para el detalle por fases.
