import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ReelsTransitionConfig extends KineticBaseConfig {
  wipeDirection: 'left' | 'right' | 'up' | 'down'
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Moving gradient stripes for dynamic feel
    const stripeOffset = (frame * 2) % 200

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Diagonal moving stripes */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: -100,
              left: -100 + i * 180 + stripeOffset - 400,
              width: 60,
              height: '200%',
              background: 'rgba(255,255,255,0.02)',
              transform: 'rotate(25deg)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
    index,
    config,
  }: WordRenderProps) => {
    const cfg = config as unknown as ReelsTransitionConfig
    const dir = cfg?.wipeDirection ?? 'left'

    let opacity = 1
    let clipPath = 'inset(0)'
    let translateX = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      const t = enterProgress
      // Smooth cubic ease
      const eased = 1 - Math.pow(1 - t, 3)

      // Wipe reveal from direction
      if (dir === 'left') {
        clipPath = `inset(0 ${(1 - eased) * 100}% 0 0)`
        translateX = (1 - eased) * -30
      } else if (dir === 'right') {
        clipPath = `inset(0 0 0 ${(1 - eased) * 100}%)`
        translateX = (1 - eased) * 30
      } else if (dir === 'up') {
        clipPath = `inset(0 0 ${(1 - eased) * 100}% 0)`
        translateY = (1 - eased) * -30
      } else {
        clipPath = `inset(${(1 - eased) * 100}% 0 0 0)`
        translateY = (1 - eased) * 30
      }

      opacity = 0.3 + eased * 0.7
      scale = 0.95 + eased * 0.05
    } else if (phase === 'hold') {
      // Subtle scale pulse
      scale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.015
      clipPath = 'inset(0)'
    } else {
      const t = exitProgress
      const eased = t * t * t

      // Wipe out in opposite direction
      if (dir === 'left') {
        clipPath = `inset(0 0 0 ${eased * 100}%)`
        translateX = eased * 30
      } else if (dir === 'right') {
        clipPath = `inset(0 ${eased * 100}% 0 0)`
        translateX = eased * -30
      } else if (dir === 'up') {
        clipPath = `inset(${eased * 100}% 0 0 0)`
        translateY = eased * 30
      } else {
        clipPath = `inset(0 0 ${eased * 100}% 0)`
        translateY = eased * -30
      }

      opacity = 1 - eased
      scale = 1 - eased * 0.05
    }

    // Colored accent bar that leads the wipe
    const barThickness = 4
    let barStyle: React.CSSProperties = { position: 'absolute' as const, background: color, borderRadius: 2 }
    let barOpacity = 0

    if (phase === 'enter') {
      barOpacity = enterProgress < 0.8 ? 0.8 : 0
      const pos = enterProgress * 100
      if (dir === 'left') barStyle = { ...barStyle, top: 0, bottom: 0, width: barThickness, left: `${pos}%` }
      else if (dir === 'right') barStyle = { ...barStyle, top: 0, bottom: 0, width: barThickness, right: `${pos}%` }
      else if (dir === 'up') barStyle = { ...barStyle, left: 0, right: 0, height: barThickness, top: `${pos}%` }
      else barStyle = { ...barStyle, left: 0, right: 0, height: barThickness, bottom: `${pos}%` }
    } else if (phase === 'exit') {
      barOpacity = exitProgress < 0.8 ? 0.6 : 0
      const pos = exitProgress * 100
      if (dir === 'left') barStyle = { ...barStyle, top: 0, bottom: 0, width: barThickness, left: `${pos}%` }
      else if (dir === 'right') barStyle = { ...barStyle, top: 0, bottom: 0, width: barThickness, right: `${pos}%` }
      else if (dir === 'up') barStyle = { ...barStyle, left: 0, right: 0, height: barThickness, top: `${pos}%` }
      else barStyle = { ...barStyle, left: 0, right: 0, height: barThickness, bottom: `${pos}%` }
    }

    // Slide counter dots
    const totalWords = 4
    const dots = (
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          opacity: phase === 'hold' ? 0.6 : 0.3,
        }}
      >
        {Array.from({ length: totalWords }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index % totalWords ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === index % totalWords ? color : '#FFFFFF40',
              transition: 'width 0.3s',
            }}
          />
        ))}
      </div>
    )

    return (
      <>
        {/* Leading accent bar */}
        <div style={{ ...barStyle, opacity: barOpacity, pointerEvents: 'none' as const }} />

        {/* Main word with clip/wipe */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`,
            clipPath,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(36px, 11vw, 130px)',
              fontWeight: 900,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              textShadow: `0 0 40px ${color}40`,
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
          {/* Colored underline accent */}
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${color}, ${color}60)`,
              marginTop: 6,
            }}
          />
        </div>

        {dots}
      </>
    )
  },
}

function ReelsTransitionComponent(props: MotionGraphicProps<ReelsTransitionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-reels-transition',
  title: 'Kinetic Reels Transition',
  description:
    'Reels-style wipe transitions with leading accent bar, clip-path reveals, slide counter dots, and smooth directional animations.',
  tags: ['kinetic', 'typography', 'reels', 'transition', 'instagram', 'tiktok', 'social-media', 'wipe'],
  category: 'captions',
  component: ReelsTransitionComponent as any,
  defaultConfig: {
    words: ['PART 1', 'PART 2', 'PART 3', 'FINALE'],
    colors: ['#F43F5E', '#8B5CF6', '#3B82F6', '#10B981'],
    bgColor: '#0C0C18',
    cycleDuration: 1.2,
    wipeDirection: 'left' as const,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PART 1', 'PART 2', 'PART 3', 'FINALE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F43F5E', '#8B5CF6', '#3B82F6', '#10B981'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0C18', group: 'Style' },
    { key: 'wipeDirection', label: 'Wipe Direction', type: 'select', defaultValue: 'left', options: ['left', 'right', 'up', 'down'], group: 'Animation' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
