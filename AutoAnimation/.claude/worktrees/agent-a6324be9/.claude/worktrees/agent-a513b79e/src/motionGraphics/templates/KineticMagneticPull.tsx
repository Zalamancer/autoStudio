import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MagneticPullConfig extends KineticBaseConfig {
  fieldStrength: number
}

function elasticOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Magnetic field lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,179,237,0.08) 0%, transparent 70%),
            radial-gradient(circle at 50% 50%, rgba(99,179,237,0.04) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const centerIndex = (totalChars - 1) / 2
          const distFromCenter = ci - centerIndex
          const normalized = totalChars > 1 ? distFromCenter / Math.max(centerIndex, 1) : 0

          // Radial positions around the canvas — letters orbit inward
          const angle = (ci / totalChars) * Math.PI * 2
          const orbitRadius = Math.min(width, height) * 0.45

          let translateX = 0
          let translateY = 0
          let opacity = 0
          let scale = 1
          let rotation = 0

          if (phase === 'enter') {
            // Letters fly in from orbit positions toward center
            const charDelay = (ci / totalChars) * 0.35
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            const snapped = elasticOut(p)

            // Start position: spread around circle
            const startX = Math.cos(angle) * orbitRadius
            const startY = Math.sin(angle) * orbitRadius

            translateX = startX * (1 - snapped)
            translateY = startY * (1 - snapped)
            opacity = Math.min(1, p * 3)
            scale = 0.4 + snapped * 0.6
            // Spin as they fly in
            rotation = (1 - snapped) * normalized * 360
          } else if (phase === 'hold') {
            opacity = 1
            // Subtle magnetic vibration — letters quiver in place
            const freq = 8
            const decay = 1 - holdProgress * 0.9
            const vibX = Math.sin(holdProgress * Math.PI * freq + ci * 1.2) * decay * 3
            const vibY = Math.cos(holdProgress * Math.PI * freq * 0.7 + ci * 0.9) * decay * 2
            translateX = vibX
            translateY = vibY
            scale = 1 + Math.sin(holdProgress * Math.PI * 4 + ci) * decay * 0.015
          } else {
            // Exit: letters repelled outward by reversed polarity
            const charDelay = ((totalChars - 1 - ci) / totalChars) * 0.2
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay)))
            const eased = easeInQuad(p)

            translateX = Math.cos(angle) * orbitRadius * eased * 0.8
            translateY = Math.sin(angle) * orbitRadius * eased * 0.8
            opacity = 1 - eased
            scale = 1 - eased * 0.5
          }

          return (
            <div
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 12vw, 160px)',
                fontWeight: 900,
                color,
                opacity,
                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                textShadow: `0 0 ${scale > 1.1 ? 20 : 4}px ${color}60, 2px 2px 0 rgba(0,0,0,0.3)`,
                lineHeight: 1,
              }}
            >
              {ch}
            </div>
          )
        })}
      </div>
    )
  },
}

function MagneticPullComponent(props: MotionGraphicProps<MagneticPullConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-magnetic-pull',
  title: 'Kinetic Magnetic Pull',
  description: 'Letters orbit in from all directions pulled by a magnetic force, snap into place with elastic overshoot, then repel outward on exit',
  tags: ['kinetic', 'typography', 'magnetic', 'physics', 'elastic', 'orbit', 'snap', 'force'],
  category: 'captions',
  component: MagneticPullComponent as any,
  defaultConfig: {
    words: ['PULL', 'SNAP', 'FORCE', 'FIELD'],
    colors: ['#63B3ED', '#F6AD55', '#68D391', '#FC8181'],
    bgColor: '#0D1117',
    cycleDuration: 1.4,
    fieldStrength: 100,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PULL', 'SNAP', 'FORCE', 'FIELD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#63B3ED', '#F6AD55', '#68D391', '#FC8181'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1117', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'fieldStrength', label: 'Field Strength', type: 'number', defaultValue: 100, min: 20, max: 200, group: 'Animation' },
  ],
})
