import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PropellerSpinConfig extends KineticBaseConfig {
  bladeCount: number
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuint(t: number): number {
  return t * t * t * t * t
}

/**
 * KineticPropellerSpin
 * Text is split across propeller blades that spin at high RPM then decelerate.
 * At full speed the blades blur into a disc; as they slow, the text segments
 * align and become readable. Uses 2 blades (180° apart) so the word
 * appears on each blade — readable only when both blades are horizontal.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const hubR = Math.min(width, height) * 0.06

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Nose cone / spinner */}
        <div
          style={{
            position: 'absolute',
            left: cx - hubR * 1.4,
            top: cy - hubR * 1.4,
            width: hubR * 2.8,
            height: hubR * 2.8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        />
        {/* Blur disc ghost — simulates high-speed disc appearance */}
        <div
          style={{
            position: 'absolute',
            left: cx - Math.min(width, height) * 0.38,
            top: cy - Math.min(width, height) * 0.38,
            width: Math.min(width, height) * 0.76,
            height: Math.min(width, height) * 0.76,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.03)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const bladeCount = 2

    // RPM schedule: start at 1800°/s, decelerate to 0 by end of enter
    let rotationDeg = 0
    let blur = 0
    let opacity = 1

    if (phase === 'enter') {
      // Fast spin then decelerate: total angle = large number, landing on 0° (horizontal)
      // We want to arrive at 0° at enterProgress=1
      const totalSpins = 4 // full rotations during enter
      const eased = easeOutQuint(enterProgress)
      // Land on 0° (blades horizontal) — totalSpins * 360 brings us back to start
      rotationDeg = (1 - eased) * totalSpins * 360
      blur = (1 - eased) * 12
      opacity = enterProgress < 0.08 ? enterProgress / 0.08 : 1
    } else if (phase === 'hold') {
      rotationDeg = 0
      blur = 0
    } else {
      const eased = easeInQuint(exitProgress)
      rotationDeg = eased * 4 * 360 // spin up and away
      blur = eased * 12
      opacity = exitProgress > 0.6 ? 1 - (exitProgress - 0.6) / 0.4 : 1
    }

    const bladeLength = Math.min(width, height) * 0.42
    const bladeWidth = Math.min(width, height) * 0.11

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {Array.from({ length: bladeCount }, (_, bi) => {
          const bladeAngle = rotationDeg + bi * (360 / bladeCount)
          const rad = (bladeAngle * Math.PI) / 180

          // Blade rectangle oriented along its angle
          const bladeX = cx + Math.cos(rad) * bladeLength * 0.5
          const bladeY = cy + Math.sin(rad) * bladeLength * 0.5

          // How "readable" is this blade? Near 0° or 180° = horizontal = readable
          const normalizedAngle = ((bladeAngle % 180) + 180) % 180
          const readability = 1 - Math.abs(normalizedAngle - 90) / 90
          const textOpacity = Math.pow(readability, 3)

          return (
            <div
              key={bi}
              style={{
                position: 'absolute',
                left: cx,
                top: cy,
                width: bladeLength,
                height: bladeWidth,
                marginTop: -bladeWidth / 2,
                transformOrigin: '0 50%',
                transform: `rotate(${bladeAngle}deg)`,
                background: `linear-gradient(90deg, transparent, ${color}18, ${color}30, ${color}18, transparent)`,
                borderRadius: bladeWidth / 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: blur > 0 ? `blur(${blur * (1 - textOpacity * 0.5)}px)` : undefined,
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(28px, 6vw, 90px)',
                  fontWeight: 800,
                  color,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: textOpacity,
                  // Counter-rotate text so it always reads L→R when blade is horizontal
                  transform: `rotate(${-bladeAngle}deg)`,
                  textShadow: `0 0 12px ${color}66`,
                }}
              >
                {word}
              </span>
            </div>
          )
        })}
        {/* Hub cap */}
        <div
          style={{
            position: 'absolute',
            left: cx - 8,
            top: cy - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            zIndex: 5,
          }}
        />
      </div>
    )
  },
}

function PropellerSpinComponent(props: MotionGraphicProps<PropellerSpinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-propeller-spin',
  title: 'Kinetic Propeller Spin',
  description:
    'Text spins like propeller blades — at high RPM the blades blur to a disc; as they decelerate the word aligns and becomes readable.',
  tags: ['kinetic', 'typography', 'propeller', 'spin', 'decelerate', 'blur', 'aviation', 'mechanical'],
  category: 'captions',
  component: PropellerSpinComponent as any,
  defaultConfig: {
    words: ['FLY', 'FAST', 'BOLD', 'SOAR'],
    colors: ['#00AAFF', '#FFFFFF', '#FF6600', '#FFD700'],
    bgColor: '#08080f',
    cycleDuration: 1.8,
    bladeCount: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLY', 'FAST', 'BOLD', 'SOAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00AAFF', '#FFFFFF', '#FF6600', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 5, group: 'Timing' },
    { key: 'bladeCount', label: 'Blade Count', type: 'number', defaultValue: 2, min: 2, max: 4, group: 'Style' },
  ],
})
