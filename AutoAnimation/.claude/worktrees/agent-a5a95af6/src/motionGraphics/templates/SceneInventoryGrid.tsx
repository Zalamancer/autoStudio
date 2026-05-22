import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InventoryGridConfig {
  title: string
  items: string[]
  itemNames: string[]
  gridCols: number
  bgColor: string
  slotColor: string
  selectedColor: string
  textColor: string
  frameColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneInventoryGridComponent({ config, frame, fps, progress }: MotionGraphicProps<InventoryGridConfig>) {
  const { title, items, itemNames, gridCols, bgColor, slotColor, selectedColor, textColor, frameColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress > 0.88 ? (progress - 0.88) / 0.12 : 0
  const mainOpacity = easeOutCubic(enterProgress) * (1 - easeOutCubic(exitProgress))

  // Total slots (fill empty slots)
  const totalSlots = Math.max(items.length, gridCols * 3)
  const gridRows = Math.ceil(totalSlots / gridCols)

  // Selected slot cursor moves over time
  const selectedIdx = Math.floor(time * 1.2) % items.length

  // Item tooltip
  const tooltipName = itemNames[selectedIdx] || `ITEM ${selectedIdx + 1}`

  // Gold counter
  const goldCount = Math.floor(progress * 9999)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
      }}
    >
      {/* Scan lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Inventory panel */}
      <div
        style={{
          width: 'clamp(240px, 60vw, 440px)',
          background: `${slotColor}15`,
          border: `3px solid ${frameColor}`,
          padding: 'clamp(10px, 2vw, 18px)',
          position: 'relative',
          imageRendering: 'pixelated' as any,
          transform: `scale(${0.9 + easeOutCubic(enterProgress) * 0.1})`,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
            paddingBottom: 'clamp(4px, 0.8vw, 8px)',
            borderBottom: `2px solid ${frameColor}40`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(14px, 2.8vw, 22px)',
              fontWeight: 700,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}
          >
            {title}
          </div>
          {/* Gold counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: '#FFD700',
                borderRadius: '50%',
                border: '1px solid #CC8800',
                imageRendering: 'pixelated' as any,
              }}
            />
            <div
              style={{
                fontSize: 'clamp(10px, 1.8vw, 14px)',
                fontWeight: 700,
                color: '#FFD700',
                letterSpacing: 1,
              }}
            >
              {String(goldCount).padStart(4, '0')}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: 'clamp(3px, 0.5vw, 5px)',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
          }}
        >
          {Array.from({ length: totalSlots }, (_, idx) => {
            const hasItem = idx < items.length
            const isSelected = idx === selectedIdx
            const itemDelay = 0.08 + idx * 0.02
            const itemVisible = progress > itemDelay
            const itemOpacity = itemVisible ? Math.min(1, (progress - itemDelay) / 0.08) : 0

            // Rarity border colors
            const rarityColors = ['transparent', '#00CC00', '#3366FF', '#9933FF', '#FF6600']
            const rarity = hasItem ? (idx % rarityColors.length) : 0

            return (
              <div
                key={idx}
                style={{
                  aspectRatio: '1',
                  background: isSelected ? `${selectedColor}30` : slotColor,
                  border: isSelected
                    ? `2px solid ${selectedColor}`
                    : rarity > 0
                      ? `2px solid ${rarityColors[rarity]}60`
                      : `2px solid ${frameColor}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(16px, 3.5vw, 28px)',
                  opacity: easeOutCubic(itemOpacity),
                  position: 'relative',
                  boxShadow: isSelected ? `0 0 8px ${selectedColor}40` : 'none',
                  imageRendering: 'pixelated' as any,
                }}
              >
                {hasItem && items[idx]}
                {/* Stack count */}
                {hasItem && idx % 3 === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 1,
                      right: 2,
                      fontSize: 'clamp(7px, 1.2vw, 10px)',
                      fontWeight: 700,
                      color: textColor,
                      textShadow: '0 1px 1px rgba(0,0,0,0.8)',
                    }}
                  >
                    {`x${(idx + 1) * 3}`}
                  </div>
                )}
                {/* Selected cursor blink */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -2,
                      border: `2px solid ${selectedColor}`,
                      opacity: Math.floor(time * 4) % 2 === 0 ? 1 : 0.4,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Selected item tooltip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
            padding: 'clamp(4px, 0.8vw, 8px)',
            background: `${frameColor}10`,
            border: `1px solid ${frameColor}30`,
          }}
        >
          <div style={{ fontSize: 'clamp(16px, 3vw, 24px)' }}>
            {items[selectedIdx] || ''}
          </div>
          <div>
            <div
              style={{
                fontSize: 'clamp(11px, 2vw, 16px)',
                fontWeight: 700,
                color: selectedColor,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {tooltipName}
            </div>
            <div
              style={{
                fontSize: 'clamp(8px, 1.4vw, 11px)',
                color: `${textColor}70`,
                marginTop: 2,
              }}
            >
              {'A rare and powerful item.'}
            </div>
          </div>
        </div>

        {/* Corner brackets */}
        {[0, 1, 2, 3].map((c) => (
          <div
            key={c}
            style={{
              position: 'absolute',
              [c < 2 ? 'top' : 'bottom']: -3,
              [c % 2 === 0 ? 'left' : 'right']: -3,
              width: 8,
              height: 8,
              background: frameColor,
              imageRendering: 'pixelated' as any,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-inventory-grid',
  title: 'Scene Inventory Grid',
  description: 'RPG inventory grid with item slots, rarity borders, cursor selection, tooltip, stack counts, and gold counter',
  tags: ['scene', 'inventory', 'RPG', 'retro', 'gaming', 'pixel', 'items', 'grid'],
  category: 'scene-layout',
  component: SceneInventoryGridComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'INVENTORY',
    items: ['\u{2694}\u{FE0F}', '\u{1F6E1}\u{FE0F}', '\u{1F48E}', '\u{1F9EA}', '\u{1F511}', '\u{1F4DC}', '\u{1F48D}', '\u{1F52E}'],
    itemNames: ['IRON SWORD', 'WOOD SHIELD', 'BLUE GEM', 'HEALTH POTION', 'DUNGEON KEY', 'SCROLL', 'MAGIC RING', 'CRYSTAL ORB'],
    gridCols: 4,
    bgColor: '#0a0a14',
    slotColor: '#1a1a2e',
    selectedColor: '#FFD700',
    textColor: '#CCCCCC',
    frameColor: '#555555',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'INVENTORY', group: 'Content' },
    { key: 'items', label: 'Items (emoji)', type: 'text-array', defaultValue: ['\u{2694}\u{FE0F}', '\u{1F6E1}\u{FE0F}', '\u{1F48E}', '\u{1F9EA}', '\u{1F511}', '\u{1F4DC}', '\u{1F48D}', '\u{1F52E}'], group: 'Content' },
    { key: 'itemNames', label: 'Item Names', type: 'text-array', defaultValue: ['IRON SWORD', 'WOOD SHIELD', 'BLUE GEM', 'HEALTH POTION', 'DUNGEON KEY', 'SCROLL', 'MAGIC RING', 'CRYSTAL ORB'], group: 'Content' },
    { key: 'gridCols', label: 'Columns', type: 'number', defaultValue: 4, min: 3, max: 6, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'slotColor', label: 'Slot Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'selectedColor', label: 'Selected', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#CCCCCC', group: 'Style' },
    { key: 'frameColor', label: 'Frame', type: 'color', defaultValue: '#555555', group: 'Style' },
  ],
})
