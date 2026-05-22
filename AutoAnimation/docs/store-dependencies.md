# Store Dependency Graph

Cross-store `getState()` calls across all Zustand stores.

**Summary:** 183 cross-store `getState()` calls across 32 store files (out of 133 total stores), forming 95 unique directed edges.

## Top 5 Most-Coupled Stores

### By outgoing calls (calls TO other stores)

| Rank | Store | Unique targets | Total calls | Purpose |
|------|-------|---------------|-------------|---------|
| 1 | `useProjectStore` | 24 | 69 | Save/load serializes 24 stores |
| 2 | `useOrchestratorStore` | 7 | 14 | AI orchestration reads characters, voices, editor state |
| 3 | `useNB2Store` | 6 | 16 | Character creation wizard reads config, parts, editor |
| 4 | `useBeatSyncStore` | 5 | 6 | Beat sync reads overlays, shapes, media, keyframes |
| 5 | `useWebcamCaptureStore` | 4 | 8 | Webcam captures reads rig, character config, timeline |

### By incoming calls (called BY other stores)

| Rank | Store | Depended on by | Role |
|------|-------|---------------|------|
| 1 | `useTimelineStore` | 19 stores | Central timing (fps, totalFrames, currentFrame) |
| 2 | `useEditorStore` | 7 stores | UI state (aspect ratio, active panel) |
| 3 | `useMultiCharacterStore` | 7 stores | Character dialogue data |
| 4 | `useSavedCharactersStore` | 7 stores | Persisted character library |
| 5 | `useVoiceStore` | 6 stores | Voice/TTS state |

## Circular Dependencies

### Direct cycles (A -> B -> A)

| Store A | Store B | Concern |
|---------|---------|---------|
| `useProjectStore` | `useOrchestratorStore` | Project calls orchestrator.reset() on new project; orchestrator calls project.saveProject() after generation |

No 3-node cycles detected.

## Full Dependency Table

Each row shows a store and which other stores it calls `getState()` on.

| Source store | Depends on (unique targets) | Total calls |
|---|---|---|
| `useProjectStore` | AIAnimation, Animation, AvatarCharacter, Camera, Canvas, CharacterConfig, CharacterParts, Editor, HTMLTemplateLayer, Keyframe, LayerTree, Media, MultiCharacter, Orchestrator, Playback, ProjectSchema, Rig, SavedCharacters, SVGObject, Shape, TextOverlay, Timeline, VideoLayer, Voice | 69 |
| `useOrchestratorStore` | Editor, Learning, MarketplaceUsage, MultiCharacter, Project, SavedCharacters, Voice | 14 |
| `useNB2Store` | Canvas, CharacterConfig, CharacterParts, Editor, MultiCharacter, SavedCharacters | 16 |
| `useBeatSyncStore` | Keyframe, Media, Playback, Shape, TextOverlay | 6 |
| `useWebcamCaptureStore` | CharacterConfig, CharacterParts, Rig, Timeline | 8 |
| `useDashboardStore` | Learning, Recordings, SavedCharacters, Voice | 5 |
| `useQualityAssuranceStore` | MultiCharacter, Orchestrator, TextOverlay, Voice | 4 |
| `useTranscriptStore` | MultiCharacter, Timeline, Voice | 7 |
| `useRepurposeStore` | Editor, MultiCharacter, Timeline | 4 |
| `useMemeStore` | Canvas, HTMLTemplateLayer, Timeline | 5 |
| `useLearningStore` | Editor, Playback, Voice | 3 |
| `useCollaborationStore` | Canvas, TextOverlay, Timeline | 3 |
| `useSmartCutStore` | MultiCharacter, Timeline | 5 |
| `useMediaStore` | Timeline, VideoLayer | 5 |
| `useShapeStore` | BrandKit, Timeline | 2 |
| `useBrollStore` | Media, Timeline | 3 |
| `useAudioReactiveStore` | Keyframe, Timeline | 3 |
| `useCrowdStore` | SavedCharacters, Timeline | 2 |
| `useVoiceStore` | Timeline | 2 |
| `useAnimationStore` | Timeline | 2 |
| `useAnnotationStore` | Timeline | 2 |
| `useTextOverlayStore` | BrandKit | 1 |
| `useBrandKitStore` | Auth | 3 |
| `useCharacterConfigStore` | SavedCharacters | 1 |
| `useCopilotStore` | Editor | 1 |
| `useNodeCanvasStore` | Editor | 1 |
| `useMultiCharacterStore` | SavedCharacters | 1 |
| `useTranslatedCaptionStore` | Playback | 1 |
| `useArtCurveStore` | Timeline | 1 |
| `useMotionTrackingStore` | Timeline | 1 |
| `useParticleStore` | Timeline | 1 |
| `usePenToolStore` | Timeline | 1 |

## Decoupling Recommendations

### 1. Extract `useTimelineStore` reads into a shared selector

19 stores call `useTimelineStore.getState()` for `fps`, `totalFrames`, or `currentFrame`. These are read-only accesses. Create a tiny derived helper:

```ts
// src/stores/selectors/timelineSelectors.ts
import { useTimelineStore } from '@/stores/useTimelineStore'

export const getTimelineInfo = () => {
  const { fps, totalFrames, currentFrame } = useTimelineStore.getState()
  return { fps, totalFrames, currentFrame }
}
```

This does not reduce coupling, but makes the dependency explicit and centralizes it. If timeline state ever moves to a context or is computed differently, only one file changes.

### 2. Split `useProjectStore` save/load into a service

`useProjectStore` has 69 cross-store calls because save/load must serialize 24 stores. Move serialization to a `projectSerializer` service that receives store snapshots as arguments rather than pulling them via `getState()`. The project store would call:

```ts
const snapshot = projectSerializer.collectSnapshot()
await projectService.save(projectId, snapshot)
```

This inverts the dependency: the serializer depends on store types (interfaces), not store instances.

### 3. Break the `useProjectStore` <-> `useOrchestratorStore` cycle

- **Project -> Orchestrator**: `resetProject()` calls `useOrchestratorStore.getState().reset()`. Replace with an event: `eventBus.emit('project:reset')` and have the orchestrator store subscribe.
- **Orchestrator -> Project**: calls `saveProject()` and reads `currentProjectId`. Pass `projectId` and a `save` callback into the orchestrator action instead.

### 4. Use an event bus for cross-store side effects

Several stores trigger actions in other stores (not just reading state). For example, `useDashboardStore` calls `useRecordingsStore.getState().addRecording()`. An event bus pattern decouples these:

```ts
// Store A emits
eventBus.emit('recording:created', { ... })

// Store B subscribes (in its init)
eventBus.on('recording:created', (data) => { ... })
```

### 5. Pass dependencies as action parameters

For stores like `useNB2Store` that call 6 other stores, refactor actions to accept the needed data as parameters. The component calling the action can gather the data from the stores it already subscribes to, eliminating hidden runtime coupling.
