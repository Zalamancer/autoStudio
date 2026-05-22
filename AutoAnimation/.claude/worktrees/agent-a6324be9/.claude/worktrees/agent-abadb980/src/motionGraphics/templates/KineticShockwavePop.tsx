import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShockwavePopConfig extends KineticBaseConfig {
  ringCount: number
}

/* ---------- Easing ---------- */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const COLORS = ['#FF3CAC', '#FFEB3B', '#00E5FF', '#FF6B00', '#7B2FFF']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Vignette pulse
    const pulse = 0.12 + Math.sin(time * 6) * 0.04
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${pulse}) 100%)`,
          }}
        />
        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const accentColor = COLORS[index % COLORS.length]
    const fontSize = Math.min(width / (word.length * 0.65), 120)

    // Main text transform
    let scale = 1
    let opacity = 1
    let textShadowSpread = 0
    let glowOpacity = 0
    let ringProgress = 0

    if (phase === 'enter') {
      const t = easeOutBack(Math.min(1, enterProgress * 1.2))
      scale = 0.4 + t * 0.6
      opacity = Math.min(1, enterProgress * 3)
      textShadowSpread = (1 - enterProgress) * 30
      glowOpacity = enterProgress
      ringProgress = enterProgress
    } else if (phase === 'hold') {
      // Micro-pulse on hold
      scale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.018
      opacity = 1
      glowOpacity = 0.7 + Math.sin(holdProgress * Math.PI * 6) * 0.3
      ringProgress = 0
    } else {
      const t = easeInExpo(Math.min(1, exitProgress * 1.1))
      scale = 1 + t * 0.3
      opacity = 1 - t
      glowOpacity = 1 - t
    }

    // Shockwave rings — expand outward on enter
    const rings = [0, 0.15, 0.3]
    const ringMaxRadius = Math.min(width, height) * 0.7

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Shockwave rings */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {rings.map((delay, i) => {
            const rp = Math.max(0, ringProgress - delay)
            const r = easeOutExpo(Math.min(1, rp * 1.4)) * ringMaxRadius
            const ro = Math.max(0, 1 - rp * 1.8) * 0.6
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: r * 2,
                  height: r * 2,
                  borderRadius: '50%',
                  border: `${3 - i}px solid ${accentColor}`,
                  opacity: ro,
                }}
              />
            )
          })}
        </div>

        {/* Glow halo behind text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '80%',
              height: '60%',
              background: `radial-gradient(ellipse, ${accentColor}${Math.round(glowOpacity * 40)
                .toString(16)
                .padStart(2, '0')} 0%, transparent 70%)`,
              filter: 'blur(12px)',
            }}
          />
        </div>

        {/* Word */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transform: `scale(${scale})`,
              opacity,
              textShadow: `
                0 0 ${textShadowSpread + 8}px ${accentColor},
                0 0 ${textShadowSpread + 20}px ${accentColor}88,
                2px 2px 0px rgba(0,0,0,0.8)
              `,
              WebkitTextStroke: `1px ${accentColor}`,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function ShockwavePopComponent(props: MotionGraphicProps<ShockwavePopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shockwave-pop',
  title: 'Shockwave Pop',
  description:
    'Word explodes in with concentric shockwave rings radiating outward, neon glow halo, and Impact font. Hold phase micro-pulses. Punchy emphasis for highlight words like INCREDIBLE or WARNING.',
  tags: [
    'kinetic',
    'typography',
    'shockwave',
    'pop',
    'impact',
    'highlight',
    'emphasis',
    'neon',
    'glow',
    'rings',
    'explosive',
    'punch',
    'attention',
  ],
  category: 'captions',
  component: ShockwavePopComponent as any,
  defaultConfig: {
    words: ['INCREDIBLE', 'WARNING', 'FREE', 'NOW'],
    colors: ['#FF3CAC', '#FFEB3B', '#00E5FF', '#FF6B00'],
    bgColor: '#0D0D0D',
    cycleDuration: 1.0,
    ringCount: 3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['INCREDIBLE', 'WARNING', 'FREE', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF3CAC', '#FFEB3B', '#00E5FF', '#FF6B00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D0D', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 3,
      group: 'Timing',
    },
    { key: 'ringCount', label: 'Ring Count', type: 'number', defaultValue: 3, min: 1, max: 5, group: 'Animation' },
  ],
})
