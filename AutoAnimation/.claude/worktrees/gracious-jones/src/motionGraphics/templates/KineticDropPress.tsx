import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DropPressConfig extends KineticBaseConfig {
  staggerSpread: number
}

/* ── Easing ───────────────────────────────────────────────────────────── */
// Gravity-accelerated drop
function easeInQuad(t: number): number {
  return t * t
}

// Hard deceleration — stamp hits surface
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Overshoot + settle — physical impact rebound
function easeOutBack(t: number): number {
  const c1 = 1.5
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Seeded deterministic noise
function seededRand(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
  }: WordRenderProps) => {
    const chars = word.split('')
    const charCount = chars.length

    // Impact flash — brief white burst at landing moment
    const flashOpacity =
      phase === 'hold' ? Math.max(0, 1 - holdProgress * 14) * 0.16 : 0

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Impact flash overlay */}
        {flashOpacity > 0.005 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 55%, rgba(255,255,255,${flashOpacity.toFixed(3)}) 0%, transparent 65%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        <div
          style={{
            display: 'flex',
            gap: 'clamp(1px, 0.4vw, 5px)',
            alignItems: 'flex-end',
          }}
        >
          {chars.map((char, ci) => {
            // Stagger: chars drop in left-to-right across 55% of total enter time
            const staggerSpan = 0.55
            const staggerDelay = charCount > 1
              ? (ci / (charCount - 1)) * staggerSpan
              : 0

            let translateY = 0
            let scaleX = 1
            let scaleY = 1
            let opacity = 1
            let rotation = 0
            let shadowStr = 'none'

            if (phase === 'enter') {
              const t = Math.max(
                0,
                Math.min(1, (enterProgress - staggerDelay) / (1 - staggerSpan * 0.4))
              )
              const dropEased = easeOutBack(easeOutExpo(Math.min(t, 1)))

              // Falls from above with gravity
              translateY = (1 - dropEased) * -80

              // Fades in rapidly at start of drop
              opacity = Math.min(1, t * 5)

              // Squash exactly at impact moment (t ≈ 0.9)
              const impactT = Math.max(0, 1 - Math.abs(t - 0.88) * 20)
              scaleX = 1 + impactT * 0.14
              scaleY = 1 - impactT * 0.1

              // Slight random tilt during descent, snaps to zero on impact
              const tiltSeed = seededRand(ci * 7 + index * 31)
              rotation = (1 - easeOutExpo(t)) * (tiltSeed - 0.5) * 7
            } else if (phase === 'hold') {
              // Settle vibration — decays quickly, each char slightly out of phase
              const settle = Math.max(0, 1 - holdProgress * 4)
              const vibSeed = seededRand(ci * 13 + index * 17)
              const freq = 16 + vibSeed * 10
              translateY = Math.sin(holdProgress * Math.PI * freq + ci * 0.6) * settle * 1.8
              scaleX = 1 + Math.sin(holdProgress * Math.PI * freq + ci * 0.8) * settle * 0.007
              scaleY = 1 - Math.sin(holdProgress * Math.PI * freq + ci * 0.8) * settle * 0.007
              shadowStr = `0 3px 0 rgba(0,0,0,0.30), 0 6px 16px rgba(0,0,0,0.18)`
            } else {
              // Exit: lift off upward and fade — chars leave left-to-right
              const exitDelay = charCount > 1
                ? (ci / (charCount - 1)) * 0.3
                : 0
              const t = Math.max(
                0,
                Math.min(1, (exitProgress - exitDelay) / (1 - 0.3 * 0.5))
              )
              const eased = easeInQuad(t)
              translateY = eased * -58
              opacity = 1 - eased
              scaleX = 1 - eased * 0.06
              scaleY = 1 - eased * 0.06
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
                  fontSize: 'clamp(44px, 10vw, 136px)',
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                  color,
                  textTransform: 'uppercase',
                  transform: `translateY(${translateY.toFixed(2)}px) scaleX(${scaleX.toFixed(4)}) scaleY(${scaleY.toFixed(4)}) rotate(${rotation.toFixed(2)}deg)`,
                  opacity,
                  // Anchor at baseline — stamp presses downward onto it
                  transformOrigin: '50% 100%',
                  willChange: 'transform, opacity',
                  textShadow: shadowStr,
                }}
              >
                {char === ' ' ? '\u00a0' : char}
              </span>
            )
          })}
        </div>
      </div>
    )
  },
}

function DropPressComponent(props: MotionGraphicProps<DropPressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drop-press',
  title: 'Drop Press',
  description:
    'Characters slam down one by one from above with physics overshoot and a squash-on-impact. Hold phase has a decaying vibration. Clean impact intro for names, dates, and announcements.',
  tags: [
    'kinetic',
    'typography',
    'impact',
    'drop',
    'press',
    'intro',
    'bold',
    'title',
    'name',
    'announcement',
    'stagger',
  ],
  category: 'captions',
  component: DropPressComponent as any,
  defaultConfig: {
    words: ['YOUR', 'NAME', 'HERE', 'NOW'],
    colors: ['#ffffff', '#f0f0f0', '#ffffff', '#eeeeee'],
    bgColor: '#111111',
    cycleDuration: 1.3,
    staggerSpread: 0.55,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['YOUR', 'NAME', 'HERE', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#ffffff', '#f0f0f0', '#ffffff', '#eeeeee'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#111111',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.7,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'staggerSpread',
      label: 'Stagger Spread',
      type: 'number',
      defaultValue: 0.55,
      min: 0,
      max: 0.9,
      group: 'Animation',
    },
  ],
})
