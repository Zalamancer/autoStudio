import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChurchSignConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const signW = Math.min(width * 0.82, 700)
    const signH = Math.min(height * 0.55, 350)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Soft outdoor background — grass at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '25%',
            background: 'linear-gradient(180deg, #2d5a1e 0%, #1e3f14 100%)',
          }}
        />
        {/* Sign structure — center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: signW,
            height: signH,
          }}
        >
          {/* Left post */}
          <div
            style={{
              position: 'absolute',
              bottom: -40,
              left: 0,
              width: 14,
              height: signH + 40,
              background: 'linear-gradient(90deg, #5a3820, #7a4e30, #5a3820)',
              borderRadius: 2,
            }}
          />
          {/* Right post */}
          <div
            style={{
              position: 'absolute',
              bottom: -40,
              right: 0,
              width: 14,
              height: signH + 40,
              background: 'linear-gradient(90deg, #5a3820, #7a4e30, #5a3820)',
              borderRadius: 2,
            }}
          />
          {/* Sign board — the white changeable letter area */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 14,
              right: 14,
              bottom: 0,
              background: '#f5f0e0',
              border: '3px solid #5a3820',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            {/* Letter track grooves — horizontal lines */}
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  top: `${14 + i * 13}%`,
                  height: 1,
                  background: 'rgba(0,0,0,0.06)',
                }}
              />
            ))}
            {/* Header strip */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 36,
                background: '#8B0000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Georgia', serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#FFD700',
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}
            >
              Community Church
            </div>
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const opacity = phase === 'exit' ? 1 - exitProgress : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '54%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 2,
          opacity,
        }}
      >
        {chars.map((char, ci) => {
          // Each letter slides in from above like being placed into the track
          const staggerDelay = ci * 0.06
          const charEnter = phase === 'enter'
            ? Math.max(0, Math.min(1, (enterProgress - staggerDelay) / 0.5))
            : 1

          // Slide down from above the sign into its slot
          const slideY = (1 - Math.min(1, charEnter * 1.2)) * -60
          const charOpacity = Math.min(1, charEnter * 2)
          // Slight wobble as letter settles
          const wobble = charEnter > 0.7 && charEnter < 1
            ? Math.sin((charEnter - 0.7) * 30) * (1 - charEnter) * 5
            : 0

          if (char === ' ') {
            return <div key={ci} style={{ width: 'clamp(10px, 2vw, 22px)' }} />
          }

          return (
            <div
              key={ci}
              style={{
                width: 'clamp(24px, 5.5vw, 56px)',
                height: 'clamp(32px, 7vw, 72px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateY(${slideY}px) rotate(${wobble}deg)`,
                opacity: charOpacity,
              }}
            >
              <span
                style={{
                  fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                  fontSize: 'clamp(20px, 5vw, 52px)',
                  fontWeight: 800,
                  color,
                  textShadow: '0 1px 1px rgba(0,0,0,0.1)',
                  lineHeight: 1,
                }}
              >
                {char}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function ChurchSignComponent(props: MotionGraphicProps<ChurchSignConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-church-sign',
  title: 'Church Letter Board',
  description:
    'Changeable-letter community sign board with wooden posts. Letters slide down one by one into horizontal tracks, wobbling slightly as they settle.',
  tags: ['kinetic', 'typography', 'church', 'sign', 'letter', 'board', 'community', 'signage', 'wayfinding'],
  category: 'captions',
  component: ChurchSignComponent as any,
  defaultConfig: {
    words: ['WELCOME', 'BE KIND', 'LOVE ALL', 'PEACE'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#8B0000'],
    bgColor: '#87CEEB',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WELCOME', 'BE KIND', 'LOVE ALL', 'PEACE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#8B0000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#87CEEB', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
