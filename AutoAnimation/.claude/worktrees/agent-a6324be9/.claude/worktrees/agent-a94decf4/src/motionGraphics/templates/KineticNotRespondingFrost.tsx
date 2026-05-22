import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NotRespondingFrostConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// macOS/Windows "Not Responding" frosted/greyed effect
// App window goes inactive: frost overlay, beach ball/spinner, frozen state
// Text enters through this "frozen window" aesthetic

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Frost/blur overlay pattern — simulated frosted glass
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Frosted glass texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(200,210,230,0.04)',
          }}
        />
        {/* Subtle noise for frost texture */}
        {Array.from({ length: 30 }, (_, i) => {
          const x = rand(i * 7) * 100
          const y = rand(i * 13) * 100
          const size = 1 + rand(i * 19) * 3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'rgba(220,230,255,0.04)',
              }}
            />
          )
        })}
        {/* Window title bar mockup */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 28,
            background: 'rgba(180,180,200,0.08)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
            gap: 6,
          }}
        >
          {/* Traffic light buttons — greyed */}
          {['rgba(255,100,100,0.25)', 'rgba(255,200,0,0.25)', 'rgba(100,200,100,0.25)'].map((c, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: c,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 8,
              fontFamily: '-apple-system, "Helvetica Neue", sans-serif',
              fontSize: 10,
              color: 'rgba(200,200,220,0.35)',
              letterSpacing: 0.3,
            }}
          >
            App — (Not Responding)
          </div>
        </div>
        {/* Beach ball spinner — simplified rotating arc */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'rgba(255,100,100,0.4)',
            borderRightColor: 'rgba(100,200,100,0.4)',
            borderBottomColor: 'rgba(100,100,255,0.4)',
            borderLeftColor: 'rgba(255,200,0,0.4)',
            transform: `rotate(${time * 200}deg)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Not responding: text "freezes" — opacity drops, frost overlay appears
    // Then on snap-back, text becomes fully clear and crisp

    if (phase === 'enter') {
      // Start fully frozen/greyed, then app "responds" and clears
      const frozenProgress = 1 - enterProgress
      const frostedOpacity = frozenProgress * 0.6

      return (
        <>
          {/* Frozen/greyed version underneath */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: '-apple-system, "Arial", sans-serif',
              fontSize: 'clamp(36px, 10vw, 150px)',
              fontWeight: 800,
              color: 'rgba(160,170,190,0.7)',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              opacity: frostedOpacity,
              filter: `blur(${frozenProgress * 3}px) grayscale(${frozenProgress * 100}%)`,
            }}
          >
            {word}
          </div>
          {/* Live / responding version */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: '-apple-system, "Arial", sans-serif',
              fontSize: 'clamp(36px, 10vw, 150px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              opacity: enterProgress,
            }}
          >
            {word}
          </div>
          {/* Frost overlay fades out */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(200,210,230,${frostedOpacity * 0.15})`,
              backdropFilter: `blur(${frozenProgress * 4}px)`,
              pointerEvents: 'none',
            }}
          />
        </>
      )
    }

    if (phase === 'hold') {
      // Brief re-freeze: app stutters and goes unresponsive again momentarily
      const reFreeze = holdProgress > 0.45 && holdProgress < 0.55
      const refreezeIntensity = reFreeze ? Math.sin(((holdProgress - 0.45) / 0.1) * Math.PI) : 0

      return (
        <>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: '-apple-system, "Arial", sans-serif',
              fontSize: 'clamp(36px, 10vw, 150px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              filter:
                refreezeIntensity > 0.3 ? `grayscale(${refreezeIntensity * 80}%) blur(${refreezeIntensity}px)` : 'none',
              opacity: 1 - refreezeIntensity * 0.4,
            }}
          >
            {word}
          </div>
          {reFreeze && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `rgba(200,210,230,${refreezeIntensity * 0.1})`,
                pointerEvents: 'none',
              }}
            />
          )}
        </>
      )
    }

    // Exit: app freezes again permanently — greyed out fade
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: '-apple-system, "Arial", sans-serif',
          fontSize: 'clamp(36px, 10vw, 150px)',
          fontWeight: 800,
          color: exitProgress > 0.5 ? 'rgba(160,170,190,0.8)' : color,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          opacity: 1 - exitProgress,
          filter: `grayscale(${exitProgress * 100}%) blur(${exitProgress * 2}px)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function NotRespondingFrostComponent(props: MotionGraphicProps<NotRespondingFrostConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-not-responding-frost',
  title: 'Kinetic Not Responding Frost',
  description:
    'macOS "Not Responding" frosted window — text emerges from frozen greyed state as app recovers, with spinning beach ball and window chrome',
  tags: ['kinetic', 'typography', 'glitch', 'os', 'macos', 'frozen', 'app', 'digital', 'software'],
  category: 'captions',
  component: NotRespondingFrostComponent as any,
  defaultConfig: {
    words: ['FROZEN', 'WAITING', 'HANG', 'RESPOND'],
    colors: ['#7FAAEE', '#6699DD', '#8ABBFF', '#7FAAEE'],
    bgColor: '#0d1018',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FROZEN', 'WAITING', 'HANG', 'RESPOND'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#7FAAEE', '#6699DD', '#8ABBFF', '#7FAAEE'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1018', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
