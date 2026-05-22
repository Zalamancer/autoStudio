# Stores

136 Zustand stores with Immer middleware. Key stores:

## src/stores/useAuthStore.ts
- State: `user`, `session`, `isLoading`, `error`
- Actions: `initialize`, `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `resetPassword`

## src/stores/useProjectStore.ts
Master project management with Supabase persistence.
- State: `currentProjectId`, `currentProjectName`, `projects`, `isSaving`, `isLoading`, `autoSaveEnabled`
- Actions: `createProject`, `loadProject`, `saveProject`, `deleteProject`, `listProjects`, `resetAllStores`

## src/stores/useTimelineStore.ts
Timeline with tracks, clips, markers, beat snap.
- State: `fps`, `totalFrames`, `currentFrame`, `isPlaying`, `tracks`, `markers`, `beatSnapEnabled`
- Actions: `play`, `pause`, `seekToFrame`, `setFps`, `addTrack`, `addClip`, `moveClip`, `addMarkerAtPlayhead`

## src/stores/useKeyframeStore.ts
Centralized keyframe management with undo/redo (zundo).
- State: `tracks: ObjectPropertyTrack[]`, `isRecordMode`, `selectedKeyframeIds`, `defaultEasing`
- Actions: `setKeyframe`, `removeKeyframe`, `getInterpolatedValue`, `setTaggedKeyframe`, `removeTaggedKeyframes`

## src/stores/useMultiCharacterStore.ts
Multi-character dialogue system.
- State: `characters: DialogueCharacter[]`, `dialogueLines: DialogueLine[]`, `activeCharacterId`
- Actions: `addDialogueCharacter`, `updateDialogueCharacter`, `addDialogueLine`, `reset`

## src/stores/useOrchestratorStore.ts
AI clip orchestration with step execution, cost tracking, A/B testing.
- State: `prompt`, `phase`, `plan`, `steps`, `cost`, `settings`, `variations`
- Actions: `generatePlan`, `executePlan`, `retryFromStep`, `skipStep`, `generateVariations`

## src/stores/useCharacterPartsStore.ts
Single-character sprite rendering mode with 8-layer transforms.
- State: `transforms`, `selectedSprites`, `layerOrder`, `renderMode`, `rigId`

## src/stores/useSavedCharactersStore.ts
Character library with IndexedDB persistence and cloud sync.
- State: `characters: SavedCharacter[]`, `selectedCharacterId`
- Actions: `addCharacter`, `hydrateAll`, `syncFromCloud`, `pushToCloud`

## src/stores/use3DCharacterStore.ts
3D characters on canvas with animation and face mapping.
- State: `characters: Character3D[]`, `activeCharacterId`
- Actions: `add3DCharacter`, `setVisemeFaceMapping`, `playAnimation`

## src/stores/use3DRigStore.ts
3D skeletal rigging with spring physics and squash/stretch.
- State: `rigs`, `selectedBoneName`, `manipulationMode`, `coordinateSpace`, `currentPose`
- Actions: `createRigFromSkeleton`, `setBonePose`, `addPoseKeyframe`, `addSpringChain`

## src/stores/useRigStore.ts
2D rig management.
- State: `rigs`, `activeRigId`, `poseTracks`, `isRigMode`

## src/stores/useEditorStore.ts
Global editor state (aspect ratio, active tab, modal visibility).

## src/stores/useCanvasStore.ts
Canvas viewport state (zoom, pan, selection, grid).

## src/stores/useMediaStore.ts
Image media assets on canvas.

## src/stores/useTextOverlayStore.ts
Text overlay layers.

## src/stores/useShapeStore.ts
Shape layers (rect, circle, triangle, star).

## src/stores/useSVGObjectStore.ts
Animated SVG objects.

## src/stores/useHTMLTemplateLayerStore.ts
HTML motion template instances.

## src/stores/useVoiceStore.ts
Voice/TTS management with ElevenLabs.

## src/stores/useBrandKitStore.ts
Brand identity kit (colors, fonts, logo).

## src/stores/useCrowdStore.ts
Crowd groups with procedural member generation.

## src/stores/useBeatSyncStore.ts
Beat detection and sync with FPS-aware recalculation.

## src/stores/useAdaptiveMusicStore.ts
Emotion-based adaptive music generation.

## src/stores/useAudioReactiveStore.ts
Audio-reactive visualizations and property mapping.

## src/stores/useConfirmDialogStore.ts
Global confirmation dialog state (replaces browser-native `window.confirm()`).
- State: `open`, `options: { title, description, confirmLabel?, cancelLabel? }`, `resolve`
- Actions: `confirm(options) => Promise<boolean>`, `accept`, `cancel`
- Hook: `useConfirmDialog()` — returns the `confirm` action

*(+ 100 more stores covering: annotations, artboards, art curves, AI providers, auto-publish, billing, camera, collaboration, copilot, credits, analytics, A/B testing, animation, recording, marketplace, notifications, portfolio, translations, etc.)*

## src/stores/useImageStoryStore.ts
Image story generation state with asset search results and selection.
- State: `plan` (ImageStoryPlan | null), `assets` (Record<string, FreepikAsset[]>), `selectedAssets` (Record<string, string>), `style` (ImageStoryStyle), `isGenerating` (boolean), `currentStep` (string)
- Actions: `setPlan`, `setAssets`, `selectAsset`, `swapAsset`, `setStyle`, `setGenerating`, `reset`

---

