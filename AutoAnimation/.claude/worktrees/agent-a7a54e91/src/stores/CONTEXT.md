# src/stores/ Workspace

Zustand state stores for ProAnimate. 135 store files managing all application state -- from canvas dimensions to AI generation progress to timeline playback.

## Pattern

Every store follows the same structure:

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface XState {
  // state fields
  // action methods
}

export const useXStore = create<XState>()(
  immer((set, get) => ({
    // state + actions using immer for immutable updates
  }))
)
```

Stores that need undo/redo wrap with `temporal` middleware from Zundo:
```ts
export const useXStore = create<XState>()(
  temporal(immer((set, get) => ({ ... })))
)
```

## Naming

- File: `useXStore.ts` (camelCase with `use` prefix)
- Export: `export const useXStore = create<XState>()(...)`
- Interface: `XState` (matches store name without `use` prefix)
- Actions are methods on the state object, not separate exports

## Barrel export (index.ts)

`index.ts` re-exports the most commonly used stores. Heavy stores like `useOrchestratorStore` are intentionally excluded from the barrel to avoid eager loading of their large dependency trees. Import those directly from their file.

## Key stores by domain

| Domain | Stores | Purpose |
|--------|--------|---------|
| Editor shell | `useEditorStore`, `useCanvasStore`, `useSettingsStore` | Panel state, canvas dimensions, app settings |
| Playback | `usePlaybackStore`, `useTimelineStore`, `useUnifiedTimelineStore` | Play/pause, frame position, tracks, clips |
| Characters | `useCharacterConfigStore`, `useCharacterPartsStore`, `useMultiCharacterStore`, `use3DCharacterStore`, `useAvatarCharacterStore`, `usePixelArtCharacterStore` | Character config, sprite parts, multi-char dialogue, 3D models |
| Saved assets | `useSavedCharactersStore`, `useSaved3DCharactersStore`, `useSavedAvatarCharactersStore`, `useSavedPixelArtCharactersStore` | Persistent character libraries |
| Voice & audio | `useVoiceStore`, `useVoiceEffectsStore`, `useAdaptiveMusicStore`, `useBeatSyncStore`, `useAudioEnhancementStore` | TTS, effects, music, beat sync |
| Visual layers | `useAnimationStore`, `useMediaStore`, `useVideoLayerStore`, `useTextOverlayStore`, `useSVGObjectStore`, `useShapeStore`, `useMotionGraphicStore`, `useHTMLTemplateLayerStore` | Lottie, media, video, text, SVG, shapes, motion graphics, HTML templates |
| AI features | `useOrchestratorStore`, `useAIAnimationStore`, `useAIEditStore`, `useManimStore`, `useCopilotStore` | Orchestrator pipeline, AI animation, AI edit, Manim, copilot |
| Auth & billing | `useAuthStore`, `useCreditsStore`, `useBillingStore` | User auth, credit balance, subscription |

## How stores connect

- **Components** subscribe to stores via `useXStore()` hooks (React context)
- **Services** read/write stores via `useXStore.getState()` and `useXStore.setState()` (outside React)
- **Orchestrator** writes to many stores in sequence during clip generation (each step targets specific stores)
- Stores should not import other stores. Cross-store coordination happens in services or components.

## Selectors

Use granular selectors to avoid re-renders:
```ts
// Good: subscribes only to what's needed
const fps = usePlaybackStore(s => s.fps)

// For objects/arrays, use useShallow:
const { width, height } = useCanvasStore(useShallow(s => ({ width: s.width, height: s.height })))
```

Returning new object/array references from selectors causes infinite re-render loops. This has been a recurring bug source (see PROGRESS.md).
