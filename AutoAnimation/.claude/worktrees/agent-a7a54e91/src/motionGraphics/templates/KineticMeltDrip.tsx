import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MeltDripConfig extends KineticBaseConfig {}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Dripping drops from top
    const drops = Array.from({ length: 8 }, (_, i) => {
      const seed = i * 97 + 31
      const x = 10 + ((seed * 13) % 80)
      const speed = 30 + (seed % 40)
      const y = ((time * speed + i * 60) % 130) - 10
      const size = 3 + (seed % 4)
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size * 2,
            borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
            background: `rgba(255,100,100,${0.08 + (seed % 5) * 0.02})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {drops}
        {/* Heat haze at bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '20%',
            background: 'linear-gradient(0deg, rgba(255,80,50,0.06), transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height }: WordRenderProps) => {
    const chars = word.split('')

    if (phase === 'enter') {
      // Each letter reforms from bottom up, like melted goo re-solidifying
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci / (chars.length + 1) * 0.6
            const charT = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.4))
            const eased = easeOutBounce(charT)

            // Letter rises from below and un-melts
            const yOffset = (1 - eased) * height * 0.4
            const scaleY = 0.3 + eased * 0.7 // Stretched vertically (dripping) -> normal
            const scaleX = 1.3 - eased * 0.3 // Wide (puddled) -> normal
            const skewY = (1 - eased) * 12 // Skewed (melted) -> straight
            const charOpacity = Math.min(1, charT * 2)

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 900,
                  color,
                  transform: `translateY(${yOffset}px) scaleX(${scaleX}) scaleY(${scaleY}) skewY(${skewY}deg)`,
                  transformOrigin: 'center bottom',
                  opacity: charOpacity,
                  textShadow: `0 4px 15px ${color}44`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Subtle melt wobble -- letters gently droop and recover
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const wobble = Math.sin(holdProgress * Math.PI * 4 + ci * 0.8) * 3
            const droop = Math.sin(holdProgress * Math.PI * 2 + ci * 1.2) * 0.03
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 900,
                  color,
                  transform: `translateY(${wobble}px) scaleY(${1 + droop})`,
                  transformOrigin: 'center top',
                  textShadow: `0 4px 15px ${color}44`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else {
      // Melt exit: each letter melts from top down, dripping away
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci / (chars.length + 1) * 0.4
            const charT = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.6))
            const eased = easeInQuad(charT)

            // Letter stretches downward and melts
            const yOffset = eased * height * 0.35
            const scaleY = 1 + eased * 1.8 // Stretch tall (melting)
            const scaleX = 1 - eased * 0.5 // Shrink width (drip narrow)
            const skewX = eased * ((ci % 2 === 0) ? 8 : -8) // Wobble sideways
            const charOpacity = 1 - eased

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 900,
                  color,
                  transform: `translateY(${yOffset}px) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
                  transformOrigin: 'center top',
                  opacity: charOpacity,
                  textShadow: `0 ${10 + eased * 20}px ${15 + eased * 20}px ${color}66`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function MeltDripComponent(props: MotionGraphicProps<MeltDripConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-melt-drip',
  title: 'Kinetic Melt Drip',
  description: 'Text melts from top with per-letter dripping, gooey stretch/skew deformation, reforms from bottom with bounce settle',
  tags: ['kinetic', 'typography', 'melt', 'drip', 'liquid', 'goo', 'horror', 'organic'],
  category: 'captions',
  component: MeltDripComponent as any,
  defaultConfig: {
    words: ['MELT', 'DRIP', 'OOZE', 'FLOW'],
    colors: ['#FF4444', '#FF6B35', '#E84393', '#FD79A8'],
    bgColor: '#1a0a0a',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MELT', 'DRIP', 'OOZE', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#FF6B35', '#E84393', '#FD79A8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
