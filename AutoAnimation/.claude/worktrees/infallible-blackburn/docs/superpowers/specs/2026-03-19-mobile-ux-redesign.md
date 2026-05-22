# ProAnimate Mobile UX Redesign — Design Spec

## Vision

Transform the mobile app from an empty shell into an impressive, content-rich experience. First impression is a TikTok-style showcase of auto-playing template animations. Then a pro dashboard for managing projects. Full feature parity with web over time, all rebuilt natively in React Native.

## Architecture Decisions

### 1. Showcase-First Home Screen

Replace the flat grid browse screen with a full-screen vertical feed of auto-playing template animations. Each card fills ~85% of screen height with the actual DynamicRenderer playing live. Animations auto-play when visible, pause when scrolled away. Snap scrolling between cards.

No auth required to browse — auth gate moves to save/export only.

### 2. 50+ Bundled Templates

Write a Node conversion script that reads the ~90 KineticBase template TSX files from `src/motionGraphics/templates/` and generates `MotionDesignDescription` JSON for each. Bundle the JSONs in the mobile app at `mobile/src/data/templates.ts`. Server templates merge in alongside bundled ones.

### 3. Preview-Dominant Editor

Editor screen uses 60% of screen for live preview. Config panel is a draggable bottom sheet organized by tabs (Content, Style, Timing). Export is a slide-up sheet within the editor, not a separate screen.

### 4. Project Dashboard with Animated Thumbnails

Projects tab shows recent projects in a horizontal scroll with mini animated previews, then a full list below. Swipe to delete, tap to edit.

## Screen Designs

### Showcase Home (replaces Browse tab)

**Layout:** Full-screen vertical FlatList with snap scrolling.

**Card anatomy:**
- Live animation filling ~85% of card height (DynamicRenderer, auto-plays)
- Overlay at bottom: template name, category tag, color palette dots
- "Use Template" CTA button
- Only 1-2 cards render at a time (performance)

**Behavior:**
- Snap scroll — each card snaps to center
- Auto-play when card is >50% visible, pause when not
- Search bar at top (collapses on scroll down)
- Category filter chips between search and feed
- Pull-to-refresh for server templates
- Featured/curated templates shown first

### Editor Screen

**Layout:** Preview-dominant with bottom sheet config.

**Preview area (60% of screen):**
- Live DynamicRenderer preview
- Tap to toggle play/pause
- Shows current progress

**Config bottom sheet (40%, draggable):**
- Drag handle at top
- Tab bar: Content | Style | Timing (grouped by FieldDescriptor.group)
- Inline fields: TextInput, color swatches, number steppers, switches, select chips
- Instant preview updates on every change

**Header:**
- Back button, template name, Save button

**Sticky bottom:**
- "Export Video" button — always visible

**Export flow (slide-up sheet, not separate screen):**
- Format picker (mp4/webm) as segmented control
- Duration picker (3s, 5s, 10s, 15s)
- FPS picker (24, 30, 60)
- Big "Export" button → progress bar → download/share
- Stays on editor screen

### Projects Dashboard

**Layout:** Two sections.

**Recent (horizontal scroll):**
- 3 most recently edited projects
- Small cards with mini animated preview
- Project name + time ago

**All Projects (vertical list):**
- Each row: animated thumbnail, name, specs (aspect ratio, fps, duration), last edited
- Swipe left → Delete (with confirmation)
- Tap `···` → menu: Duplicate, Export, Delete
- Tap → opens editor with saved config

**Header:** "Projects" title + `[+]` create button (navigates to Showcase)

**Empty state:** Icon, "No projects yet", description, "Browse Templates" CTA button linking to Showcase tab

### Settings (minimal)

- Account section: email, sign out
- App section: version, clear cache
- About section: privacy policy, terms, licenses

## Navigation Structure

```
app/
├── _layout.tsx              # Root: auth listener + deep link handler
├── index.tsx                # Redirect to showcase
├── (tabs)/
│   ├── _layout.tsx          # Tab bar (Showcase, Projects, Settings)
│   ├── showcase.tsx         # Full-screen auto-play feed (was browse.tsx)
│   ├── projects.tsx         # Dashboard with recent + all projects
│   └── settings.tsx         # Account + app info
├── editor/
│   ├── _layout.tsx          # Stack layout
│   └── [templateId].tsx     # Preview + bottom sheet config + export
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx            # Sign in / sign up / Google / forgot password
```

**Auth flow change:**
- Showcase is accessible without login
- Auth is required when user taps "Use Template" → checks auth → if not logged in, redirects to login → after login, opens editor
- Projects and Settings tabs require auth

## Template Conversion Script

**Input:** `src/motionGraphics/templates/Kinetic*.tsx` (~90 files)
**Output:** `mobile/src/data/templates.ts` (exported array of template objects)

Each template object:
```typescript
{
  id: string                           // e.g. 'kinetic-bounce'
  title: string                        // e.g. 'Bounce'
  description: string
  category: string                     // 'kinetic-typography'
  tags: string[]
  featured: boolean                    // hand-curated top picks
  configSchema: FieldDescriptor[]
  defaultConfig: Record<string, unknown>
  motionDesignDescription: MotionDesignDescription
}
```

**Conversion strategy:**
- Parse each template's `registerMotionGraphic()` call for metadata (title, description, tags, category, configSchema, defaultConfig)
- Parse the `KineticAnimation.renderWord` and `renderBackground` functions to extract: positioning, colors, transforms, opacity patterns, easing
- Generate equivalent `MotionDesignDescription` with elements + animation properties
- Templates that use complex CSS (clipPath, SVG, mixBlendMode) get flagged for manual conversion
- Output: estimated 50-60 auto-convertible, 30 requiring manual work

## Performance Considerations

**Showcase feed:**
- ViewabilityConfig: only render animations for cards that are >50% visible
- Maximum 2 DynamicRenderer instances active at once
- Offscreen cards show a static "frame 0" snapshot or colored placeholder
- Use `windowSize={3}` on FlatList to limit rendered items

**Editor preview:**
- Single DynamicRenderer instance
- Progress driven by useFrameCallback at render rate
- Config changes trigger re-render (already instant)

**Project thumbnails:**
- Mini DynamicRenderer at reduced size (120x213) for recent section
- Static placeholder for list items (animated thumbnail too expensive for all items)

## Implementation Phases

### Phase A: Showcase + Templates (highest impact)
1. Template conversion script
2. Bundle 50+ templates in mobile app
3. Showcase screen with auto-play feed
4. Category filters + search
5. Auth-gated "Use Template" flow

### Phase B: Editor Polish
6. Bottom sheet config panel (replace current split view)
7. Tabbed config groups (Content/Style/Timing)
8. Export as slide-up sheet (replace separate screen)
9. Tap-to-play preview

### Phase C: Projects Dashboard
10. Recent projects horizontal scroll with mini previews
11. Project list with swipe actions
12. Empty state with CTA
13. Project thumbnails

## Success Criteria

1. Showcase feed shows 50+ auto-playing template animations
2. Snap scrolling is smooth at 60fps
3. Only 1-2 animations render at a time (no performance issues)
4. User can go from showcase → editor → customize → export in under 60 seconds
5. Editor preview updates instantly on config changes
6. Projects dashboard shows recent projects with visual previews
7. App feels content-rich and impressive on first open
