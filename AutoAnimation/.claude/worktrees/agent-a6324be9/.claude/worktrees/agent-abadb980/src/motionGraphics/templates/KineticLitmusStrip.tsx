import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Litmus test pH strip: a horizontal color-band sweeps across the text
// left-to-right during enter (like dye wicking through paper),
// revealing the word in the indicator color. On exit the band sweeps out right.

interface LitmusStripConfig extends KineticBaseConfig {
  acidColor: string
  baseColor: string
  neutralColor: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    width,
  }: WordRenderProps) => {
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    // clip-path wipe: reveal text left→right on enter, wipe out right→left on exit
    const easedEnter = easeInOut(enterProgress)
    const easedExit  = easeInOut(exitProgress)

    const revealPct   = phase === 'enter' ? easedEnter * 100 : phase === 'exit' ? (1 - easedExit) * 100 : 100
    const clipPath    = `inset(0 ${(100 - revealPct).toFixed(2)}% 0 0)`

    // Behind the clip: ghost text in a muted strip color
    const ghostOpacity = phase === 'enter' ? 0.18 : phase === 'exit' ? (1 - easedExit) * 0.18 : 0

    // pH strip band: a narrow vertical bar at the leading edge of the wipe
    const bandX = revealPct   // percentage from left
    const bandVisible = phase !== 'hold'

    // Color transitions: acid → neutral → base as words cycle
    // We use the word's color directly but add a strip indicator bar
    // that interpolates acid→base along the strip width
    const stripGradient = `linear-gradient(
      to right,
      #ff3b3b 0%,
      #ff9900 20%,
      #ffee00 35%,
      #44ee44 50%,
      #00aaff 70%,
      #6633ff 100%
    )`

    const opacity = phase === 'enter' ? easedEnter : phase === 'exit' ? 1 - easedExit : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* pH spectrum strip bar */}
        <div
          style={{
            width: 'clamp(180px, 40vw, 440px)',
            height: 10,
            borderRadius: 5,
            background: stripGradient,
            opacity: opacity * 0.75,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {/* indicator needle */}
          {bandVisible && (
            <div
              style={{
                position: 'absolute',
                top: -6,
                left: `${bandX}%`,
                transform: 'translateX(-50%)',
                width: 3,
                height: 22,
                background: '#ffffff',
                borderRadius: 2,
                boxShadow: '0 0 6px rgba(255,255,255,0.9)',
                opacity: bandVisible ? 1 : 0,
              }}
            />
          )}
        </div>

        {/* ghost text (uncolored strip) */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
              fontSize: 'clamp(36px, 8vw, 110px)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: '#ffffff',
              opacity: ghostOpacity,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {word}
          </div>

          {/* revealed text via clip-path wipe */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
                fontSize: 'clamp(36px, 8vw, 110px)',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color,
                whiteSpace: 'nowrap',
                textShadow: `0 0 20px ${color}88`,
              }}
            >
              {word}
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function LitmusStripComponent(props: MotionGraphicProps<LitmusStripConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-litmus-strip',
  title: 'Litmus Strip',
  description:
    'Text is revealed by a left-to-right wipe like pH indicator dye wicking through litmus paper, with a live pH spectrum strip needle above.',
  tags: ['kinetic', 'typography', 'chemistry', 'lab', 'litmus', 'pH', 'indicator', 'science', 'wipe'],
  category: 'captions',
  component: LitmusStripComponent as any,
  defaultConfig: {
    words: ['ACID', 'BASE', 'pH7', 'NEUTRAL'],
    colors: ['#ff4444', '#4488ff', '#44ee88', '#ffee44'],
    bgColor: '#111118',
    cycleDuration: 1.4,
    acidColor: '#ff3b3b',
    baseColor: '#6633ff',
    neutralColor: '#44ee44',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ACID', 'BASE', 'pH7', 'NEUTRAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff4444', '#4488ff', '#44ee88', '#ffee44'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111118', group: 'Style' },
    { key: 'acidColor', label: 'Acid Color', type: 'color', defaultValue: '#ff3b3b', group: 'Style' },
    { key: 'baseColor', label: 'Base Color', type: 'color', defaultValue: '#6633ff', group: 'Style' },
    { key: 'neutralColor', label: 'Neutral Color', type: 'color', defaultValue: '#44ee44', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.8, max: 5, group: 'Timing' },
  ],
})
