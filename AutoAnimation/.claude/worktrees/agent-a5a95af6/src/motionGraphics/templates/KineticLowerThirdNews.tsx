import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LowerThirdNewsConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Lower third container */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: 0,
            right: 0,
            height: '28%',
          }}
        >
          {/* Name plate background - dark blue */}
          <div
            style={{
              position: 'absolute',
              bottom: '50%',
              left: '3%',
              width: '55%',
              height: '50%',
              background: 'linear-gradient(135deg, #0a2463, #1e3a7a)',
              borderLeft: '4px solid #3498db',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '3%',
            }}
          >
            <span
              style={{
                fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(9px, 2.2vw, 16px)',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              JOHN CORRESPONDENT
            </span>
          </div>

          {/* Title bar - lighter blue */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '3%',
              width: '60%',
              height: '50%',
              background: 'linear-gradient(135deg, #1a5276, #2980b9)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '3%',
            }}
          >
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: 'clamp(7px, 1.6vw, 12px)',
                fontWeight: 500,
                color: '#E0E0E0',
                letterSpacing: 0.5,
              }}
            >
              Senior Political Correspondent
            </span>
          </div>

          {/* Animated reveal stripe */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '3%',
              width: `${Math.min(100, (time % 8) * 18)}%`,
              maxWidth: '62%',
              height: 3,
              background: 'linear-gradient(90deg, #3498db, #e74c3c)',
              borderRadius: 1,
            }}
          />
        </div>

        {/* Network logo placeholder in top-right */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            right: '3%',
            padding: '4px 12px',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 2,
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 'clamp(8px, 2vw, 14px)',
              fontWeight: 900,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 2,
            }}
          >
            NEWS
          </span>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    let opacity = 1
    let clipPercent = 0

    if (phase === 'enter') {
      // Stripe reveal: clip from left to right
      clipPercent = (1 - enterProgress) * 100
      opacity = 1
    } else if (phase === 'hold') {
      clipPercent = 0
      opacity = 1
    } else {
      // Reverse stripe: clip from right to left
      clipPercent = 0
      opacity = 1 - Math.pow(exitProgress, 2)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Thin accent line above */}
        <div
          style={{
            width: phase === 'enter' ? `${enterProgress * 100}%` : '100%',
            height: 2,
            background: '#3498db',
            margin: '0 auto 12px',
            transition: 'none',
          }}
        />
        <div
          style={{
            fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            clipPath: `inset(0 ${clipPercent}% 0 0)`,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            lineHeight: 1.1,
          }}
        >
          {word}
        </div>
        {/* Thin accent line below */}
        <div
          style={{
            width: phase === 'enter' ? `${enterProgress * 80}%` : '80%',
            height: 1,
            background: 'rgba(52, 152, 219, 0.5)',
            margin: '10px auto 0',
          }}
        />
      </div>
    )
  },
}

function LowerThirdNewsComponent(props: MotionGraphicProps<LowerThirdNewsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lower-third-news',
  title: 'Lower Third News',
  description: 'Broadcast lower third with name plate, title bar, animated stripe reveal, and network-quality typography',
  tags: ['kinetic', 'typography', 'broadcast', 'lower-third', 'news', 'chyron', 'name-plate', 'television'],
  category: 'captions',
  component: LowerThirdNewsComponent as any,
  defaultConfig: {
    words: ['HEADLINE', 'REPORT', 'UPDATE', 'EXCLUSIVE'],
    colors: ['#FFFFFF', '#3498db', '#FFFFFF', '#e74c3c'],
    bgColor: '#0a0a14',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEADLINE', 'REPORT', 'UPDATE', 'EXCLUSIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#3498db', '#FFFFFF', '#e74c3c'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
