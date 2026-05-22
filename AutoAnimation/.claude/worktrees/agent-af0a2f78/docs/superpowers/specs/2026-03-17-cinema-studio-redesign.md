# Cinema Studio Panel Redesign

## Problem
The Cinema Studio panel is not user-friendly. It shows too much at once — camera body, lens, optical sliders, presets, and genre motion all in one scrollable panel. Users primarily want to pick a preset and move on.

## Design Decisions
- **Primary action:** Pick a preset (confirmed by user)
- **Three preset groups:** Quick Moves, Genre Feel, Cinema Shots — kept separate, shown in that order
- **No tabs:** Left panel is presets-only, no need for tabs
- **Camera settings moved to right panel:** Camera body, lens, and optical controls absorbed into the existing CameraPropertiesPanel
- **Accent color:** All `#4a7eff`, no domain-specific colors
- **Motto:** Simple at first glance — features appear when users need them

## Left Panel: CinemaStudioPanel

### Structure (top to bottom)
1. **PanelLayout** wrapper with `icon={Film}` title="Cinema Studio"
2. **PanelToggle** — Virtual Camera on/off
3. **PanelSearchInput** — Unified search across all three preset groups
4. **Quick Moves** — `PanelSection` with chip-style buttons in a flex-wrap grid. Presets: Zoom In, Zoom Out, Pan Left, Pan Right, Ken Burns, Tilt Up, etc.
5. **Genre Feel** — `PanelSection` with horizontal scroll row of genre cards. Each card shows genre name + one-line description. Presets: Action, Horror, Romance, Suspense, Comedy, etc.
6. **Cinema Shots** — `PanelSection` with `PanelCategoryTabs` (All, Establishing, Dialogue, Action, Emotion, Transition) + scrollable preset list. Each preset shows name, category badge, description.
7. **Footer** — `PanelActionButton variant="secondary"` "Camera Settings →" opens right panel camera-properties tab

### Search behavior
- Filters across all three groups simultaneously
- When search is active, Quick Moves chips that don't match are hidden
- Genre cards that don't match are hidden
- Cinema Shots list filters as before
- Empty state: icon + "No presets match" + hint

### What's removed from left panel
- Camera Body select
- Lens select
- Optical Controls (aperture, focus distance, ISO sliders)
- Optical toggles (DOF, Bokeh, Vignetting, etc.)
- All of these move to the right panel

## Right Panel: CameraPropertiesPanel

### New sections added (after existing Transform section)
1. **Camera & Lens** — `PanelSection collapsible defaultOpen={false}`
   - Camera Body: `PanelSelect` with sensor spec subtitle
   - Lens: `PanelSelect` with anamorphic indicator
2. **Optical** — `PanelSection collapsible defaultOpen={false}`
   - Aperture: `PanelSlider` (f/1.4–f/22)
   - Focus Distance: `PanelSlider` (0.3–30m)
   - ISO: `PanelSlider` (100–12800)
   - 7 toggles: `PanelCheckbox` (DOF, Bokeh, Vignetting, Chromatic Aberration, Lens Flare, Film Grain, Anamorphic)

### Existing sections unchanged
- Transform at current frame (zoom, pan, rotation)
- Keyframe add/update
- Camera Shake
- Focus Pull

### Preset application flow
When a preset is applied from the left panel that includes `opticalSettings`, those settings update in the right panel automatically (store already handles this).

## Components used
- `PanelLayout` (from `@/components/ui/PanelHeader`)
- `PanelSection` with `collapsible`, `icon`, `badge` props
- `PanelToggle`
- `PanelSearchInput`
- `PanelCategoryTabs`
- `PanelSelect`
- `PanelSlider`
- `PanelCheckbox`
- `PanelActionButton`

## Files to modify
1. `src/components/panels/CinemaStudioPanel.tsx` — Rewrite: presets-only left panel
2. `src/components/layout/RightPanel/CameraPropertiesPanel.tsx` — Add Camera & Lens + Optical sections
3. `src/stores/useCinemaStore.ts` — No changes (store API stays the same)
4. `src/stores/useCameraStore.ts` — No changes
