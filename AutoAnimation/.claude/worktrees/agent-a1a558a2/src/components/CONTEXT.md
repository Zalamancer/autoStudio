# src/components/ Workspace

React components for ProAnimate's editor UI. Organized by function: canvas rendering, editor panels, layout shell, timeline, and supporting UI modules.

## Structure

```
components/
  canvas/           # 60+ canvas layer renderers (VideoCanvas.tsx composites all layers)
  panels/           # 50+ left panel feature UIs (one panel per feature tab)
  layout/           # Editor shell: EditorLayout, LeftPanel/, RightPanel/, TopMenuBar
    LeftPanel/      # Left panel container + navigation (tab groups, sub-tabs)
    RightPanel/     # Right panel: context-sensitive properties (per-selection-type)
  timeline/         # Timeline UI (tracks, playhead, clips, scrubber)
  dashboard/        # Project dashboard, clip grid, project management
  landing/          # Marketing/landing pages
  auth/             # Login, signup, auth flows
  charts/           # Data visualization components
  collaboration/    # Real-time collaboration UI
  copilot/          # AI copilot panel
  credits/          # Credit balance, purchase UI
  mobile/           # Mobile-responsive layouts (MobileEditorLayout, MobileLeftPanel)
  modals/           # Modal dialogs
  nodeCanvas/       # Node-based workflow canvas
  offline/          # Offline mode indicators
  overlays/         # Global overlay components
  pages/            # Page-level route components
  templates/        # Template browser/gallery
  ui/               # Shared UI primitives (buttons, inputs, dropdowns)
  ErrorBoundary.tsx # Top-level error boundary
  PanelErrorBoundary.tsx # Per-panel error boundary (isolates panel crashes)
```

## Canvas layer system

`VideoCanvas.tsx` is the main compositor. It renders all visual layers in z-order:
- `WhiteboardBackground` -> `LottieLayers` -> `MediaLayer` -> `VideoLayer` -> `SVGObjectLayer` -> `ShapeLayer` -> `ArtCurveLayer` -> `HTMLTemplateLayer` -> `MotionGraphicLayer` -> `MixedMediaLayer` -> `ParticleLayer` -> `CrowdLayer` -> `MultiCharacterLayer` (2D/3D/Pixel/Avatar variants) -> `TextOverlayLayer` -> `CaptionOverlay` -> `RetentionHookLayer` -> `AnnotationLayer` -> `AudioReactiveLayer`

Each layer component reads from its own Zustand store. Layers are wrapped in `PanelErrorBoundary` so one crashing layer does not break the canvas.

## Panel/tab relationship

Left panel tabs are defined in `src/constants/tabGroups.ts` (8 groups, 36+ sub-tabs). Each tab ID maps to a panel component in `panels/`. The `LeftPanel.tsx` in `layout/LeftPanel/` renders the active panel based on `useEditorStore.leftPanelActiveTab`.

Right panel (`layout/RightPanel/RightPanel.tsx`) is context-sensitive -- it shows properties for whatever is selected on the canvas (character, text overlay, shape, media, etc.). Each selection type has its own properties panel file in `layout/RightPanel/`.

## How components connect to stores

- Canvas layers use `useXStore()` hooks to subscribe to relevant state slices
- Panel components use `useXStore()` for both reading state and dispatching actions
- Selectors should return stable references (use `useShallow` for object/array selectors to avoid re-renders)
- Components never call AI services directly -- they call store actions which call services

## Remotion mirror

Canvas layers have corresponding Remotion layers in `src/remotion/` for video export. Canvas layers read from stores; Remotion layers receive the same data as props (no store access during render).

## Lazy loading

Heavy panels and 3D components are lazy-loaded via `React.lazy()` + `Suspense`. The 3D canvas (`ThreeCanvas`) loads Three.js/R3F only when 3D characters are present.
