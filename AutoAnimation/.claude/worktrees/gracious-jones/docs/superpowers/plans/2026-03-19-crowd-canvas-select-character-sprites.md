# Crowd Canvas Selection & Character-Based Sprites Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make crowd groups clickable on the canvas, and allow users to assign saved characters to crowd groups with randomized clothing/hair per member.

**Architecture:** Two features built incrementally. Feature 1 adds hit-testing to the existing `<canvas>` element so clicking a crowd member selects its group and opens the right panel. Feature 2 extends `CrowdGroup` with an optional `characterId`, introduces an offscreen sprite renderer that pre-composites character variations (randomized hair/shirt/pants/shoes) at thumbnail scale, and stamps those cached bitmaps onto the crowd canvas instead of silhouettes.

**Tech Stack:** React 19, Zustand + Immer, Canvas 2D API, OffscreenCanvas / HTMLCanvasElement for sprite pre-rendering

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/canvas/CrowdLayer.tsx` | Enable pointer events, add click handler with hit-testing, draw character sprites when available |
| Modify | `src/stores/useCrowdStore.ts` | Add `characterId`, `randomizeParts` to CrowdGroup; add `spriteCache` state |
| Modify | `src/services/crowdGenerator.ts` | Add `spriteVariantIndex` to CrowdMember; generate per-member random sprite selections |
| Create | `src/services/crowdSpriteRenderer.ts` | Pre-render character variations to offscreen canvases; cache by (characterId, variantKey) |
| Modify | `src/components/layout/RightPanel/CrowdPropertiesPanel.tsx` | Add character picker dropdown and randomization toggles |
| Modify | `src/components/panels/CrowdPanel.tsx` | Show character thumbnail in group rows |

---

## Task 1: Canvas Click-to-Select Crowd Groups

**Files:**
- Modify: `src/components/canvas/CrowdLayer.tsx:64-79` (canvas element + hit-testing)
- Modify: `src/stores/useCrowdStore.ts` (already has `setSelectedGroupId`)

### Approach

The canvas currently has `pointerEvents: 'none'`. We change it to `'auto'` and add a click handler that:
1. Converts click coords to canvas-relative position
2. Iterates all visible groups' members, computes screen-space distance
3. Finds the closest member within a threshold (~20px)
4. Selects that member's group and opens the right panel

We also need to know which group a member belongs to. Currently `drawCrowdGroup` iterates members per group but doesn't track the mapping. We'll build a flat hit-test array during the draw loop.

- [ ] **Step 1: Add groupId to member positions for hit-testing**

In `CrowdLayer.tsx`, create a ref to store computed screen positions per frame:

```typescript
// After rafRef
const hitTargetsRef = useRef<{ gx: number; gy: number; groupId: string }[]>([])
```

Inside the `draw()` function, after clearing, build the hit-target array as members are drawn:

```typescript
const hitTargets: { gx: number; gy: number; groupId: string }[] = []

for (const group of groups) {
  if (!group.visible) continue
  if (frame < group.startFrame || frame >= group.endFrame) continue
  const members = membersCache[group.id]
  if (!members || members.length === 0) continue

  for (const member of members) {
    const t = frame / effectiveFps
    const sway = Math.sin(t * member.swaySpeed * 2 + member.swayPhase) * 3 * member.scale
    const bob = Math.sin(t * member.bobSpeed * 2 + member.bobPhase) * 2 * member.scale
    const cx = member.x * canvasWidth + sway
    const cy = member.y * canvasHeight + bob
    hitTargets.push({ gx: cx, gy: cy, groupId: group.id })
  }

  drawCrowdGroup(ctx, members, canvasWidth, canvasHeight, frame, effectiveFps)
}

hitTargetsRef.current = hitTargets
```

- [ ] **Step 2: Add click handler to canvas**

```typescript
import { useEditorStore } from '@/stores'

// Inside the component, before the return:
const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clickX = (e.clientX - rect.left) * scaleX
  const clickY = (e.clientY - rect.top) * scaleY

  const HIT_THRESHOLD = 20 // pixels
  let closest: { groupId: string; dist: number } | null = null

  for (const target of hitTargetsRef.current) {
    const dx = clickX - target.gx
    const dy = clickY - target.gy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < HIT_THRESHOLD && (!closest || dist < closest.dist)) {
      closest = { groupId: target.groupId, dist }
    }
  }

  if (closest) {
    useCrowdStore.getState().setSelectedGroupId(closest.groupId)
    useEditorStore.getState().setRightPanelTab('crowd-properties')
  }
}, [])
```

- [ ] **Step 3: Enable pointer events and attach handler**

Change the canvas element:

```tsx
<canvas
  ref={canvasRef}
  width={canvasWidth}
  height={canvasHeight}
  onClick={handleCanvasClick}
  style={{
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'auto',  // was 'none'
    zIndex: 4,
    cursor: 'pointer',
  }}
/>
```

- [ ] **Step 4: Verify click-to-select works**

Run: `npm run dev`
Test: Create a crowd group, click on a crowd member on canvas, verify the group gets selected in the left panel and right panel opens with its properties.

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/CrowdLayer.tsx
git commit -m "feat(crowd): add canvas click-to-select for crowd groups"
```

---

## Task 2: Extend CrowdGroup and CrowdMember Types for Character Support

**Files:**
- Modify: `src/stores/useCrowdStore.ts:8-22` (CrowdGroup interface)
- Modify: `src/services/crowdGenerator.ts:36-49` (CrowdMember interface + generation)

- [ ] **Step 1: Add character fields to CrowdGroup**

In `useCrowdStore.ts`, extend `CrowdGroup`:

```typescript
export interface CrowdGroup {
  // ... existing fields ...
  /** Optional: use a saved character instead of silhouettes */
  characterId?: string
  /** Which body parts to randomize per member (default: all clothing) */
  randomizeParts: CharacterPartTab[]
}
```

Import the type:
```typescript
import type { CharacterPartTab } from '@/stores/useSavedCharactersStore'
```

Update `addGroup` default:
```typescript
randomizeParts: ['hair', 'shirt', 'pants', 'shoes'],
```

Add `characterId` to the `needsRegen` check:
```typescript
updates.characterId !== undefined ||
updates.randomizeParts !== undefined ||
```

- [ ] **Step 2: Add sprite variant data to CrowdMember**

In `crowdGenerator.ts`, extend `CrowdMember`:

```typescript
export interface CrowdMember {
  // ... existing fields ...
  /** Per-part sprite indices for character-based rendering */
  spriteSelections?: Record<string, number>
}
```

- [ ] **Step 3: Generate random sprite selections during crowd generation**

Add an optional `characterSpriteInfo` parameter to `generateCrowd`:

```typescript
export interface CharacterSpriteInfo {
  /** Available sprite count per body part */
  spriteCounts: Record<string, number>
  /** Which parts to randomize */
  randomizeParts: string[]
  /** Fixed selections for non-randomized parts */
  fixedSelections: Record<string, number>
}

export function generateCrowd(
  config: CrowdGroupConfig,
  characterInfo?: CharacterSpriteInfo,
): CrowdMember[]
```

Inside the member generation loop, after `heightRatio`:

```typescript
let spriteSelections: Record<string, number> | undefined
if (characterInfo) {
  spriteSelections = { ...characterInfo.fixedSelections }
  for (const part of characterInfo.randomizeParts) {
    const count = characterInfo.spriteCounts[part]
    if (count > 0) {
      spriteSelections[part] = Math.floor(rng() * count)
    }
  }
}
```

Push `spriteSelections` into the member.

- [ ] **Step 4: Update store's generateMembers to pass character info**

In `useCrowdStore.ts`, update the `generateMembers` helper:

```typescript
import { useSavedCharactersStore } from './useSavedCharactersStore'

function generateMembers(group: CrowdGroup): CrowdMember[] {
  let characterInfo: CharacterSpriteInfo | undefined

  if (group.characterId) {
    const saved = useSavedCharactersStore.getState().characters.find(
      (c) => c.id === group.characterId
    )
    if (saved?.bodyParts) {
      const spriteCounts: Record<string, number> = {}
      const fixedSelections: Record<string, number> = {}
      for (const [part, urls] of Object.entries(saved.bodyParts)) {
        spriteCounts[part] = urls.length
        fixedSelections[part] = saved.selectedSprites?.[part as CharacterPartTab] ?? 0
      }
      characterInfo = {
        spriteCounts,
        randomizeParts: group.randomizeParts,
        fixedSelections,
      }
    }
  }

  return generateCrowd({
    count: group.count,
    pattern: group.pattern,
    seed: group.seed,
    area: group.area,
    colors: group.colors,
    animSpeed: group.animSpeed,
  }, characterInfo)
}
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/useCrowdStore.ts src/services/crowdGenerator.ts
git commit -m "feat(crowd): extend types for character-based crowd members"
```

---

## Task 3: Offscreen Character Sprite Renderer

**Files:**
- Create: `src/services/crowdSpriteRenderer.ts`

This is the core rendering engine. It pre-composites character sprite variations onto small offscreen canvases, then caches them as `ImageBitmap` for fast stamping onto the main crowd canvas.

- [ ] **Step 1: Create the sprite renderer service**

```typescript
/**
 * Pre-renders character sprite variations for crowd rendering.
 *
 * Loads character body-part images, composites them at thumbnail size
 * onto offscreen canvases, and caches the results as ImageBitmap.
 * Each unique combination of sprite indices gets its own cached bitmap.
 */

import type { SavedCharacter, CharacterPartTab } from '@/stores/useSavedCharactersStore'

const SPRITE_SIZE = 64 // px — thumbnail size for crowd members
const DRAW_ORDER: CharacterPartTab[] = ['body', 'pants', 'shoes', 'shirt', 'head', 'hair']

// Cache: characterId -> variantKey -> ImageBitmap
const spriteCache = new Map<string, Map<string, ImageBitmap>>()
// Image loading cache: url -> HTMLImageElement (loaded)
const imageCache = new Map<string, HTMLImageElement>()

/** Build a unique key from sprite selections */
function variantKey(selections: Record<string, number>): string {
  return DRAW_ORDER.map((p) => `${p}:${selections[p] ?? 0}`).join('|')
}

/** Load an image URL, with caching */
function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageCache.set(url, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

/** Get or render a character variant bitmap */
export async function getCharacterSpriteBitmap(
  character: SavedCharacter,
  spriteSelections: Record<string, number>,
): Promise<ImageBitmap | null> {
  if (!character.bodyParts) return null

  const charCache = spriteCache.get(character.id) ?? new Map()
  spriteCache.set(character.id, charCache)

  const key = variantKey(spriteSelections)
  const cached = charCache.get(key)
  if (cached) return cached

  // Render the variant
  const canvas = document.createElement('canvas')
  canvas.width = SPRITE_SIZE
  canvas.height = SPRITE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Load and draw each body part layer in order
  for (const part of DRAW_ORDER) {
    const urls = character.bodyParts[part]
    if (!urls || urls.length === 0) continue

    const idx = spriteSelections[part] ?? 0
    const url = urls[Math.min(idx, urls.length - 1)]
    if (!url) continue

    try {
      const img = await loadImage(url)
      // Draw part centered, scaled to fit the thumbnail
      const partTransform = character.partTransforms?.[part]
      if (partTransform && !partTransform.visible) continue

      ctx.drawImage(img, 0, 0, SPRITE_SIZE, SPRITE_SIZE)
    } catch {
      // Skip failed loads
    }
  }

  const bitmap = await createImageBitmap(canvas)
  charCache.set(key, bitmap)
  return bitmap
}

/** Pre-render all variants needed for a crowd group */
export async function preRenderCrowdSprites(
  character: SavedCharacter,
  memberSelections: Record<string, number>[],
): Promise<Map<string, ImageBitmap>> {
  const results = new Map<string, ImageBitmap>()
  const uniqueKeys = new Set(memberSelections.map(variantKey))

  await Promise.all(
    [...uniqueKeys].map(async (key) => {
      const selections = memberSelections.find((s) => variantKey(s) === key)
      if (!selections) return
      const bitmap = await getCharacterSpriteBitmap(character, selections)
      if (bitmap) results.set(key, bitmap)
    }),
  )

  return results
}

/** Clear cache for a specific character (when character changes) */
export function clearCharacterSpriteCache(characterId: string): void {
  const charCache = spriteCache.get(characterId)
  if (charCache) {
    for (const bitmap of charCache.values()) bitmap.close()
    spriteCache.delete(characterId)
  }
}

/** Clear all caches */
export function clearAllSpriteCaches(): void {
  for (const charCache of spriteCache.values()) {
    for (const bitmap of charCache.values()) bitmap.close()
  }
  spriteCache.clear()
  imageCache.clear()
}

export { variantKey }
```

- [ ] **Step 2: Commit**

```bash
git add src/services/crowdSpriteRenderer.ts
git commit -m "feat(crowd): add offscreen character sprite renderer with caching"
```

---

## Task 4: Integrate Character Sprites into CrowdLayer Rendering

**Files:**
- Modify: `src/components/canvas/CrowdLayer.tsx`
- Modify: `src/stores/useCrowdStore.ts` (add sprite bitmap cache state)

- [ ] **Step 1: Add sprite bitmap cache to the store**

In `useCrowdStore.ts`, add a non-immer ref for bitmap caches (ImageBitmaps aren't serializable):

```typescript
// Outside the store — module-level cache (not in Zustand, not serializable)
let spriteBitmapCache: Record<string, Map<string, ImageBitmap>> = {}

export function getSpriteBitmaps(groupId: string): Map<string, ImageBitmap> | undefined {
  return spriteBitmapCache[groupId]
}

export function setSpriteBitmaps(groupId: string, bitmaps: Map<string, ImageBitmap>): void {
  spriteBitmapCache[groupId] = bitmaps
}

export function clearSpriteBitmaps(groupId: string): void {
  const cache = spriteBitmapCache[groupId]
  if (cache) {
    for (const bm of cache.values()) bm.close()
    delete spriteBitmapCache[groupId]
  }
}
```

- [ ] **Step 2: Pre-render sprites when characterId changes**

In `CrowdLayer.tsx`, add an effect that pre-renders character sprites when a group has a `characterId`:

```typescript
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { preRenderCrowdSprites, variantKey } from '@/services/crowdSpriteRenderer'
import { getSpriteBitmaps, setSpriteBitmaps } from '@/stores/useCrowdStore'

useEffect(() => {
  let cancelled = false

  async function renderSprites() {
    for (const group of groups) {
      if (!group.characterId) continue
      const members = membersCache[group.id]
      if (!members) continue

      const character = useSavedCharactersStore.getState().characters.find(
        (c) => c.id === group.characterId
      )
      if (!character?.bodyParts) continue

      const selections = members
        .filter((m) => m.spriteSelections)
        .map((m) => m.spriteSelections!)

      if (selections.length === 0) continue

      const bitmaps = await preRenderCrowdSprites(character, selections)
      if (!cancelled) {
        setSpriteBitmaps(group.id, bitmaps)
      }
    }
  }

  renderSprites()
  return () => { cancelled = true }
}, [groups, membersCache])
```

- [ ] **Step 3: Draw character sprites instead of silhouettes**

Modify the `drawCrowdGroup` function to accept an optional bitmaps map:

```typescript
function drawCrowdGroup(
  ctx: CanvasRenderingContext2D,
  members: CrowdMember[],
  canvasWidth: number,
  canvasHeight: number,
  frame: number,
  fps: number,
  spriteBitmaps?: Map<string, ImageBitmap>,
) {
  const t = frame / fps

  for (const member of members) {
    const sway = Math.sin(t * member.swaySpeed * 2 + member.swayPhase) * 3 * member.scale
    const bob = Math.sin(t * member.bobSpeed * 2 + member.bobPhase) * 2 * member.scale
    const cx = member.x * canvasWidth + sway
    const cy = member.y * canvasHeight + bob
    const baseSize = Math.min(canvasWidth, canvasHeight) * 0.025
    const s = baseSize * member.scale

    ctx.save()
    ctx.globalAlpha = member.opacity

    // Try character sprite first
    if (member.spriteSelections && spriteBitmaps) {
      const key = variantKey(member.spriteSelections)
      const bitmap = spriteBitmaps.get(key)
      if (bitmap) {
        const spriteW = s * 2.2
        const spriteH = s * 2.2
        ctx.drawImage(bitmap, cx - spriteW / 2, cy - spriteH * 0.6, spriteW, spriteH)
        ctx.restore()
        continue
      }
    }

    // Fallback: silhouette
    const bodyW = s * 0.9
    const bodyH = s * 1.4 * member.heightRatio
    const bodyX = cx - bodyW / 2
    const bodyY = cy - bodyH * 0.3

    ctx.fillStyle = member.outfitColor
    ctx.beginPath()
    ctx.roundRect(bodyX, bodyY, bodyW, bodyH, s * 0.2)
    ctx.fill()

    const headR = s * 0.35
    const headY = bodyY - headR * 0.6

    ctx.fillStyle = member.skinColor
    ctx.beginPath()
    ctx.ellipse(cx, headY, headR, headR * 1.1, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
```

Update the draw loop to pass bitmaps:

```typescript
const bitmaps = getSpriteBitmaps(group.id)
drawCrowdGroup(ctx, members, canvasWidth, canvasHeight, frame, effectiveFps, bitmaps)
```

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/CrowdLayer.tsx src/stores/useCrowdStore.ts
git commit -m "feat(crowd): render character sprites on crowd canvas with silhouette fallback"
```

---

## Task 5: Character Picker UI in Right Panel

**Files:**
- Modify: `src/components/layout/RightPanel/CrowdPropertiesPanel.tsx`

- [ ] **Step 1: Add character picker dropdown**

Add a new "Character" section at the top of CrowdPropertiesPanel, before the Layout section:

```typescript
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { PanelToggle } from '@/components/ui/panel-controls'

// Inside CrowdPropertiesPanel, before the return:
const savedCharacters = useSavedCharactersStore((s) => s.characters)

const characterOptions = [
  { value: '', label: 'None (Silhouettes)' },
  ...savedCharacters.map((c) => ({
    value: c.id,
    label: c.name,
  })),
]
```

Add the section JSX before the Layout section:

```tsx
{/* Character section */}
<div className="space-y-3">
  <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Character</h4>
  <PanelSelect
    label="Source"
    value={group.characterId ?? ''}
    onChange={(v) => updateGroup(group.id, { characterId: v || undefined })}
    options={characterOptions}
  />

  {group.characterId && (
    <>
      <h4 className="text-[10px] text-zinc-500 font-medium mt-2">Randomize Per Member</h4>
      {(['hair', 'shirt', 'pants', 'shoes'] as const).map((part) => (
        <PanelToggle
          key={part}
          label={part.charAt(0).toUpperCase() + part.slice(1)}
          checked={group.randomizeParts.includes(part)}
          onChange={(checked) => {
            const current = group.randomizeParts
            const next = checked
              ? [...current, part]
              : current.filter((p) => p !== part)
            updateGroup(group.id, { randomizeParts: next })
          }}
        />
      ))}
    </>
  )}
</div>

<div className="border-t border-white/5" />
```

- [ ] **Step 2: Show character name in left panel group rows**

In `CrowdPanel.tsx`, add character name to the subtitle:

```typescript
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'

// Inside CrowdGroupRow:
const characters = useSavedCharactersStore((s) => s.characters)
const charName = group.characterId
  ? characters.find((c) => c.id === group.characterId)?.name
  : null
```

Update the subtitle:
```tsx
<div className="text-[9px] text-gray-500 mt-0.5">
  {group.count} members &middot; {group.pattern}
  {charName && <> &middot; {charName}</>}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/RightPanel/CrowdPropertiesPanel.tsx src/components/panels/CrowdPanel.tsx
git commit -m "feat(crowd): add character picker and randomization toggles to crowd UI"
```

---

## Task 6: End-to-End Verification

- [ ] **Step 1: Verify canvas click-to-select**

Run `npm run dev`. Create two crowd groups with different patterns. Click on crowd members in each group. Verify:
- Clicking a member selects the correct group in left panel
- Right panel shows that group's properties
- Clicking empty space does nothing

- [ ] **Step 2: Verify character assignment**

1. Create a saved character (or use an existing one) with multiple hair/shirt/pants variations
2. Create a crowd group, assign the character via the "Source" dropdown
3. Verify crowd members render as actual character sprites instead of silhouettes
4. Toggle randomization checkboxes — verify members get different clothing combinations
5. Remove character assignment — verify fallback to silhouettes

- [ ] **Step 3: Verify performance**

Test with 150+ members. Monitor frame rate in Chrome DevTools Performance tab. The offscreen pre-rendering + ImageBitmap stamping should keep 60fps. If not, reduce SPRITE_SIZE or add a quality/count limiter.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Fix any errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(crowd): complete character-based crowd system with canvas selection"
```
