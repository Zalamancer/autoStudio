# ProAnimate — Improvement & Roadmap Plan

Based on a full codebase audit (111K lines, 146 files, 30 dependencies).

---

## Phase 1: Critical Fixes (1-2 weeks)

### 1. Fix broken/misleading UI
- **Remove dead TODO buttons** in `MediaPanel.tsx:220` and `VideosPanel.tsx:216` — "AI image generation" and "AI video generation" onClick handlers are empty. Users click and nothing happens.
- **Remove `@ts-nocheck`** from `BrandDirectorSection.tsx` — entire file has type checking disabled, hiding potential bugs.

### 2. Fix server bug — OAuth state cleanup
- **File:** `server/routes/social.ts:49-55`
- The cleanup interval calculates `fiveMinAgo` but never uses it — it only checks `oauthStates.size > 100`. States never expire by age.
- Fix: compare each entry's timestamp against `fiveMinAgo`.

### 3. Add error toasts for async operations
- Currently only 22 catch blocks across the entire codebase. Most API calls fail silently.
- Add a lightweight toast system (e.g. sonner or react-hot-toast) and surface errors for:
  - Voice generation (ElevenLabs)
  - Character generation (nanoBanana)
  - 3D model import/generation (Meshy)
  - SVG generation
  - Video export
  - Orchestrator execution steps

### 4. Sanitize SVG rendering
- 6 instances of `dangerouslySetInnerHTML` render AI-generated SVG without sanitization (`SVGArtPanel`, `ArtCurvesPanel`, `ArtCurveLayer`, `RemotionArtCurveLayer`).
- Add DOMPurify to sanitize SVG before injection.

---

## Phase 2: UX Polish (2-4 weeks)

### 5. Add loading states
- Only 1 explicit loading spinner exists (in VideoCanvas). Missing loading indicators for:
  - Character generation
  - Voice TTS generation
  - 3D model import/generation
  - SVG object generation
  - Background removal
  - Video export progress bar

### 6. Add empty states
- Lists/grids show blank areas when empty. Add "No items yet" UI with guidance for:
  - Sprite grid (no images uploaded)
  - Timeline (no clips)
  - Marketplace (no filter results)
  - Voice list (no voices generated)
  - 3D animation library
  - Recordings panel

### 7. Add disabled-state tooltips
- 49 files have `disabled` attributes without explaining WHY. Add `title` props so users understand what's needed.

### 8. SEO & meta tags
- `index.html` has no Open Graph, Twitter Card, or description meta tags. Add:
  - `og:title`, `og:image`, `og:description`
  - `twitter:card`, `twitter:image`
  - `meta name="description"`
  - Canonical URL

---

## Phase 3: Architecture & Performance (1-2 months)

### 9. Refactor oversized files
| File | Lines | Action |
|------|-------|--------|
| `RightPanel.tsx` | 4,062 | Extract each tab into its own component file |
| `orchestrator.ts` | 2,672 | Split plan generation vs. execution steps |
| `canvas2dRenderer.ts` | 2,164 | Split by layer type (character, text, media) |
| `CharacterLayer.tsx` | 1,389 | Extract multi-char logic from rendering |
| `pixiExportRenderer.ts` | 1,382 | Split by render layer |

### 10. Lazy-load heavy components
- These large components are eagerly imported but only used when their tab is active:
  - `Character3DPanel` (1,278 lines)
  - `ExportPanel` (1,106 lines)
  - `TemplatesLibraryPanel` (1,027 lines)
  - `AnalyticsPanel`
- Wrap with `React.lazy()` + `Suspense`.

### 11. Dynamic imports for heavy libraries
- `html2canvas`, `jszip`, `meshoptimizer` are imported at module level but only used in specific features. Convert to dynamic `import()`.

### 12. Clean up console.log
- 79 `console.log` calls across 76 files. Replace with a centralized logger service that:
  - Only outputs in development
  - Has log levels (debug/info/warn/error)
  - Can be piped to error tracking in production

### 13. Fix circular dependency workarounds
- `useProjectStore.ts` and `useOrchestratorStore.ts` both use lazy/dynamic imports to avoid circular deps. Map the dependency graph and restructure to remove the cycles.

### 14. Split oversized stores
| Store | Lines | Split into |
|-------|-------|-----------|
| `useDashboardStore` | 643 | clips + executionQueue separate from costTracking |
| `useCharacterConfigStore` | 642 | sprites/visemes separate from emotionHeads |
| `useOrchestratorStore` | 618 | generation separate from execution pipeline |

---

## Phase 4: Testing & Reliability (2-3 months)

### 15. Set up test framework
- **Zero tests exist** in the entire codebase. Add Vitest + React Testing Library.
- Priority test targets:
  1. `lipSync.ts` — phoneme-to-viseme conversion (pure logic, easy to test)
  2. `orchestrator.ts` — ClipPlan generation validation
  3. `interpolation.ts` — keyframe interpolation math
  4. `emotionMapping.ts` — emotion string normalization
  5. `templateConfigParser.ts` — config property detection
  6. Video export pipeline (integration test)

### 16. Add error tracking
- Integrate Sentry (or similar) for production error monitoring. The app currently has no visibility into production crashes.

### 17. Persistent OAuth sessions
- `server/routes/social.ts` stores OAuth states in an in-memory `Map`. Server restart loses all pending OAuth flows.
- Migrate to Redis or Supabase table with TTL.

---

## Phase 5: Accessibility & Mobile (ongoing)

### 18. Accessibility audit (WCAG 2.1 AA)
- Only 304 ARIA attributes across 111K lines of code (very low).
- Add `aria-label` to all icon-only buttons (LeftPanel, RightPanel, Timeline controls)
- Add `role="dialog"` to modals
- Add `<label>` elements to form inputs
- Verify color contrast ratios (4.5:1 minimum)
- Test with screen readers (VoiceOver, NVDA)

### 19. Mobile/tablet support
- Editor is desktop-only. For mobile:
  - Landing page & dashboard should be fully responsive (verify)
  - Editor could show "desktop only" message on small screens
  - Touch events for timeline scrubbing and canvas interactions
  - Test on iPhone SE, iPad, Android (Chrome)

---

## Phase 6: Future Features

### 20. Collaboration / multi-user
- Real-time collaboration on projects (Supabase Realtime or Liveblocks)
- Share project links for review

### 21. Template marketplace
- Schema exists (`sql/marketplace-royalties.sql`) but UI is basic.
- Add creator upload flow, review queue, revenue tracking.

### 22. Advanced AI features
- Scene-level AI editing ("make the character walk left")
- Auto-generate B-roll from script context
- AI-powered color grading / style transfer
- Voice cloning integration

### 23. Plugin / extension system
- Allow third-party templates, animations, and effects
- Plugin API for custom export targets

### 24. Offline / PWA support
- Service worker for offline editing
- Local-first architecture with sync when online

---

## Files Modified per Phase

| Phase | Files touched | Risk |
|-------|--------------|------|
| 1. Critical | ~10 files | Low — bug fixes, no architecture changes |
| 2. UX Polish | ~20 files | Low — additive UI changes |
| 3. Architecture | ~30 files | Medium — refactoring, needs careful testing |
| 4. Testing | New files only | None — purely additive |
| 5. Accessibility | ~50+ files | Low — attribute additions |
| 6. Future | New features | High — new architecture needed |
