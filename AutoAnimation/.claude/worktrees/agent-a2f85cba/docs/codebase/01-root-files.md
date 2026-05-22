# Root Files

## src/App.tsx
Main application router with lazy-loaded pages, modals, and auth guard.
- `EditorApp()` — Main editor route with keyboard shortcuts, theme effects, project persistence
- `App()` — Root component with route definitions wrapped in `<AuthGuard>`

## src/main.tsx
Vite entry point with Sentry error tracking and global error handlers.

## src/vite-env.d.ts
TypeScript declarations for FFmpeg WASM module.

---

