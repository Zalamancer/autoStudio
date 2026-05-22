# ProAnimate Mobile — Phase 3: Editor & Browse Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Users can browse templates from the server, customize them in an editor with live preview, and save/load projects.

**Architecture:** Browse screen fetches template catalog from `/api/v1/templates`, taps navigate to editor screen. Editor has a config form (generated from `FieldDescriptor[]`), live `AnimationPreview`, and save/load via Supabase projects API. Draft state persisted locally via MMKV for offline resilience.

**Tech Stack:** Expo Router, Zustand, @supabase/supabase-js, react-native-mmkv, @proanimate/core

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `mobile/src/services/api.ts` | REST API client wrapping /api/v1/ endpoints |
| Create | `mobile/src/stores/useTemplateStore.ts` | Template catalog state + fetch |
| Create | `mobile/src/stores/useProjectStore.ts` | Project CRUD + local draft persistence |
| Create | `mobile/src/stores/useEditorStore.ts` | Editor state (selected template, config overrides) |
| Create | `mobile/src/components/TemplateCard.tsx` | Gallery thumbnail card |
| Create | `mobile/src/components/ConfigEditor.tsx` | Dynamic form from FieldDescriptor[] |
| Create | `mobile/src/components/ColorPicker.tsx` | Simple color input |
| Modify | `mobile/app/(tabs)/browse.tsx` | Template gallery grid with fetch |
| Modify | `mobile/app/(tabs)/projects.tsx` | User's saved projects list |
| Create | `mobile/app/editor/[templateId].tsx` | Editor screen with preview + config |
| Create | `mobile/app/editor/_layout.tsx` | Editor stack layout |

---

## Task 1: API Client Service

**Files:**
- Create: `mobile/src/services/api.ts`

Wraps the /api/v1/ endpoints with auth token injection from Supabase session.

Key functions:
- `fetchTemplates(params?)` → GET /api/v1/templates
- `fetchTemplateById(id)` → GET /api/v1/templates/:id (includes full MotionDesignDescription)
- `fetchProjects()` → GET /api/v1/projects
- `createProject(data)` → POST /api/v1/projects
- `updateProject(id, data)` → PATCH /api/v1/projects/:id
- `deleteProject(id)` → DELETE /api/v1/projects/:id
- `submitRender(data)` → POST /api/v1/renders
- `pollRenderStatus(jobId)` → GET /api/v1/renders/:jobId

All requests include `Authorization: Bearer <jwt>` from the Supabase session. Handle 401 by triggering re-auth.

---

## Task 2: Template Store

**Files:**
- Create: `mobile/src/stores/useTemplateStore.ts`

Zustand store for template catalog:
- `templates: TemplateSummary[]` (list without full description)
- `loading: boolean`
- `error: string | null`
- `fetchTemplates()` — calls api.fetchTemplates(), caches in MMKV
- `selectedCategory: string | null`
- `searchQuery: string`
- Computed: `filteredTemplates` based on category + search

TemplateSummary matches what the list endpoint returns (no motionDesignDescription — that's fetched on detail).

---

## Task 3: Project Store with MMKV Draft Persistence

**Files:**
- Create: `mobile/src/stores/useProjectStore.ts`

Zustand store for projects:
- `projects: Project[]`
- `loading: boolean`
- `fetchProjects()` — calls api.fetchProjects()
- `createProject(data)` — calls api.createProject()
- `updateProject(id, data)` — calls api.updateProject()
- `deleteProject(id)` — calls api.deleteProject()
- `drafts: Record<string, DraftProject>` — local unsaved state in MMKV
- `saveDraft(templateId, config)` — persists to MMKV immediately
- `getDraft(templateId)` — retrieves from MMKV
- `clearDraft(templateId)` — removes after successful save

---

## Task 4: Editor Store

**Files:**
- Create: `mobile/src/stores/useEditorStore.ts`

Zustand store for the active editor session:
- `templateId: string | null`
- `description: MotionDesignDescription | null`
- `config: Record<string, unknown>` (user's overrides merged with defaultConfig)
- `loading: boolean`
- `loadTemplate(id)` — fetches full template via api.fetchTemplateById(), sets description + default config
- `updateConfig(key, value)` — updates single config field, auto-saves draft
- `resetConfig()` — resets to defaultConfig

---

## Task 5: TemplateCard Component

**Files:**
- Create: `mobile/src/components/TemplateCard.tsx`

A card for the gallery grid:
- Shows thumbnail image (or colored placeholder with first letter if no thumbnail)
- Template title
- Category tag
- onPress handler for navigation

---

## Task 6: ConfigEditor Component

**Files:**
- Create: `mobile/src/components/ConfigEditor.tsx`
- Create: `mobile/src/components/ColorPicker.tsx`

Dynamic form generated from `FieldDescriptor[]`:
- `text` → TextInput
- `color` → ColorPicker (grid of preset colors + hex input)
- `number` → Slider with min/max + numeric display
- `boolean` → Switch
- `text-array` → Comma-separated TextInput that splits into array
- `select` → Dropdown/picker from options[]

Fields grouped by `group` property with section headers.

---

## Task 7: Browse Screen — Template Gallery

**Files:**
- Modify: `mobile/app/(tabs)/browse.tsx`

Replace the test template with:
- FlatList grid (2 columns) of TemplateCards
- Pull-to-refresh
- Category filter chips at top
- Search bar
- Empty state when no templates
- Loading spinner
- Tap card → navigate to `/editor/[templateId]`

---

## Task 8: Projects Screen

**Files:**
- Modify: `mobile/app/(tabs)/projects.tsx`

Replace placeholder with:
- FlatList of saved projects
- Each item shows: name, template name, last updated, thumbnail
- Tap → navigate to editor with project data loaded
- Swipe to delete (with confirmation)
- Empty state
- Pull-to-refresh
- FAB or header button to create new project

---

## Task 9: Editor Screen

**Files:**
- Create: `mobile/app/editor/_layout.tsx`
- Create: `mobile/app/editor/[templateId].tsx`

The main editor screen:
- Top half: AnimationPreview (live preview of template with current config)
- Bottom half: ScrollView with ConfigEditor
- Header: back button, template name, "Save" button
- Save button → createProject or updateProject via projectStore
- Config changes auto-save draft to MMKV
- On mount: loadTemplate(templateId) from editorStore
- If draft exists for this template, restore it

Layout:
```
┌─────────────────────┐
│     Back   Title  Save│  ← Header
├─────────────────────┤
│                     │
│   AnimationPreview  │  ← 50% height, live updating
│                     │
├─────────────────────┤
│   Config Editor     │  ← ScrollView, 50% height
│   - Title: [____]   │
│   - Color: [●●●●]   │
│   - Speed: [===●==]  │
│   - ...             │
└─────────────────────┘
```
