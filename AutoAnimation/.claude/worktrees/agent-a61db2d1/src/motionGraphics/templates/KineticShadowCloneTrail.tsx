import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShadowCloneTrailConfig extends KineticBaseConfig {
  cloneCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const CLONE_COUNT = 6

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle diagonal speed lines in background */}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${10 + i * 18}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: `rgba(255,255,255,${0.015 + i * 0.005})`,
              transform: `skewX(${-15 + Math.sin(time * 0.5 + i) * 2}deg)`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let mainOpacity = 0
    let mainScale = 1
    let mainX = 0
    let trailProgress = 0

    if (phase === 'enter') {
      const p = easeOutBack(Math.min(1, enterProgress * 1.05))
      mainOpacity = Math.min(1, enterProgress * 2.5)
      mainScale = 0.6 + p * 0.4
      mainX = (1 - easeOutExpo(enterProgress)) * -80 // slides in from left
      trailProgress = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      mainOpacity = 1
      mainScale = 1
      mainX = Math.sin(holdProgress * Math.PI * 4) * 2 // subtle breathe
      trailProgress = 1
    } else {
      const p = easeOutExpo(exitProgress)
      mainOpacity = 1 - exitProgress
      mainScale = 1 + exitProgress * 0.1
      mainX = p * 80 // exits right, clones scatter left
      trailProgress = 1 - exitProgress
    }

    // Clone offset: each staggered behind main text
    const cloneSpacing = 18 // pixels of offset per clone
    const clones = Array.from({ length: CLONE_COUNT }, (_, i) => {
      const ci = i + 1
      const delay = ci / CLONE_COUNT
      const cloneTrail = Math.max(0, trailProgress - delay * 0.4) / (1 - delay * 0.4 + 0.001)
      const offsetX = -ci * cloneSpacing * trailProgress
      const offsetY = ci * 3 * trailProgress
      const cloneOpacity = Math.max(0, (1 - ci / (CLONE_COUNT + 1)) * 0.22 * mainOpacity * cloneTrail)
      const cloneBlur = ci * 1.2

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${mainX + offsetX}px), calc(-50% + ${offsetY}px)) scale(${mainScale * (1 - ci * 0.03)})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(0,0,0,0.9)',
            opacity: cloneOpacity,
            filter: `blur(${cloneBlur}px)`,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>
      )
    })

    return (
      <>
        {/* Shadow clones (rendered behind main) */}
        {clones.reverse()}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${mainX}px), -50%) scale(${mainScale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            opacity: mainOpacity,
            whiteSpace: 'nowrap',
            textShadow: `2px 3px 0 rgba(0,0,0,0.5), 4px 6px 0 rgba(0,0,0,0.25)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ShadowCloneTrailComponent(props: MotionGraphicProps<ShadowCloneTrailConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shadow-clone-trail',
  title: 'Kinetic Shadow Clone Trail',
  description: 'Staggered shadow clones trail behind the text like an afterimage — each clone offset and progressively blurred for a speed-of-light effect',
  tags: ['kinetic', 'typography', 'shadow', 'clone', 'trail', 'speed', 'motion-blur', 'action', 'afterimage'],
  category: 'captions',
  component: ShadowCloneTrailComponent as any,
  defaultConfig: {
    words: ['FAST', 'DASH', 'RUSH', 'FLASH'],
    colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
    bgColor: '#0f0f1a',
    cycleDuration: 1.2,
    cloneCount: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FAST', 'DASH', 'RUSH', 'FLASH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'cloneCount', label: 'Clone Count', type: 'number', defaultValue: 6, min: 2, max: 10, group: 'Animation' },
  ],
})
