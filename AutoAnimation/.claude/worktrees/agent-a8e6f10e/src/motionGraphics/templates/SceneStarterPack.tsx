import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStarterPackConfig {
  title: string
  item1: string
  item2: string
  item3: string
  item4: string
  bgColor: string
  textColor: string
  cardColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneStarterPackComponent({ config, progress }: MotionGraphicProps<SceneStarterPackConfig>) {
  const { title, item1, item2, item3, item4, bgColor, textColor, cardColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Title slides down from top
  const titleEnter = enterProgress < 0.4
    ? easeOutCubic(enterProgress / 0.4)
    : 1
  const titleY = (1 - titleEnter) * -60
  const titleOpacity = titleEnter * (exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1)

  const items = [item1, item2, item3, item4]
  // Grid positions: [row, col]
  const positions: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: `translate(-50%, ${titleY}px)`,
          opacity: titleOpacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(18px, 4.5vw, 42px)',
          fontWeight: 900,
          color: textColor,
          textAlign: 'center',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          letterSpacing: '0.03em',
        }}
      >
        {title}
      </div>

      {/* 2x2 Grid */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '6%',
          right: '6%',
          bottom: '6%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 'clamp(6px, 1.5vw, 14px)',
        }}
      >
        {items.map((itemText, i) => {
          const [row, col] = positions[i]
          // Staggered pop-in
          const delay = 0.3 + i * 0.12
          const itemEnterRaw = enterProgress < 1
            ? Math.max(0, Math.min(1, (enterProgress - delay) / 0.25))
            : 1
          const itemScale = easeOutBack(itemEnterRaw)
          const itemOpacity = itemEnterRaw * (exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1)

          return (
            <div
              key={i}
              style={{
                background: cardColor,
                borderRadius: 'clamp(6px, 1.5vw, 12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(8px, 2vw, 20px)',
                transform: `scale(${itemScale})`,
                opacity: itemOpacity,
                border: '2px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(12px, 3vw, 24px)',
                  fontWeight: 600,
                  color: textColor,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  wordWrap: 'break-word',
                }}
              >
                {itemText}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-starter-pack',
  title: 'Starter Pack',
  description: 'Starter pack meme format with title and 2x2 grid of items popping in, relatable humor layout',
  tags: ['scene', 'meme', 'starter-pack', 'viral', 'relatable', 'grid', 'humor'],
  category: 'scene-layout',
  component: SceneStarterPackComponent as any,
  defaultConfig: {
    title: 'The "Senior Dev" Starter Pack',
    item1: 'Stack Overflow tabs: 47',
    item2: '"It works on my machine"',
    item3: 'Coffee addiction level: critical',
    item4: 'Rubber duck on desk',
    bgColor: '#1a1a2e',
    textColor: '#ffffff',
    cardColor: '#252540',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'The "Senior Dev" Starter Pack', group: 'Content' },
    { key: 'item1', label: 'Item 1', type: 'text', defaultValue: 'Stack Overflow tabs: 47', group: 'Content' },
    { key: 'item2', label: 'Item 2', type: 'text', defaultValue: '"It works on my machine"', group: 'Content' },
    { key: 'item3', label: 'Item 3', type: 'text', defaultValue: 'Coffee addiction level: critical', group: 'Content' },
    { key: 'item4', label: 'Item 4', type: 'text', defaultValue: 'Rubber duck on desk', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#252540', group: 'Style' },
  ],
})
