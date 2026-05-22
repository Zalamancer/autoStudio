import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SportsScoreConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const quarter = (Math.floor(time * 0.5) % 4) + 1
    const clock = `${Math.floor((time * 3) % 12)}:${String(Math.floor((time * 17) % 60)).padStart(2, '0')}`

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* ESPN-style score bug at top */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'stretch',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {/* Home team */}
          <div
            style={{
              background: '#1a3a6e',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(8px, 2vw, 14px)', fontWeight: 900, color: '#FFFFFF' }}>
              HOME
            </span>
            <span style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(10px, 2.5vw, 18px)', fontWeight: 900, color: '#FFD700' }}>
              {Math.floor(24 + Math.sin(time * 0.7) * 3)}
            </span>
          </div>
          {/* Divider + clock */}
          <div
            style={{
              background: '#222222',
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.5vw, 11px)', color: '#00FF88', lineHeight: 1 }}>
              Q{quarter}
            </span>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(6px, 1.3vw, 10px)', color: '#AAAAAA', lineHeight: 1 }}>
              {clock}
            </span>
          </div>
          {/* Away team */}
          <div
            style={{
              background: '#6e1a1a',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(10px, 2.5vw, 18px)', fontWeight: 900, color: '#FFD700' }}>
              {Math.floor(21 + Math.cos(time * 0.5) * 4)}
            </span>
            <span style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(8px, 2vw, 14px)', fontWeight: 900, color: '#FFFFFF' }}>
              AWAY
            </span>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '3%',
            left: '5%',
            right: '5%',
            height: '10%',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 3%',
          }}
        >
          {['FG%', 'REB', 'AST', 'TO'].map((stat) => (
            <div key={stat} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Arial', sans-serif", fontSize: 'clamp(6px, 1.2vw, 9px)', color: '#888888', letterSpacing: 1 }}>{stat}</div>
              <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 'clamp(8px, 1.8vw, 13px)', fontWeight: 900, color: '#FFFFFF' }}>
                {Math.floor(30 + Math.random() * 20)}
              </div>
            </div>
          ))}
        </div>

        {/* Diagonal accent lines */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0
    let scaleX = 1

    if (phase === 'enter') {
      // Slide in from right edge like ESPN highlight pop
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      translateX = width * 0.5 * (1 - eased)
      scaleX = 0.6 + eased * 0.4
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      // Quick slide out left
      const eased = Math.pow(exitProgress, 2)
      translateX = -width * 0.4 * eased
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scaleX(${scaleX})`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Accent bar above */}
        <div
          style={{
            width: '60%',
            height: 3,
            background: color,
            margin: '0 auto 8px',
            borderRadius: 1,
          }}
        />
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(36px, 11vw, 140px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textShadow: '3px 3px 0 rgba(0,0,0,0.4), 0 0 20px rgba(255,215,0,0.15)',
            lineHeight: 1,
          }}
        >
          {word}
        </div>
        {/* Accent bar below */}
        <div
          style={{
            width: '40%',
            height: 3,
            background: color,
            margin: '8px auto 0',
            borderRadius: 1,
            opacity: 0.6,
          }}
        />
      </div>
    )
  },
}

function SportsScoreComponent(props: MotionGraphicProps<SportsScoreConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sports-score',
  title: 'Sports Score',
  description: 'ESPN-style score bug overlay with team colors, game clock, quarter indicator, stats bar, and highlight pop-in text animation',
  tags: ['kinetic', 'typography', 'broadcast', 'sports', 'espn', 'score', 'bug', 'television', 'overlay'],
  category: 'captions',
  component: SportsScoreComponent as any,
  defaultConfig: {
    words: ['SCORE!', 'SLAM', 'MVP', 'CLUTCH'],
    colors: ['#FFD700', '#FFFFFF', '#00FF88', '#FF4444'],
    bgColor: '#0a0a14',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCORE!', 'SLAM', 'MVP', 'CLUTCH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFFFFF', '#00FF88', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
