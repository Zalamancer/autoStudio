/**
 * Crowd Properties Panel — Right panel for editing crowd group properties.
 *
 * Shown when a crowd group is selected from the left CrowdPanel.
 * Follows the same pattern as CameraPropertiesPanel.
 */

import { RefreshCw } from 'lucide-react'
import { PanelSlider, PanelSelect, PanelToggle } from '@/components/ui/panel-controls'
import { useCrowdStore } from '@/stores/useCrowdStore'
import { useSavedCharactersStore, type CharacterPartTab } from '@/stores/useSavedCharactersStore'
import { DEFAULT_CROWD_PALETTES, type CrowdPattern } from '@/services/crowdGenerator'
import { Users } from 'lucide-react'

const PATTERN_OPTIONS: { value: CrowdPattern; label: string }[] = [
  { value: 'row', label: 'Row' },
  { value: 'scattered', label: 'Scattered' },
  { value: 'arc', label: 'Arc' },
  { value: 'bleachers', label: 'Bleachers' },
  { value: 'random', label: 'Random' },
]

const RANDOMIZABLE_PARTS: { part: CharacterPartTab; label: string }[] = [
  { part: 'hair', label: 'Hair' },
  { part: 'shirt', label: 'Shirt' },
  { part: 'pants', label: 'Pants' },
  { part: 'shoes', label: 'Shoes' },
  { part: 'head', label: 'Head' },
  { part: 'body', label: 'Body' },
]

export function CrowdPropertiesPanel() {
  const selectedGroupId = useCrowdStore((s) => s.selectedGroupId)
  const groups = useCrowdStore((s) => s.groups)
  const updateGroup = useCrowdStore((s) => s.updateGroup)
  const regenerate = useCrowdStore((s) => s.regenerate)
  const savedCharacters = useSavedCharactersStore((s) => s.characters)

  const group = groups.find((g) => g.id === selectedGroupId)

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <Users size={28} className="mb-3" />
        <span className="text-sm text-gray-400">No group selected</span>
        <span className="text-xs text-gray-600 mt-1">Select a crowd group from the left panel</span>
      </div>
    )
  }

  const characterOptions = [
    { value: '', label: 'None (Silhouettes)' },
    ...savedCharacters.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ]

  return (
    <div className="p-4 space-y-4">
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
            {RANDOMIZABLE_PARTS.map(({ part, label }) => (
              <PanelToggle
                key={part}
                label={label}
                checked={group.randomizeParts.includes(part)}
                onChange={(checked) => {
                  const next = checked
                    ? [...group.randomizeParts, part]
                    : group.randomizeParts.filter((p) => p !== part)
                  updateGroup(group.id, { randomizeParts: next })
                }}
              />
            ))}
          </>
        )}
      </div>

      <div className="border-t border-white/5" />

      {/* Layout section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Layout</h4>
        <PanelSlider
          label="Count"
          value={group.count}
          min={5}
          max={200}
          step={1}
          onChange={(v) => updateGroup(group.id, { count: v })}
        />
        <PanelSelect
          label="Pattern"
          value={group.pattern}
          onChange={(v) => updateGroup(group.id, { pattern: v as CrowdPattern })}
          options={PATTERN_OPTIONS}
        />
        <PanelSlider
          label="Seed"
          value={group.seed}
          min={0}
          max={999999}
          step={1}
          onChange={(v) => useCrowdStore.getState().setSeed(group.id, v)}
        />
        <button
          onClick={() => regenerate(group.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] text-accent hover:bg-accent/10 transition-colors"
        >
          <RefreshCw size={10} />
          Randomize Seed
        </button>
      </div>

      <div className="border-t border-white/5" />

      {/* Animation section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Animation</h4>
        <PanelSlider
          label="Speed"
          value={group.animSpeed}
          min={0}
          max={3}
          step={0.1}
          precision={1}
          onChange={(v) => updateGroup(group.id, { animSpeed: v })}
        />
        <div className="grid grid-cols-2 gap-2">
          <PanelSlider
            label="Start"
            value={group.startFrame}
            min={0}
            max={9999}
            step={1}
            onChange={(v) => updateGroup(group.id, { startFrame: v })}
            inline
          />
          <PanelSlider
            label="End"
            value={group.endFrame}
            min={0}
            max={9999}
            step={1}
            onChange={(v) => updateGroup(group.id, { endFrame: v })}
            inline
          />
        </div>
      </div>

      <div className="border-t border-white/5" />

      {/* Area bounds section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Area Bounds</h4>
        <div className="grid grid-cols-2 gap-2">
          <PanelSlider
            label="X"
            value={group.area.x}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            onChange={(v) => updateGroup(group.id, { area: { ...group.area, x: v } })}
            inline
          />
          <PanelSlider
            label="Y"
            value={group.area.y}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            onChange={(v) => updateGroup(group.id, { area: { ...group.area, y: v } })}
            inline
          />
          <PanelSlider
            label="W"
            value={group.area.w}
            min={0.05}
            max={1}
            step={0.01}
            precision={2}
            onChange={(v) => updateGroup(group.id, { area: { ...group.area, w: v } })}
            inline
          />
          <PanelSlider
            label="H"
            value={group.area.h}
            min={0.05}
            max={1}
            step={0.01}
            precision={2}
            onChange={(v) => updateGroup(group.id, { area: { ...group.area, h: v } })}
            inline
          />
        </div>
      </div>

      {/* Color palette section — only shown when using silhouettes */}
      {!group.characterId && (
        <>
          <div className="border-t border-white/5" />
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Color Palette</h4>
            <div className="flex flex-wrap gap-1.5">
              {(group.colors.length > 0 ? group.colors : DEFAULT_CROWD_PALETTES).map((pair, i) => (
                <div
                  key={i}
                  className="flex rounded-md overflow-hidden border border-white/10"
                  title={`Skin: ${pair[0]}, Outfit: ${pair[1]}`}
                >
                  <div className="w-4 h-4" style={{ backgroundColor: pair[0] }} />
                  <div className="w-4 h-4" style={{ backgroundColor: pair[1] }} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
