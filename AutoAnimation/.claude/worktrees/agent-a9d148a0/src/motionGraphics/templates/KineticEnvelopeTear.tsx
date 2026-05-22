import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EnvelopeTearConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const envW = Math.min(width * 0.6, height * 0.45)
    const envH = envW * 0.65

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Desk surface — warm wood */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(80,60,40,0.15), transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        {/* Envelope body */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: envW,
            height: envH,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(160deg, #f0e8d6 0%, #e8dcc4 100%)',
            borderRadius: 2,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {/* Envelope interior visible as darker triangle at top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              background: 'linear-gradient(180deg, rgba(200,180,150,0.3), rgba(180,160,130,0.1))',
            }}
          />
          {/* Torn edge at top — jagged paper tear */}
          <div
            style={{
              position: 'absolute',
              top: -2,
              left: 0,
              right: 0,
              height: 8,
              overflow: 'hidden',
            }}
          >
            <svg
              width="100%"
              height="8"
              viewBox={`0 0 ${envW} 8`}
              preserveAspectRatio="none"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <path
                d={generateTearPath(envW, 8, 15)}
                fill="#e8dcc4"
                stroke="none"
              />
            </svg>
          </div>
          {/* Faint address lines */}
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${55 + i * 10}%`,
                left: '30%',
                width: `${45 - i * 8}%`,
                height: 1,
                background: 'rgba(80,60,40,0.06)',
              }}
            />
          ))}
          {/* Stamp */}
          <div
            style={{
              position: 'absolute',
              top: '55%',
              right: '8%',
              width: envW * 0.08,
              height: envW * 0.1,
              background: 'linear-gradient(135deg, #2a6aa0, #1a4a80)',
              borderRadius: 1,
              opacity: 0.4,
            }}
          />
        </div>
        {/* Torn strip — the piece cut by letter opener */}
        <div
          style={{
            position: 'absolute',
            top: `${50 - (envH / height) * 50 - 2}%`,
            left: '50%',
            width: envW,
            height: 12,
            transform: `translate(-50%, -50%) rotate(${1 + Math.sin(time * 0.8) * 0.3}deg)`,
            background: 'linear-gradient(180deg, #f0e8d6, #e0d4bc)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {/* Torn bottom edge */}
          <div
            style={{
              position: 'absolute',
              bottom: -3,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, rgba(180,160,130,0.3), rgba(180,160,130,0.5), rgba(180,160,130,0.3))',
              filter: 'blur(0.5px)',
            }}
          />
        </div>
        {/* Letter opener — sleek blade at angle */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            right: '15%',
            width: 8,
            height: envW * 0.6,
            background: 'linear-gradient(90deg, #c0c0c0, #e0e0e0, #c0c0c0)',
            transform: `rotate(${35 + Math.sin(time * 0.5) * 2}deg)`,
            borderRadius: '2px 2px 50% 50%',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            opacity: 0.6,
          }}
        >
          {/* Handle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: -2,
              width: 12,
              height: '35%',
              background: 'linear-gradient(90deg, #5a3a20, #7a5030, #5a3a20)',
              borderRadius: 3,
            }}
          />
        </div>
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
    index,
    width,
    height,
  }: WordRenderProps) => {
    const envW = Math.min(width * 0.6, height * 0.45)
    let opacity = 0
    let translateY = 0
    let scale = 1
    let letterReveal = 0 // 0 to 1, how much of the letter is pulled out

    if (phase === 'enter') {
      if (enterProgress < 0.3) {
        // Tear begins — anticipation
        const t = enterProgress / 0.3
        opacity = t * 0.3
        translateY = 20
        letterReveal = 0
      } else if (enterProgress < 0.6) {
        // Letter slides up out of envelope
        const t = (enterProgress - 0.3) / 0.3
        opacity = 0.3 + t * 0.5
        translateY = 20 - t * 40
        letterReveal = t * 0.8
        scale = 0.9 + t * 0.05
      } else {
        // Letter fully revealed — settles
        const t = (enterProgress - 0.6) / 0.4
        opacity = 0.8 + t * 0.2
        translateY = -20 + t * 5
        letterReveal = 0.8 + t * 0.2
        scale = 0.95 + t * 0.05
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateY = -15
      letterReveal = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.008
    } else {
      // Letter slides back / fades
      const t = exitProgress
      opacity = 1 - t
      translateY = -15 + t * 30
      letterReveal = 1 - t * 0.5
      scale = 1 - t * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: `translate(-50%, ${translateY}px) scale(${scale})`,
          opacity,
        }}
      >
        {/* Letter paper */}
        <div
          style={{
            position: 'relative',
            padding: '16px 28px',
            background: 'linear-gradient(180deg, #ffffff 0%, #faf8f4 100%)',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Clip mask — progressive reveal from bottom */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, #ffffff 0%, #faf8f4 100%)',
              clipPath: `inset(${(1 - letterReveal) * 100}% 0 0 0)`,
            }}
          />
          {/* Text content */}
          <div
            style={{
              position: 'relative',
              fontFamily: "'Georgia', 'Palatino Linotype', serif",
              fontSize: 'clamp(24px, 7vw, 68px)',
              fontWeight: 700,
              color,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              textAlign: 'center',
              opacity: letterReveal,
            }}
          >
            {word}
          </div>
          {/* Fold crease line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '5%',
              right: '5%',
              height: 1,
              background: 'rgba(0,0,0,0.04)',
            }}
          />
        </div>
      </div>
    )
  },
}

/** Generate a jagged tear path for SVG */
function generateTearPath(w: number, h: number, segments: number): string {
  const points: string[] = [`M 0 ${h}`]
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * w
    const y = h * 0.3 + Math.sin(i * 3.7) * h * 0.25 + Math.cos(i * 5.1) * h * 0.15
    points.push(`L ${x} ${y}`)
  }
  points.push(`L ${w} ${h} Z`)
  return points.join(' ')
}

function EnvelopeTearComponent(props: MotionGraphicProps<EnvelopeTearConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-envelope-tear',
  title: 'Kinetic Envelope Tear',
  description:
    'Letter opener slices open an envelope, paper tears apart revealing a letter that slides upward. Text emerges from inside the correspondence with anticipation and reveal.',
  tags: ['kinetic', 'typography', 'envelope', 'tear', 'letter', 'opener', 'reveal', 'postal', 'correspondence'],
  category: 'captions',
  component: EnvelopeTearComponent as any,
  defaultConfig: {
    words: ['OPEN', 'READ', 'DEAR', 'NEWS'],
    colors: ['#1a2a4a', '#1a2a4a', '#1a2a4a', '#1a2a4a'],
    bgColor: '#5a4a38',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OPEN', 'READ', 'DEAR', 'NEWS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a2a4a', '#1a2a4a', '#1a2a4a', '#1a2a4a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#5a4a38', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
