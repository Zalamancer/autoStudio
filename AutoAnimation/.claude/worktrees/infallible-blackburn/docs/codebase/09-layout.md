# Components: Layout

## src/components/layout/EditorLayout.tsx
Main editor layout routing between normal, rig, node canvas views.

## src/components/layout/LeftPanel/LeftPanel.tsx
Left sidebar with 7 collapsible tab groups (create, media, audio, edit, script, design, publish).

## src/components/layout/RightPanel/RightPanel.tsx
Dynamic right panel dispatching to 30+ property panels based on selection.

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

