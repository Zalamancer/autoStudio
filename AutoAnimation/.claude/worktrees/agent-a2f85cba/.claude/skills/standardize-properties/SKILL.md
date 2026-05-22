---
name: standardize-properties
description: Enforce Cinema design tokens and PanelSlider usage in all right-panel property editors. Use when creating or modifying any property panel, transform controls, or settings UI in the right panel.
user-invocable: true
---

# Standardize Properties Panel

Right-panel property editors MUST use the existing `PanelSlider` component from `@/components/ui/panel-controls`. NEVER create custom input components (InlineInput, NumberInput, custom drag handlers, etc.) — PanelSlider already handles pointer-lock drag, double-click edit, wheel scroll, shift-for-precision, and Cinema styling.

## Rules

### 1. Always use PanelSlider

```tsx
import { PanelSlider } from '@/components/ui/panel-controls'

// Label on the left, pill on the right (default)
<PanelSlider label="Opacity" value={opacity} onChange={setOpacity} min={0} max={100} step={1} suffix="%" />

// Label INSIDE the pill (for compact side-by-side layout)
<PanelSlider label="x" value={x} onChange={setX} min={-2000} max={2000} step={1} suffix="px" inline />
```

### 2. Side-by-side grouped inputs

When two values belong together (x/y, w/h), put a row label on the left and two `inline` PanelSliders side by side:

```tsx
<div className="flex items-center gap-3 mb-1">
  <span className="text-gray-400 text-sm shrink-0 w-16">Position</span>
  <div className="flex-1 flex gap-1.5">
    <PanelSlider label="x" value={x} onChange={setX} min={-2000} max={2000} step={1} suffix="px" inline className="flex-1" />
    <PanelSlider label="y" value={y} onChange={setY} min={-2000} max={2000} step={1} suffix="px" inline className="flex-1" />
  </div>
</div>
```

### 3. Cinema design tokens

| Token | Value | Usage |
|-------|-------|-------|
| Pill bg | `bg-[#2a2a2a]` | PanelSlider default (built in) |
| Pill hover | `hover:bg-[#333]` | PanelSlider hover (built in) |
| Pill active ring | `ring-1 ring-[#4a7eff]` | During drag (built in) |
| Label color | `text-gray-400` | Row labels (built in) |
| Value color | `text-white` | Values (built in) |
| Suffix color | `text-gray-500` | px, %, ° (built in) |
| Row border | `border-white/5` | Section dividers |
| Accent | `#4a7eff` | Active states, lock icon |
| Collapsible header | `bg-[#2a2a2a] hover:bg-[#3a3a3a]` | Expandable section headers |

### 4. Collapsible sections use thick Cinema rows

```tsx
<div className="rounded-lg overflow-hidden border border-white/5">
  <div
    onClick={() => setExpanded(!expanded)}
    className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] cursor-pointer"
  >
    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    <span className="text-xs font-medium text-gray-200">{label}</span>
  </div>
  {expanded && <div className="px-3 py-2.5">...</div>}
</div>
```

### 5. Empty states

```tsx
<div className="flex flex-col items-center justify-center py-16 text-gray-600">
  <Icon size={28} className="mb-3" />
  <span className="text-sm text-gray-400">No item selected</span>
  <span className="text-xs text-gray-600 mt-1">Select one on the canvas</span>
</div>
```

## What NOT to do

- **NEVER** create custom number inputs, inline inputs, or drag-to-scrub components
- **NEVER** use raw `<input type="number">` — always PanelSlider
- **NEVER** use PanelSelect for numeric values — PanelSlider handles those
- **NEVER** use custom font-mono styled spans for values
- **NEVER** skip the `suffix` prop — always show units (px, %, °, etc.)
- **NEVER** use `compact` when `inline` is what you need (compact just removes label width, inline puts label inside pill)

## Reference implementations

- `PartTransformControls.tsx` — Position (x/y inline), Scale (w/h inline + lock), Rotation, Z-Index
- `MediaPropertiesPanel.tsx` — Opacity, blur, brightness sliders
- `TextPropertiesPanel.tsx` — Font size, letter spacing, line height
- `ShapePropertiesPanel.tsx` — Corner radius, stroke width
