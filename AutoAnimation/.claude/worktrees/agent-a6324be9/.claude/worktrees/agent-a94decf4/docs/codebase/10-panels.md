# Components: UI

## src/components/ui/ColorPicker.tsx
Full HSV picker with hue/alpha sliders, hex input, eyedropper, gradient modes.

## src/components/ui/panel-controls/PanelSlider.tsx
Draggable slider with pointer lock, double-click edit, wheel scroll.

## src/components/ui/LoadingSpinner.tsx / LoadingOverlay
Animated spinner variants.

## src/components/ui/NotificationBell.tsx
Bell icon with unread badge and dropdown.

## src/components/ui/GlassPanel.tsx
Frosted glass container with backdrop blur.

## src/components/ui/ConfirmDialog.tsx
Global confirmation dialog (replaces `window.confirm()`). Portal-rendered, accessible (`role="alertdialog"`, focus trap, ARIA). Cancel is default-focused to prevent accidental destructive actions. Powered by `useConfirmDialogStore`.

---

# Rig Editor Panels

## src/components/panels/RigEditorPanel.tsx
Unified rig editor left panel. Header: back button + dropdown (2D/3D Rig Editor). Two tabs: RIG (BRToolPanel for 2D, BoneHierarchyTree for 3D) and ANIMATION (lazy-loaded RigEditorAnimationTab). Syncs `leftPanelActiveTab` on mode change so EditorLayout swaps canvas correctly.

## src/components/panels/RigEditorAnimationTab.tsx
ANIMATION tab content. Four collapsible sections: AI Animation (2D only, RigAnimationGeneratorPanel), Perform/Live Avatar (MotionTrackingPanel for 2D, LiveAvatarPanel for 3D), Motion Capture (MotionCapturePanel, both modes), DeepMotion (DeepMotionPanel, PRO badge, lazy-loaded).

## src/components/panels/DeepMotionPanel.tsx
Cloud motion capture via DeepMotion Animate 3D API. Video upload with drag-drop, FPS selector (24/30/60), face/hand tracking toggles. Uploads to Express proxy, polls status, downloads GLB result. Parses GLB with GLTFLoader, remaps via autoRemapClip, saves to animation library.

## src/services/deepMotionClient.ts
Client API for DeepMotion Express proxy. Functions: startDeepMotionJob, pollDeepMotionStatus, getDeepMotionDownloads, downloadDeepMotionGLB.

## src/stores/useDeepMotionStore.ts
Zustand store for DeepMotion workflow. State: status, rid, progress, statusMessage, error, resultGlbUrl, fps, faceTracking, handTracking.

## server/routes/deepmotion.ts
Express proxy for DeepMotion REST API. Authenticates via HTTP Basic (DEEPMOTION_CLIENT_ID/SECRET). Routes: POST /process, GET /status/:rid, GET /download/:rid.

## src/components/panels/BonePropertyControls.tsx
Shared transform UI primitives (DragField, TransformRow, SENSITIVITIES, Axis type) extracted from BonePropertiesEditor. No Three.js dependency -- safe to import from RightPanel and other non-3D components without pulling Three.js into the main bundle.

## src/components/panels/BonePropertiesEditor.tsx
Compact 3D bone transform editor (position/rotation/scale). Uses Three.js for quaternion-euler conversion. Re-exports shared primitives from BonePropertyControls for backward compatibility.

---

# Right Panel

## src/components/layout/RightPanel/RightPanel.tsx
Thin router (~546 lines). Renders section headers + delegates to the correct sub-panel based on `rightPanelTab`. Uses `React.lazy` for heavy sub-panels (>200 lines). Contains `SpriteTab` (memo'd, reusable for all 9 character sprite tabs) and the main `RightPanel` export function.

## src/components/layout/RightPanel/rightPanelConstants.tsx
Shared constants, types, custom icons (EyebrowIcon, PantsIcon), tab definitions, section configs (CHARACTER_SECTIONS, TEXT_SECTIONS, PIXELART_SECTIONS, AVATAR_SECTIONS, GEN_SECTIONS, TEMPLATE_SECTIONS, BG_SECTIONS), CONTEXT_INFO map, NB2 part mappings, rig editor constants. Exported for use by RightPanel and SectionHeaders.

## src/components/layout/RightPanel/SectionHeaders.tsx
Arrow-navigated dropdown section headers: NB2GenerationHeader, DropdownSectionHeader (shared base), CharacterSectionHeader, TextSectionHeader, PixelArtSectionHeader, AvatarSectionHeader, GenSectionHeader, TemplateSectionHeader, BackgroundSectionHeader, CameraSectionHeader, CrowdSectionHeader, BrandKitSectionHeader, RigEditorRightPanel.

## src/components/layout/RightPanel/GenPropertiesPanels.tsx
Router for generator tool panels: GenImagePropertiesPanel, GenTextToVideoPropertiesPanel, GenAudioToVideoPropertiesPanel, GenVideoToVideoPropertiesPanel, GenRetakePropertiesPanel, GenExtendPropertiesPanel, GenManimPropertiesPanel, ImageToVideoPropertiesPanel, BrollSuggestPropertiesPanel. Default export is `GenPropertiesPanels({ tab })`.

## src/components/layout/RightPanel/TextStylePresetsPanel.tsx
Style preset picker for text overlays. Unified presets from neon, gradient, 3D, cinematic, comic, gaming, elemental, highlighted categories. Category filter + grid layout.

## src/components/layout/RightPanel/TextAnimationsPanel.tsx
Animation preset picker for text overlays. Category-filtered grid of TEXT_ANIMATION_PRESETS.

## src/components/layout/RightPanel/WhiteboardBackgroundPropertiesPanel.tsx
Background editor: solid color swatches, gradient cards, template cards (Drafting, Cutting Mat, Chalkboard, Blueprint), custom upload (image/video/SVG), code background editor with auto-generated controls.

## src/components/layout/RightPanel/BeatSyncSection.tsx
Collapsible beat sync controls. Analyzes audio for BPM, allows per-object beat sync with effect (scale/opacity/bounce), subdivision, and intensity controls.

## src/components/layout/RightPanel/MediaPropertiesPanel.tsx
Transform, color recoloring, and background removal for canvas media items. Uses selectors for store subscriptions.

## src/components/layout/RightPanel/TextPropertiesPanel.tsx
Full text overlay editor: content, font, size, line height, alignment, position, rotation, opacity, z-index, brand kit integration.

## src/components/layout/RightPanel/ShapePropertiesPanel.tsx
Shape transform, fill/stroke colors, corner radius, star points. Uses live transform store for real-time updates.

## src/components/layout/RightPanel/SVGObjectPropertiesPanel.tsx
Color pickers, opacity, z-index, visibility for decomposed SVG animation objects. Quick-select list for multi-object compositions.

## src/components/layout/RightPanel/AnimationPropertiesPanel.tsx
Lottie animation playback (speed, loop) and transform (position, scale, opacity, z-index).

## src/components/layout/RightPanel/HTMLTemplatePropertiesPanel.tsx
Dynamic property editor for HTML template layers. Parses CONFIG/EDITABLE VARIABLES from template code.

## src/components/layout/RightPanel/Character3DPropertiesPanel.tsx
3D character transform, viseme face mapping, expression mapping. Uses `use3DCharacterStore` and `use3DAnimationStore`.

## src/components/layout/RightPanel/ArtCurvePropertiesPanel.tsx
Art curve editor: stroke width, color, opacity, smoothing, animation timing.

---

