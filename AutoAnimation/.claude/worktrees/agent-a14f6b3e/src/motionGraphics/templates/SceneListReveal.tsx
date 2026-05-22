import type { ReactNode } from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneListRevealConfig {
  items: string[]
  title: string
  bgColor: string
  textColor: string
  accentColor: string
  bulletStyle: 'number' | 'dot' | 'check' | 'arrow'
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const bulletIcons: Record<string, (index: number, color: string) => ReactNode> = {
  number: (index: number, color: string) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.6em',
        height: '1.6em',
        borderRadius: '50%',
        background: color,
        color: '#ffffff',
        fontWeight: 700,
        fontSize: '0.75em',
        flexShrink: 0,
      }}
    >
      {index + 1}
    </span>
  ),
  dot: (_index: number, color: string) => (
    <span
      style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  ),
  check: (_index: number, color: string) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.4em',
        height: '1.4em',
        borderRadius: '4px',
        background: `${color}25`,
        border: `2px solid ${color}`,
        color,
        fontWeight: 700,
        fontSize: '0.8em',
        flexShrink: 0,
      }}
    >
      {'\u2713'}
    </span>
  ),
  arrow: (_index: number, color: string) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        color,
        fontWeight: 700,
        fontSize: '1.2em',
        flexShrink: 0,
      }}
    >
      {'\u2192'}
    </span>
  ),
}

function SceneListRevealComponent({ config, progress }: MotionGraphicProps<SceneListRevealConfig>) {
  const { items, title, bgColor, textColor, accentColor, bulletStyle } = config

  // Phase calculations: 0-30% enter, 30-80% hold, 80-100% exit
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Title fades in first (0-10% of enter phase = 0-3% of total)
  const titleEnter = enterProgress < 1
    ? Math.min(1, enterProgress / 0.3)
    : 1
  const titleOpacity = titleEnter < 1
    ? easeOutCubic(titleEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const titleY = titleEnter < 1
    ? 15 * (1 - easeOutCubic(titleEnter))
    : exitProgress > 0
      ? -15 * easeInCubic(exitProgress)
      : 0

  // Overall opacity for exit
  const overallOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const getBullet = bulletIcons[bulletStyle] || bulletIcons.dot

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8% 10%',
          opacity: overallOpacity,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(20px, 5vw, 44px)',
            fontWeight: 800,
            color: textColor,
            marginBottom: '1em',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
          {/* Accent underline */}
          <div
            style={{
              width: `${easeOutCubic(titleEnter) * 60}px`,
              height: '3px',
              background: accentColor,
              borderRadius: '2px',
              marginTop: '0.3em',
            }}
          />
        </div>

        {/* Items list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 2vw, 16px)',
          }}
        >
          {items.map((item, i) => {
            // Stagger items evenly across the remaining enter time (after title)
            const itemStartFraction = 0.25
            const totalItemDuration = 1 - itemStartFraction
            const perItemDuration = totalItemDuration / Math.max(items.length, 1)
            const itemDelay = itemStartFraction + i * perItemDuration
            const itemEnter = enterProgress < 1
              ? Math.max(0, Math.min(1, (enterProgress - itemDelay) / perItemDuration))
              : 1

            const itemX = itemEnter < 1
              ? -40 * (1 - easeOutQuart(itemEnter))
              : exitProgress > 0
                ? -40 * easeInCubic(exitProgress)
                : 0
            const itemOpacity = itemEnter < 1
              ? easeOutCubic(itemEnter)
              : 1

            // Subtle glow pulse during hold
            const isHolding = progress >= 0.3 && progress < 0.8
            const glowOpacity = isHolding
              ? 0.05 + Math.sin((holdProgress * Math.PI * 4) + i * 1.2) * 0.05
              : 0

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8em',
                  transform: `translateX(${itemX}px)`,
                  opacity: itemOpacity,
                  padding: '0.5em 0.8em',
                  borderRadius: '6px',
                  background: `${accentColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`,
                }}
              >
                {getBullet(i, accentColor)}
                <span
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(13px, 3vw, 24px)',
                    fontWeight: 500,
                    color: textColor,
                    lineHeight: 1.4,
                  }}
                >
                  {item}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-list-reveal',
  title: 'Scene List Reveal',
  description: 'Animated list with staggered item reveals, colored bullets/numbers, and glow pulse during hold',
  tags: ['scene', 'list', 'reveal', 'bullet', 'items', 'layout'],
  category: 'scene-layout',
  component: SceneListRevealComponent as any,
  defaultConfig: {
    items: ['Plan your content strategy', 'Create engaging visuals', 'Optimize for your audience', 'Publish and promote'],
    title: 'Getting Started',
    bgColor: '#1a1a2e',
    textColor: '#f0f0f0',
    accentColor: '#00b4d8',
    bulletStyle: 'number',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Getting Started', group: 'Content' },
    { key: 'items', label: 'List Items', type: 'text-array', defaultValue: ['Plan your content strategy', 'Create engaging visuals', 'Optimize for your audience', 'Publish and promote'], group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0f0f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#00b4d8', group: 'Style' },
    { key: 'bulletStyle', label: 'Bullet Style', type: 'select', defaultValue: 'number', options: ['number', 'dot', 'check', 'arrow'], group: 'Style' },
  ],
})
