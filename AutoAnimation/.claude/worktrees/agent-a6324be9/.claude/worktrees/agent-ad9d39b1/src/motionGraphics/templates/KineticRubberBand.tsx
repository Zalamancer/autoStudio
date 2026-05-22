import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RubberBandConfig extends KineticBaseConfig {
  elasticity: number
}

/** Spring-like elastic overshoot */
function elasticSnap(t: number, elasticity: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const decay = Math.exp(-6 * t)
  const freq = 2.5 + elasticity * 0.02
  return 1 - decay * Math.cos(t * Math.PI * freq)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle corkboard/pinboard texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.02) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.015) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
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
          gap: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          // Each character is a rubber band letter stretching in
          const centerIndex = (totalChars - 1) / 2
          const distFromCenter = ci - centerIndex
          const normalizedDist = totalChars > 1 ? distFromCenter / centerIndex : 0

          let scaleX = 1
          let scaleY = 1
          let translateX = 0
          let translateY = 0
          let opacity = 0
          let rotation = 0

          if (phase === 'enter') {
            // Rubber band pulls from outside edges, snaps to center
            const charDelay = Math.abs(normalizedDist) * 0.3
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.8)))
            const snapped = elasticSnap(p, 80)

            // Start stretched far from center, snap inward
            const startX = normalizedDist * width * 0.4
            translateX = startX * (1 - snapped)

            // Horizontal stretch during pull, compress on snap
            scaleX = 1 + (1 - snapped) * 1.8
            // Vertical compress during stretch
            scaleY = 1 - (1 - snapped) * 0.4

            // Wobble after snap
            if (p > 0.5) {
              const wobbleT = (p - 0.5) / 0.5
              const wobble = Math.sin(wobbleT * Math.PI * 4) * (1 - wobbleT) * 0.15
              scaleX += wobble
              scaleY -= wobble * 0.5
              rotation = Math.sin(wobbleT * Math.PI * 3) * (1 - wobbleT) * 5
            }

            opacity = p > 0 ? Math.min(1, p * 2.5) : 0
          } else if (phase === 'hold') {
            opacity = 1
            // Tension wobble — subtle rubber vibration
            const wobbleFreq = 6
            const wobbleDecay = 1 - holdProgress * 0.8
            const wobble = Math.sin(holdProgress * Math.PI * wobbleFreq + ci * 0.8) * wobbleDecay * 0.03
            scaleX = 1 + wobble
            scaleY = 1 - wobble * 0.5
            translateY = Math.sin(holdProgress * Math.PI * 3 + ci * 0.5) * 2
          } else {
            // Snap away — rubber band releases
            const charDelay = (1 - Math.abs(normalizedDist)) * 0.2
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay * 0.5)))
            const eased = easeOutCubic(p)

            translateX = normalizedDist * width * 0.3 * eased
            translateY = -eased * 60
            scaleX = 1 + eased * 2.5
            scaleY = 1 - eased * 0.6
            opacity = 1 - eased
            rotation = normalizedDist * eased * 15
          }

          // Color tension indicator — slight hue shift when stretched
          const stretchAmount = Math.abs(scaleX - 1)
          const tensionBrightness = 1 + stretchAmount * 0.2

          return (
            <div
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 800,
                color,
                opacity,
                transform: `translateX(${translateX}px) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                filter: `brightness(${tensionBrightness})`,
                textShadow: stretchAmount > 0.3
                  ? `0 0 ${stretchAmount * 15}px ${color}40`
                  : `2px 2px 0 rgba(0,0,0,0.15)`,
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

function RubberBandComponent(props: MotionGraphicProps<RubberBandConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rubber-band',
  title: 'Kinetic Rubber Band',
  description: 'Text stretches in like rubber band snap with elastic overshoot and tension wobble, each letter pulled and released',
  tags: ['kinetic', 'typography', 'rubber', 'elastic', 'snap', 'stretch', 'craft', 'bounce'],
  category: 'captions',
  component: RubberBandComponent as any,
  defaultConfig: {
    words: ['SNAP', 'PULL', 'PING', 'FLEX'],
    colors: ['#FF6B6B', '#FECA57', '#48DBFB', '#FF9FF3'],
    bgColor: '#1B1B2F',
    cycleDuration: 1.2,
    elasticity: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SNAP', 'PULL', 'PING', 'FLEX'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#FECA57', '#48DBFB', '#FF9FF3'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1B1B2F', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'elasticity', label: 'Elasticity', type: 'number', defaultValue: 80, min: 20, max: 150, group: 'Animation' },
  ],
})
