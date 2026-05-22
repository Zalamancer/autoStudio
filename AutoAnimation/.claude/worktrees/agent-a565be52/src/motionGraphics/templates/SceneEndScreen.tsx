import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneEndScreenConfig {
  title: string
  subtitle: string
  items: string[]
  bgColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneEndScreenComponent({ config, progress }: MotionGraphicProps<SceneEndScreenConfig>) {
  const { title, subtitle, items, bgColor, accentColor } = config

  // Phase calculations: 0-25% enter, 25-80% hold, 80-100% exit
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Background fade in with gradient
  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Title drops from top
  const titleY = enterProgress < 1
    ? -60 + easeOutBack(enterProgress) * 60
    : exitProgress > 0
      ? -40 * easeInCubic(exitProgress)
      : 0
  const titleOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(1, enterProgress * 2))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Subtitle
  const subtitleDelay = 0.2
  const subtitleEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - subtitleDelay) / (1 - subtitleDelay))
    : 1
  const subtitleOpacity = subtitleEnter < 1
    ? easeOutCubic(subtitleEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Floating animation during hold
  const floatY = holdProgress > 0
    ? Math.sin(holdProgress * Math.PI * 4) * 4
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background with gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, ${bgColor} 0%, ${bgColor}ee 50%, ${accentColor}22 100%)`,
          opacity: bgOpacity,
        }}
      />

      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '35%',
          aspectRatio: '1',
          borderRadius: '50%',
          border: `2px solid ${accentColor}20`,
          opacity: bgOpacity * 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-8%',
          width: '40%',
          aspectRatio: '1',
          borderRadius: '50%',
          border: `2px solid ${accentColor}15`,
          opacity: bgOpacity * 0.3,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8%',
        }}
      >
        {/* Title */}
        <div
          style={{
            transform: `translateY(${titleY + floatY}px)`,
            opacity: titleOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(24px, 6vw, 56px)',
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '0.3em',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${floatY * 0.5}px)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(12px, 2.5vw, 22px)',
            fontWeight: 400,
            color: '#ffffffaa',
            textAlign: 'center',
            marginBottom: '2em',
          }}
        >
          {subtitle}
        </div>

        {/* Items stagger in from right */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7em',
            alignItems: 'center',
            width: '100%',
            maxWidth: '500px',
          }}
        >
          {items.map((item, i) => {
            // Stagger delay: each item gets an additional offset
            const itemDelay = 0.35 + i * 0.12
            const itemEnter = enterProgress < 1
              ? Math.max(0, (enterProgress - itemDelay) / (1 - itemDelay))
              : 1
            const itemX = itemEnter < 1
              ? 60 * (1 - easeOutCubic(itemEnter))
              : exitProgress > 0
                ? 60 * easeInCubic(exitProgress)
                : 0
            const itemOpacity = itemEnter < 1
              ? easeOutCubic(itemEnter)
              : exitProgress > 0
                ? 1 - easeInCubic(exitProgress)
                : 1
            const itemFloat = holdProgress > 0
              ? Math.sin((holdProgress * Math.PI * 4) + i * 0.5) * 2
              : 0

            return (
              <div
                key={i}
                style={{
                  transform: `translateX(${itemX}px) translateY(${itemFloat}px)`,
                  opacity: itemOpacity,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8em',
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}30`,
                  borderRadius: '8px',
                  padding: '0.5em 1.5em',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: accentColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(12px, 2.5vw, 18px)',
                    fontWeight: 500,
                    color: '#ffffffdd',
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
  id: 'tpl-scene-end-screen',
  title: 'Scene End Screen',
  description: 'End screen with title drop, staggered items from right, and floating hold animation',
  tags: ['scene', 'end', 'outro', 'credits', 'layout'],
  category: 'scene-layout',
  component: SceneEndScreenComponent as any,
  defaultConfig: {
    title: 'Thanks for Watching!',
    subtitle: 'Don\'t forget to subscribe',
    items: ['Like & Subscribe', 'Share with Friends', 'Leave a Comment'],
    bgColor: '#0d1117',
    accentColor: '#58a6ff',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Thanks for Watching!', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: "Don't forget to subscribe", group: 'Content' },
    { key: 'items', label: 'Items', type: 'text-array', defaultValue: ['Like & Subscribe', 'Share with Friends', 'Leave a Comment'], group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#0d1117', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#58a6ff', group: 'Style' },
  ],
})
