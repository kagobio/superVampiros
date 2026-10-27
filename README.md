# 🧛 Alimentos Vampíricos

Sistema de gestión de inventario doméstico: sabe en todo momento qué hay, qué falta, qué se acaba, qué caduca y qué comprar. **Local-first, offline, mobile-first e instalable como app (PWA)**: cualquier acción frecuente se hace en menos de 2 segundos.

**[▶ Demo en vivo](https://kagobio.github.io/supervampiros/)** · los datos se guardan solo en tu navegador.

![Captura del inventario](https://raw.githubusercontent.com/kagobio/kagobio.github.io/main/img/supervampiros.png)

## Características

- Inventario con stock, caducidades (semáforo 🟢🟠🔴), favoritos y escáner de código de barras.
- Lista de la compra generada desde lo que falta o se agota.
- Recetas, packs y planificación semanal de menús.
- Historial de operaciones, estadísticas de consumo y gasto por producto.
- Sincronización entre dispositivos opcional (Firebase), con outbox y resolución last-write-wins.
- Sin cuentas ni servidores obligatorios: funciona 100% en local con IndexedDB.

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind v4 · Zustand · React Hook Form + Zod · Dexie (IndexedDB) · Framer Motion · TanStack Virtual · PWA (Workbox) · Vitest + Testing Library

## Arquitectura

Local-first por capas (UI → Servicios → Dominio puro → Repositorios → Dexie), con el historial actuando como log de operaciones (outbox) para la sincronización.

## Desarrollo

```bash
npm ci
npm run dev
npm test
```
