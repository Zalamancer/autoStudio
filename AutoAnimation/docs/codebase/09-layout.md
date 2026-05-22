# Components: Layout

## src/components/layout/EditorLayout.tsx
Main editor layout routing between normal, rig, node canvas views. Major sections (VideoCanvas, Timeline, BRViewport, Rig3DViewport, RightPanel) are wrapped in `PanelErrorBoundary` so a crash in one section does not take down the entire app.

## src/components/layout/LeftPanel/LeftPanel.tsx
Left sidebar with 7 collapsible tab groups (create, media, audio, edit, script, design, publish). `PanelContent` is wrapped in a keyed `PanelErrorBoundary` that resets when the active tab changes, protecting all ~50 left panels. Progressive disclosure: sub-tabs marked `advanced: true` in `SubTabDef` are hidden by default in the card grid; a "N more" / "Hide advanced" toggle at the bottom of each group reveals them. Preference persisted in localStorage (`proanimate_show_advanced`).

## src/components/layout/MobileEditorLayout.tsx
Mobile 4-page horizontal scroll-snap layout (Menu, Tools, Canvas+Timeline, Properties). All major sections wrapped in `PanelErrorBoundary` matching the desktop EditorLayout pattern.

## src/components/layout/RightPanel/RightPanel.tsx
Dynamic right panel dispatching to 30+ property panels based on selection. All early-return branches (RigEditorRightPanel, Rig3DPropertiesPanel, CopilotDrawer, MotionStyleBrowser) are individually wrapped in `PanelErrorBoundary`. The main content area is wrapped in a keyed `PanelErrorBoundary` that resets per-tab.

## src/components/layout/TopMenuBar.tsx
Top menubar with File/Settings/Marketplace dropdowns, credit badge.

## src/components/layout/RightPanel/
30+ property panels: TextProperties, MediaProperties, ShapeProperties, SVGObjectProperties, Character3DProperties, PixelArtProperties, AvatarProperties, HTMLTemplateProperties, MotionGraphicProperties, CameraProperties, TransformControls, AnimationsPanel, CrowdProperties, StylePanel, BrandKitProperties, etc.

---

# Components: Panels

184 panel components in `src/components/panels/`:

**Core**: AudioPanel, MediaPanel, CrowdPanel, VideosPanel, TextPanel, CaptionsPanel, ExportPanel, SharePanel
**Character**: CharacterGeneratorPanel, Character3DPanel, Character1DPanel, AvatarPanel, WardrobePanel
**Animation**: AnimationsPanel, RigEditorPanel, RigEditor3DPanel, RigAnimationGeneratorPanel, WeightPaintPanel
**Motion**: SmartZoomPanel, BeatSyncPanel, MotionTrackingPanel, TransitionsPanel, PathAnimationPanel
**Audio**: VoiceClonePanel, VoicesPanel, SoundEffectsPanel, DubbingPanel, SingingPanel, VoiceEffectsPanel
**Generation**: GenManimPanel, GenTextToVideoPanel, GenImagePanel, ImageToVideoPanel, PersonClonePanel
**Analytics**: AnalyticsPanel, ViralityPanel, InsightsPanel, RecommendationsPanel, TrendPanel
**Publishing**: AutoPublishPanel, ContentCalendarPanel, SocialIntegrationPanel
**Orchestrator**: OrchestratorPanel (5 phases: prompt → plan review → storyboard → execution → completion)
**Marketplace**: MarketplacePanel, CreateRequestModal, SubmissionForm
**Templates**: TemplatesLibraryPanel, PPTXImportPanel, TemplateDevMode
**A/B Testing**: ABTestConfigPanel, ABComparisonPanel, ABTestHistoryPanel

---

