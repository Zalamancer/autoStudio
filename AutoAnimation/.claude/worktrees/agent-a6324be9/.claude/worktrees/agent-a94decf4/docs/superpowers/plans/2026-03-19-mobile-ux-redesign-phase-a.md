# Mobile UX Redesign Phase A — Showcase + Templates Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the mobile app from empty to impressive with 50+ bundled templates in a TikTok-style auto-playing showcase feed.

**Architecture:** Hand-author 50+ MotionDesignDescription templates covering diverse visual styles (bounce, cinematic, neon, minimal, data-viz, etc). Bundle them in `mobile/src/data/templates.ts`. Replace the current browse grid with a full-screen snap-scrolling feed where animations auto-play. Auth gate moves from browse to save/export only.

**Tech Stack:** React Native FlatList with viewability config, DynamicRenderer, useAnimationDriver, Expo Router

**Spec:** `docs/superpowers/specs/2026-03-19-mobile-ux-redesign.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `mobile/src/data/templates.ts` | 50+ bundled MotionDesignDescription templates |
| Create | `mobile/app/(tabs)/showcase.tsx` | TikTok-style auto-playing feed (replaces browse) |
| Create | `mobile/src/components/ShowcaseCard.tsx` | Full-screen animation card with overlay |
| Modify | `mobile/app/(tabs)/_layout.tsx` | Rename Browse tab to Showcase |
| Modify | `mobile/app/_layout.tsx` | Remove auth gate from showcase, require for projects/settings |
| Modify | `mobile/app/index.tsx` | Redirect to showcase |
| Delete | `mobile/app/(tabs)/browse.tsx` | Replaced by showcase.tsx |

---

## Task 1: Author 50+ Bundled Templates

**Files:**
- Create: `mobile/src/data/templates.ts`

This is the bulk of the work. Each template is a complete `MotionDesignDescription` with elements, animations, config schema, and default config. Templates span these categories:

**Kinetic Typography (20+):** bounce, slide, scale, fade, elastic, cinematic, neon, glitch, typewriter, wave, etc.
**Social Media (10+):** quote cards, story templates, lower thirds, end screens, call-to-action
**Data Visualization (5+):** stat counters, progress bars, comparison, infographic
**Infographic (5+):** feature showcase, process timeline, list reveal
**Titles & Captions (10+):** title cards, subtitles, news tickers, notification popups

- [ ] **Step 1: Create the templates data file**

Write `mobile/src/data/templates.ts` with 50+ templates. Each template follows this structure:

```typescript
import type { MotionDesignDescription } from '@proanimate/core'

export interface BundledTemplate {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  featured: boolean
  configSchema: Array<{
    key: string
    label: string
    type: 'text' | 'color' | 'number' | 'boolean' | 'text-array' | 'select'
    defaultValue: unknown
    group: string
    options?: string[]
    min?: number
    max?: number
  }>
  defaultConfig: Record<string, unknown>
  motionDesignDescription: MotionDesignDescription
}

export const BUNDLED_TEMPLATES: BundledTemplate[] = [
  // ... 50+ templates
]

export function getFeaturedTemplates(): BundledTemplate[] {
  return BUNDLED_TEMPLATES.filter(t => t.featured)
}

export function getTemplatesByCategory(category: string): BundledTemplate[] {
  return BUNDLED_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: string): BundledTemplate | undefined {
  return BUNDLED_TEMPLATES.find(t => t.id === id)
}

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'kinetic-typography', label: 'Typography' },
  { id: 'social-media', label: 'Social' },
  { id: 'data-visualization', label: 'Data Viz' },
  { id: 'infographic', label: 'Infographic' },
  { id: 'titles', label: 'Titles' },
]
```

Each template's `motionDesignDescription` uses the element types that the mobile DynamicRenderer already supports: `text`, `rect`, `circle`, `counter`, `bar`, `group`, and their animation properties (`enter`, `hold`, `exit` with `from`/`to` + easing).

**IMPORTANT:** Because this file will be very large (50+ templates), break it into logical chunks. The agent implementing this should create each template with:
- Unique visual identity (different colors, layouts, animation styles)
- Meaningful default config values
- Proper configSchema so users can customize text, colors, timing
- At least 2-4 animated elements per template
- Varied easing functions (bounceOut, elasticOut, backOut, cubicOut, cubicInOut)
- Varied hold effects (float, pulse, breathe)
- Mix of positions (centered, left-aligned, multi-element layouts)

- [ ] **Step 2: Commit**

```bash
git add mobile/src/data/templates.ts
git commit -m "feat(mobile): add 50+ bundled MotionDesignDescription templates"
```

---

## Task 2: ShowcaseCard Component

**Files:**
- Create: `mobile/src/components/ShowcaseCard.tsx`

A full-screen card that renders a live animation with an info overlay.

- [ ] **Step 1: Create ShowcaseCard**

```typescript
// mobile/src/components/ShowcaseCard.tsx
import React, { useState, useCallback } from 'react'
import {
  View, Text, Pressable, StyleSheet, useWindowDimensions,
} from 'react-native'
import { useFrameCallback, runOnJS } from 'react-native-reanimated'
import { type MotionDesignDescription } from '@proanimate/core'
import { DynamicRenderer } from '../renderers/DynamicRenderer'
import { useAnimationDriver } from '../hooks/useAnimationDriver'

interface ShowcaseCardProps {
  template: {
    id: string
    title: string
    category: string
    defaultConfig: Record<string, unknown>
    motionDesignDescription: MotionDesignDescription
  }
  isVisible: boolean
  onUseTemplate: () => void
  cardHeight: number
}

export function ShowcaseCard({
  template,
  isVisible,
  onUseTemplate,
  cardHeight,
}: ShowcaseCardProps) {
  const { width: screenWidth } = useWindowDimensions()

  // Only run animation when card is visible
  const { progress: sharedProgress } = useAnimationDriver({
    durationMs: 5000,
    loop: true,
    autoPlay: isVisible,
  })

  const [progress, setProgress] = useState(0)

  useFrameCallback(() => {
    'worklet'
    if (isVisible) {
      runOnJS(setProgress)(sharedProgress.value)
    }
  })

  return (
    <View style={[styles.card, { height: cardHeight }]}>
      {/* Live animation */}
      <View style={styles.animationContainer}>
        {isVisible ? (
          <DynamicRenderer
            description={template.motionDesignDescription}
            config={template.defaultConfig}
            progress={progress}
            width={screenWidth}
            height={cardHeight - 100}
          />
        ) : (
          <View style={[styles.placeholder, {
            backgroundColor: template.motionDesignDescription.background?.includes('gradient')
              ? '#111'
              : (template.defaultConfig.bgColor as string) || '#111',
          }]} />
        )}
      </View>

      {/* Overlay info */}
      <View style={styles.overlay}>
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.title}>{template.title}</Text>
            <Text style={styles.category}>{template.category.replace(/-/g, ' ')}</Text>
          </View>
          <Pressable style={styles.useButton} onPress={onUseTemplate}>
            <Text style={styles.useButtonText}>Use Template</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000',
  },
  animationContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    background: undefined,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  category: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  useButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  useButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/ShowcaseCard.tsx
git commit -m "feat(mobile): ShowcaseCard — full-screen animation card with overlay"
```

---

## Task 3: Showcase Feed Screen

**Files:**
- Create: `mobile/app/(tabs)/showcase.tsx`
- Delete: `mobile/app/(tabs)/browse.tsx`

The TikTok-style auto-playing feed.

- [ ] **Step 1: Create showcase.tsx**

Key behaviors:
- FlatList with `pagingEnabled` + `snapToInterval` for snap scrolling
- `viewabilityConfig` to track which cards are visible
- Only pass `isVisible={true}` to the 1-2 currently visible cards
- Category filter chips at top (horizontal FlatList)
- Search bar (simple TextInput filter)
- Pull-to-refresh (for future server templates)
- "Use Template" tap → check auth → if logged in, open editor; if not, redirect to login

The screen imports `BUNDLED_TEMPLATES` and `CATEGORIES` from `mobile/src/data/templates.ts`.

```typescript
// Key implementation details:

// Snap scrolling config
const CARD_HEIGHT = screenHeight * 0.85

<FlatList
  data={filteredTemplates}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <ShowcaseCard
      template={item}
      isVisible={visibleIds.has(item.id)}
      onUseTemplate={() => handleUseTemplate(item)}
      cardHeight={CARD_HEIGHT}
    />
  )}
  snapToInterval={CARD_HEIGHT}
  decelerationRate="fast"
  showsVerticalScrollIndicator={false}
  viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
  onViewableItemsChanged={onViewableItemsChanged}
  windowSize={3}
  maxToRenderPerBatch={2}
  ListHeaderComponent={<CategoryFilters />}
/>
```

- [ ] **Step 2: Delete browse.tsx**

```bash
rm mobile/app/\(tabs\)/browse.tsx
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/\(tabs\)/showcase.tsx
git rm mobile/app/\(tabs\)/browse.tsx
git commit -m "feat(mobile): showcase feed — TikTok-style auto-playing template browser"
```

---

## Task 4: Update Navigation + Auth Flow

**Files:**
- Modify: `mobile/app/(tabs)/_layout.tsx` — rename Browse to Showcase
- Modify: `mobile/app/_layout.tsx` — allow showcase without auth
- Modify: `mobile/app/index.tsx` — redirect to showcase

- [ ] **Step 1: Update tab layout**

Change the Browse tab to Showcase:
- `name="browse"` → `name="showcase"`
- `title: 'Browse'` → `title: 'Showcase'`
- Icon symbol: `◈` → `▶` (play symbol for showcase)

- [ ] **Step 2: Update auth gate**

In `_layout.tsx`, change the auth redirect logic:
- Showcase tab is accessible without auth
- Projects and Settings require auth
- If unauthenticated user tries to access projects/settings, redirect to login

```typescript
useEffect(() => {
  if (loading) return
  const inAuthGroup = segments[0] === '(auth)'
  const inProtectedTab = segments[1] === 'projects' || segments[1] === 'settings'

  if (!user && !inAuthGroup && inProtectedTab) {
    router.replace('/(auth)/login')
  } else if (user && inAuthGroup) {
    router.replace('/(tabs)/showcase')
  }
}, [user, loading, segments])
```

- [ ] **Step 3: Update index redirect**

```typescript
import { Redirect } from 'expo-router'
export default function Index() {
  return <Redirect href="/(tabs)/showcase" />
}
```

- [ ] **Step 4: Update editor to handle auth-gated entry**

In `mobile/app/editor/[templateId].tsx`, add an auth check at the top:
```typescript
const { user } = useAuthStore()
const router = useRouter()

useEffect(() => {
  if (!user) {
    router.replace('/(auth)/login')
  }
}, [user])
```

- [ ] **Step 5: Commit**

```bash
git add mobile/app/\(tabs\)/_layout.tsx mobile/app/_layout.tsx mobile/app/index.tsx mobile/app/editor/\[templateId\].tsx
git commit -m "feat(mobile): update nav — showcase tab, auth-gated editor"
```

---

## Task 5: Wire Editor Store for Bundled Templates

**Files:**
- Modify: `mobile/src/stores/useEditorStore.ts`

Currently `loadTemplate` fetches from the server API. Add a path that loads from bundled templates.

- [ ] **Step 1: Add loadBundledTemplate method**

```typescript
import { getTemplateById as getBundledTemplate } from '../data/templates'

// Add to the store:
loadBundledTemplate: (id: string) => {
  const template = getBundledTemplate(id)
  if (!template) {
    set({ error: 'Template not found', loading: false })
    return
  }
  set({
    templateId: id,
    template: {
      id: template.id,
      title: template.title,
      description: template.description,
      category: template.category,
      tags: template.tags,
      thumbnailUrl: null,
      configSchema: template.configSchema,
      defaultConfig: template.defaultConfig,
      motionDesignDescription: template.motionDesignDescription as unknown as Record<string, unknown>,
    },
    description: template.motionDesignDescription,
    config: { ...template.defaultConfig },
    loading: false,
    error: null,
    projectId: null,
  })
},
```

Update the editor screen to try bundled first, then server:
```typescript
// In editor/[templateId].tsx useEffect:
const bundled = getBundledTemplate(templateId)
if (bundled) {
  loadBundledTemplate(templateId)
} else {
  loadTemplate(templateId) // server fetch
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/stores/useEditorStore.ts mobile/app/editor/\[templateId\].tsx
git commit -m "feat(mobile): editor loads bundled templates without server fetch"
```

---

## Phase A Completion Checklist

After all tasks:

- [ ] App opens to showcase feed with 50+ auto-playing templates
- [ ] Snap scrolling between full-screen cards is smooth
- [ ] Only visible cards run animations (performance)
- [ ] Category chips filter templates
- [ ] "Use Template" navigates to editor (auth check)
- [ ] Editor loads bundled templates instantly
- [ ] Tab bar shows Showcase / Projects / Settings

```bash
git add -A && git commit -m "milestone: Phase A complete — showcase feed with 50+ templates"
```
