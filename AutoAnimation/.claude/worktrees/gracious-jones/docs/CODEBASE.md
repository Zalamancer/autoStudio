# ProAnimate Codebase Documentation

> ~1,400 core files documented (excludes 1,793 motion templates).
> Each section is a separate file in `docs/codebase/`.

| File | Scope | Lines |
|------|-------|-------|
| [01-root-files.md](codebase/01-root-files.md) | App.tsx, main.tsx, vite-env | 15 |
| [02-services-root.md](codebase/02-services-root.md) | src/services/*.ts (supabase, auth, apiClient, credits, nanoBanana, etc.) | 145 |
| [03-services-subdirs.md](codebase/03-services-subdirs.md) | effects, orchestrator, QA, NLE, collaboration, copilot, manim, motionDesign | 64 |
| [04-stores.md](codebase/04-stores.md) | 136 Zustand stores (auth, project, timeline, keyframes, orchestrator, etc.) | 99 |
| [05-types.md](codebase/05-types.md) | 92 type definition files | 18 |
| [06-engine.md](codebase/06-engine.md) | Animation engine (interpolate, spring, particles, path, stagger, beat, presets) | 67 |
| [07-hooks.md](codebase/07-hooks.md) | 38 custom React hooks | 27 |
| [08-canvas.md](codebase/08-canvas.md) | Canvas components (VideoCanvas, CharacterComposite, 3D, rig overlays) | 49 |
| [09-layout.md](codebase/09-layout.md) | Layout (EditorLayout, LeftPanel, RightPanel, TopMenuBar) | 38 |
| [10-panels.md](codebase/10-panels.md) | 184 panel components (audio, media, character, animation, AI, analytics) | 19 |
| [11-ui-overlays-modals-dashboard.md](codebase/11-ui-overlays-modals-dashboard.md) | UI, overlays, modals, dashboard, auth, credits, charts, copilot, collab | 60 |
| [12-remotion.md](codebase/12-remotion.md) | 29 Remotion export layers + 16 PixiJS renderers + motion graphics system | 60 |
| [14-bonerigging.md](codebase/14-bonerigging.md) | 2D rigging core engine + editor (deformation, IK, auto-rig, spring physics) | 59 |
| [15-server-utils.md](codebase/15-server-utils.md) | Express server, middleware, routes, services, utils, constants | 66 |
