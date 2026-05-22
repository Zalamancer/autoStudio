# ProAnimate Polish Audit — 2026-03-26

5 specialized agents audited accessibility, performance, security, UI consistency, and UX gaps.
A devil's advocate agent then challenged every finding, corrected errors, and identified blind spots.

---

## Audit Corrections (Devil's Advocate)

| Original Claim | Corrected Reality |
|----------------|-------------------|
| CharacterLayer has 37 useEffects | Actually **19** (inflated 2x) |
| 4/60 canvas components memoized | Actually **21/60** with 26 memo calls (undercounted 5x) |
| 50+ @ts-ignore comments | Actually **2** in entire src/ |
| Single ErrorBoundary for entire app | `PanelErrorBoundary` also exists (underutilized, but present) |
| .env keys exposed in repository | .env is in .gitignore. Real issue is VITE_ prefix compiling keys into production bundle |
| ~150 files of dead code | Needs qualification: some "deactivated" features are still imported/rendered (AudioReactive in VideoCanvas), others are truly dead (FaceSwap commented out) |
| Z-index chaos (40+ values) | 649 z-index refs across 250 files, but most are in templates/Remotion layers (semantic layer ordering, not UI stacking). No evidence of actual stacking bugs |

---

## TIER 1: CRITICAL

### 1.1 Frontend API Keys Exposed in Production Bundle
- **Status:** UNFIXED
- **Severity:** CRITICAL (financial risk)
- **Details:** 48 direct Gemini API calls from frontend using `import.meta.env.VITE_*` keys. Anyone can extract keys from the bundle via DevTools.
- **Files:**
  - `src/services/personCloneService.ts` — calls Gemini directly with API key
  - `src/components/panels/VoicesPanel.tsx` — ElevenLabs key in browser
  - `src/services/brandDirector.ts`, `photoToAvatar.ts`, `agentWorkflows.ts`, `componentGenerator.ts`, `sceneDetector.ts`, `templateAnalyzer.ts` — more direct calls
- **Fix:** Server-side proxy endpoints. Frontend calls `/api/proxy/gemini`, backend holds the key. Remove all `VITE_*_API_KEY` from frontend code.

### 1.2 Unauthenticated API Endpoints
- **Status:** FIXED (commits `0ea5a78`, `a40326b`)
- **Severity:** CRITICAL (data poisoning, cost abuse)
- **Details:** 8 endpoints secured: `/api/template-ratings` (+ rate limiter), `/api/reward-model`, `/api/generate-templates`, `/api/generate-full-sheet`, `/api/generate-emotion-heads`, `/api/generate-all-sheets`, `/api/proxy/audio`
- **Files:** `server/index.ts`

### 1.3 RightPanel.tsx Monolith (7,495 lines, 148 store references)
- **Status:** UNFIXED
- **Severity:** CRITICAL (user-visible jank)
- **Details:** Full store destructuring (`const { ...all } = useStore()`) causes re-render on every store change. Every keystroke in any input triggers re-renders across entire right panel.
- **Files:** `src/components/layout/RightPanel/RightPanel.tsx`
- **Fix:** Extract distinct panel sections into own files with own store subscriptions. Replace full destructuring with selectors.

### 1.4 Timeline: 0/38 Components Memoized
- **Status:** FIXED (commits `adc6dd2`, `fb10fef`)
- **Severity:** CRITICAL (30fps re-render cascade during playback)
- **Details:** 37 components wrapped in React.memo. 4 expensive list-rendered internal components also memoized (CharacterGroup, ObjectKeyframeRow, PoseTrackRow, PoseTrackRow3D). Inline callbacks restructured in HTMLTemplateTrack, MotionGraphicTrack, MediaTrack. Stale useCallback deps fixed in ZoomControls, MobilePlaybackToolbar.

### 1.5 Canvas: 39/60 Components Unmemoized
- **Status:** UNFIXED
- **Severity:** HIGH
- **Files:** `src/components/canvas/` — 39 files without React.memo
- **Fix:** Add React.memo with proper prop comparison to remaining 39 components.

---

## TIER 2: HIGH (Structural / Architecture)

### 2.1 Three.js Not Lazy-Loaded (Despite Docs Claiming Otherwise)
- **Status:** FIXED (commits `aacd6f4`, `27d35ac`)
- **Severity:** HIGH (500-700KB loaded for every user)
- **Details:** Fixed ALL static import paths:
  - VideoCanvas.tsx: ThreeCanvas lazy-loaded, gated behind `has3DCharacters`
  - EditorLayout.tsx + MobileEditorLayout.tsx: RigEditor3DViewport lazy-loaded
  - RightPanel.tsx: DragField/TransformRow extracted to BonePropertyControls.tsx (no Three.js dep)
  - vite.config.ts: vendor-three chunk includes three, @react-three/fiber, @react-three/drei, three-stdlib, maath
  - CONTEXT.md + docs/codebase/08-canvas.md updated

### 2.2 Store Coupling Time Bomb (229 cross-store getState calls)
- **Status:** UNFIXED
- **Severity:** HIGH (architectural debt)
- **Details:** 229 `getState()` calls across 44 store files. `useProjectStore` alone calls `getState()` 71 times importing 16 other stores. Can't refactor any store without cascading risk.
- **Fix:** Long-term: event bus or store composition. Short-term: document dependencies, add integration tests.

### 2.3 Autosave Race Conditions
- **Status:** UNFIXED
- **Severity:** HIGH (potential data loss)
- **Details:** `saveProject` uses `isSaving` flag with no mutex. Autosave and manual save can fire concurrently. `isSavingRef` (autosave) and `isSaving` (store) are separate refs that can disagree.
- **Files:** `src/hooks/useAutoSave.ts`, `src/stores/useProjectStore.ts`
- **Fix:** Add save queue/mutex. Ensure only one save operation runs at a time.

### 2.4 Autosave Fingerprinting Runs at 30-60hz
- **Status:** UNFIXED
- **Severity:** HIGH (performance during editing)
- **Details:** `useAutoSave` subscribes to 15 stores. On every change, `createStateFingerprint()` calls `getState()` on all 15 + `JSON.stringify`. During timeline scrubbing this fires every frame. Debounce only delays save, not fingerprinting.
- **Files:** `src/hooks/useAutoSave.ts`
- **Fix:** Debounce the fingerprinting itself, not just the save trigger.

### 2.5 Testing Coverage Is Functionally Zero
- **Status:** UNFIXED
- **Severity:** HIGH (regressions guaranteed)
- **Details:** 13 test files for 168 features. Zero component tests, zero integration tests, zero store tests. Only utility function tests.
- **Files:** `src/utils/__tests__/`, `src/services/__tests__/`
- **Fix:** Add integration tests for critical paths: save/load, export, orchestrator pipeline.

### 2.6 No Bundle Analysis
- **Status:** UNFIXED
- **Details:** No Vite bundle visualizer. vite.config.ts has manual chunks for react/supabase/lottie/zustand/gsap but Three.js (35 files) is NOT chunk-split.
- **Fix:** Add `rollup-plugin-visualizer` to vite.config.ts. Set bundle size budgets.

---

## TIER 3: HIGH (UX / Error Handling)

### 3.1 Panel-Level Error Boundaries Underutilized
- **Status:** UNFIXED
- **Details:** `PanelErrorBoundary` exists but only wraps 3 sections in VideoCanvas. Major panels (RecordingsPanel, ExportPanel, Character3DPanel) crash the entire app on render errors.
- **Fix:** Wrap each major panel in `PanelErrorBoundary`.

### 3.2 Destructive Operations Use window.confirm()
- **Status:** UNFIXED
- **Files:** `RecordingsPanel.tsx:156`, `PixelArtCharacterPropertiesPanel.tsx:448`, `Character3DPanel.tsx`
- **Fix:** Custom confirmation modal with undo option.

### 3.3 No prefers-reduced-motion Support
- **Status:** UNFIXED
- **Details:** 1 instance in entire codebase (bonerigging CSS). 2,080+ animation/transition properties.
- **Fix:** Global `@media (prefers-reduced-motion: reduce)` rule disabling non-essential animations.

### 3.4 Modal ModalShell.tsx Lacks ARIA Semantics
- **Status:** UNFIXED
- **Files:** `src/components/modals/ModalShell.tsx:65-74`
- **Fix:** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.

### 3.5 Export Errors Show Raw Technical Messages
- **Status:** UNFIXED
- **Files:** `src/components/panels/ExportPanel.tsx:860-875`
- **Fix:** Wrap errors in user-friendly messages with recovery actions.

### 3.6 No Timeouts on AI API Calls
- **Status:** UNFIXED
- **Files:** `src/services/nanoBanana2.ts`, `src/services/personCloneService.ts`, etc.
- **Fix:** `Promise.race([fetch(...), timeout(30000)])` wrapper.

### 3.7 Silent .catch(console.error) Pattern
- **Status:** UNFIXED
- **Files:** `src/stores/useMediaStore.ts` (multiple), various services
- **Fix:** Add user notification on failure + retry logic.

### 3.8 Missing Empty States
- **Status:** UNFIXED
- **Files:** RecordingsPanel, Character3DPanel, AvatarPanel
- **Fix:** Add `<EmptyState>` component with CTA.

### 3.9 No Success Toast Notifications
- **Status:** UNFIXED
- **Files:** ProjectsPanel, Character3DPanel — save/upload succeed silently
- **Fix:** Add success toasts after operations.

---

## TIER 4: MEDIUM (UI Consistency / Dead Code)

### 4.1 Dead Code from Deactivated Features
- **Status:** FIXED (commits `e07d6e0`, `48d3abf`)
- **Details:** 37 files deleted, ~5,584 lines removed across two passes:
  - Pass 1: Face Swap (6 files), Apps (13 files), types refactored (faceSwap.ts → media.ts)
  - Pass 2 (after DA review): ContentScore, Pacing, SocialIntegration, ExportProfile, Moodboard panels/stores/services (16 files) — identified as unreachable behind ABSORBED_TAB_REDIRECT
  - LeftPanel.tsx cleaned: 10 lazy imports + 10 render cases removed
  - Dead types removed from editor.ts, audioExpanded.ts, media.ts
  - docs/feature-list.md, CONTEXT.md updated
- **Note:** AudioReactive and EffectBrowser kept (still actively imported/rendered)

### 4.2 Z-Index: No Token System
- **Status:** UNFIXED
- **Details:** No centralized z-index layer system. UI panels use ad-hoc values.
- **Fix:** Create `z-index.ts` token file. Replace UI z-index values (not template/Remotion ones).

### 4.3 200+ Hardcoded Hex Colors
- **Status:** UNFIXED
- **Details:** `#4a7eff` in 65+ places. `tokens.ts` exists but widely ignored.
- **Fix:** Consolidate to CSS variables or Tailwind theme extension.

### 4.4 Four Button Implementations
- **Status:** UNFIXED
- **Details:** IconButton, PanelActionButton, GlowButton, raw `<button>` with inline classes
- **Fix:** Consolidate into unified Button component with variants.

### 4.5 Color Conversion Functions Duplicated 10+ Times
- **Status:** UNFIXED
- **Details:** `hexToRgb`, `rgbToHex`, `rgbToHsv` in ColorPicker, canvas2dRenderer, colorExtraction, compositionEngine, gradientRenderer, 20+ template files
- **Fix:** Extract to shared `src/utils/color.ts`.

### 4.6 Only 5 aria-labels Across 100+ Components
- **Status:** UNFIXED
- **Fix:** Add aria-label to all icon-only buttons and unlabeled controls.

### 4.7 Timeline Not Keyboard Navigable
- **Status:** UNFIXED
- **Files:** `TimeRuler.tsx` — onMouseDown only, no onKeyDown handler
- **Fix:** Add Arrow/Home/End key navigation for seeking.

### 4.8 Color Contrast Fails WCAG AA
- **Status:** UNFIXED
- **Files:** TimeRuler `text-zinc-400` on `bg-zinc-900` (~3.5:1 contrast)
- **Fix:** Use lighter text colors (zinc-200/300) for critical labels.

### 4.9 Unauthenticated Rate-Limit-Free Expensive Endpoints
- **Status:** UNFIXED
- **Details:** Even authenticated endpoints lack rate limiting on expensive operations.
- **Files:** `server/routes/templateGeneration.ts`, `server/routes/rewardModel.ts`
- **Fix:** Add `aiRateLimiter` middleware.

### 4.10 Documentation Contradicts Code
- **Status:** FIXED (with 2.1)
- **Details:** `src/components/CONTEXT.md` updated to accurately describe lazy loading paths.

---

## Fix Priority Order

### Wave 1 (Highest ROI, parallel-safe) — DONE
1. ~~**1.2** Add requireAuth to unauthenticated routes~~ — FIXED (8 endpoints secured)
2. ~~**2.1** Lazy-load Three.js + fix CONTEXT.md~~ — FIXED (all static paths closed)
3. ~~**4.1** Delete dead code files~~ — FIXED (37 files, ~5,584 lines)
4. ~~**1.4** Memoize timeline components~~ — FIXED (37 components + internal helpers)
5. **1.1** API keys behind server proxies — UNFIXED (needs server proxy endpoints)

### Wave 2 (Performance, parallel-safe) — NEXT
6. **1.5** Memoize remaining canvas components
7. **2.4** Debounce autosave fingerprinting
8. **2.6** Add bundle visualizer
9. **1.3** Split RightPanel.tsx (7,495 lines)

### Wave 3 (Architecture, needs care)
10. **2.3** Fix autosave race conditions
11. **2.2** Document store dependencies (229 cross-store getState calls)

### Wave 4 (UX polish)
12. **3.1-3.9** Error boundaries, confirmations, empty states, toasts, ARIA

### Wave 5 (Design system)
13. **4.2-4.8** Z-index tokens, color tokens, button consolidation, a11y
