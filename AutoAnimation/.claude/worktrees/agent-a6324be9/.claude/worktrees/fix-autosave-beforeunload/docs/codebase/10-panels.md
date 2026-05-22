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

