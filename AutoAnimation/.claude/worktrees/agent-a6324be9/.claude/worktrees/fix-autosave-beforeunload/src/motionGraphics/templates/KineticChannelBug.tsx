import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChannelBugConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Noise/grain overlay for broadcast feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at ${50 + Math.sin(frame * 0.3) * 2}% ${50 + Math.cos(frame * 0.2) * 2}%, rgba(255,255,255,0.015), transparent 70%)`,
          }}
        />

        {/* Channel bug in top-right corner */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            right: '4%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            opacity: 0.6 + Math.sin(time * 0.5) * 0.1,
          }}
        >
          {/* Network logo box */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 'clamp(8px, 2vw, 14px)',
                height: 'clamp(8px, 2vw, 14px)',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3498db, #2ecc71)',
              }}
            />
            <span
              style={{
                fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(10px, 2.5vw, 18px)',
                fontWeight: 900,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: 2,
              }}
            >
              NTW
            </span>
          </div>
          {/* HD badge */}
          <span
            style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: 'clamp(5px, 1vw, 8px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 3,
              marginTop: 3,
            }}
          >
            HD
          </span>
        </div>

        {/* Bottom-left program info */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '4%',
            opacity: 0.25,
          }}
        >
          <div style={{ fontFamily: "'Arial', sans-serif", fontSize: 'clamp(7px, 1.3vw, 10px)', color: '#FFFFFF', letterSpacing: 1 }}>
            PRIME TIME
          </div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(6px, 1vw, 8px)', color: '#AAAAAA', marginTop: 2 }}>
            {Math.floor(time) % 12 || 12}:{String(Math.floor((time * 4) % 60)).padStart(2, '0')} PM
          </div>
        </div>

        {/* Rating badge */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '4%',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '2px 6px',
            borderRadius: 2,
            opacity: 0.3,
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 'clamp(6px, 1.2vw, 9px)',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 1,
            }}
          >
            TV-14
          </span>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const currentFrame = frame ?? 0
    let opacity = 1
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Fade in with slight scale-up, like a broadcast dissolve
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      scale = 0.92 + eased * 0.08
      blur = (1 - eased) * 3
    } else if (phase === 'hold') {
      opacity = 1
      // Very subtle breathing
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.008
    } else {
      // Dissolve fade out
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      scale = 1 - eased * 0.05
      blur = eased * 4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
          textAlign: 'center',
        }}
      >
        {/* Network identifier ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(120px, 35vw, 280px)',
            height: 'clamp(120px, 35vw, 280px)',
            borderRadius: '50%',
            border: `2px solid ${color}15`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(32px, 10vw, 120px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: `0 0 40px ${color}15`,
            lineHeight: 1,
          }}
        >
          {word}
        </div>
        {/* Subtle tagline below */}
        <div
          style={{
            marginTop: 8,
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(7px, 1.5vw, 11px)',
            fontWeight: 400,
            color: `${color}66`,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          ON AIR
        </div>
      </div>
    )
  },
}

function ChannelBugComponent(props: MotionGraphicProps<ChannelBugConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-channel-bug',
  title: 'Channel Bug',
  description: 'Network channel watermark bug with broadcast dissolve fade, corner network identifier, rating badge, HD tag, and on-air presence',
  tags: ['kinetic', 'typography', 'broadcast', 'channel', 'bug', 'watermark', 'network', 'television', 'logo'],
  category: 'captions',
  component: ChannelBugComponent as any,
  defaultConfig: {
    words: ['NTW', 'PRIME', 'LIVE', 'HD'],
    colors: ['#FFFFFF', '#3498db', '#FFFFFF', '#2ecc71'],
    bgColor: '#0a0a14',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NTW', 'PRIME', 'LIVE', 'HD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#3498db', '#FFFFFF', '#2ecc71'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
