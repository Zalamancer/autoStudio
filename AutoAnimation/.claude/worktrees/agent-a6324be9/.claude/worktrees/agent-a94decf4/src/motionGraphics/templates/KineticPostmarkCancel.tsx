import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PostmarkCancelConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const envW = Math.min(width * 0.7, height * 0.5)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Envelope paper surface */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: envW,
            height: envW * 0.65,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(145deg, #f5f0e6 0%, #ece4d4 50%, #e8dcc8 100%)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 0 30px rgba(0,0,0,0.02)',
          }}
        >
          {/* Paper fiber texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(180,160,130,0.04) 2px, rgba(180,160,130,0.04) 3px)',
              borderRadius: 3,
            }}
          />
          {/* Faint address lines */}
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${40 + i * 12}%`,
                left: '35%',
                width: `${50 - i * 8}%`,
                height: 1,
                background: 'rgba(100,80,60,0.08)',
              }}
            />
          ))}
          {/* Return address area (top-left) */}
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={`ret-${i}`}
              style={{
                position: 'absolute',
                top: `${12 + i * 7}%`,
                left: '6%',
                width: `${22 - i * 5}%`,
                height: 1,
                background: 'rgba(100,80,60,0.06)',
              }}
            />
          ))}
        </div>
        {/* Wavy cancellation lines across stamp area */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            right: `${50 - (envW / width) * 50 + 2}%`,
            width: envW * 0.38,
            height: envW * 0.15,
            overflow: 'hidden',
            opacity: 0.15,
          }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${i * 15}%`,
                height: 2,
                background: '#1a1a1a',
                transform: `translateX(${Math.sin(i * 2.2 + time * 0.3) * 4}px)`,
                borderRadius: 1,
              }}
            />
          ))}
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
    const stampSize = Math.min(width * 0.28, height * 0.35)
    let opacity = 0
    let scale = 1
    let rotation = -12

    if (phase === 'enter') {
      // Postmark stamp slams down
      if (enterProgress < 0.3) {
        const t = enterProgress / 0.3
        opacity = t * 0.3
        scale = 2.5 - t * 1.5
        rotation = -12 + t * 4
      } else if (enterProgress < 0.5) {
        // Impact
        const t = (enterProgress - 0.3) / 0.2
        opacity = 0.3 + t * 0.55
        scale = 1.0 + (1 - t) * 0.08
        rotation = -8 + Math.sin(t * Math.PI * 3) * 2
      } else {
        // Ink settling
        const t = (enterProgress - 0.5) / 0.5
        opacity = 0.85 + t * 0.15
        scale = 1
        rotation = -8 + Math.sin(t * Math.PI) * 0.5
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      rotation = -8 + Math.sin(holdProgress * Math.PI * 2) * 0.3
    } else {
      opacity = 1 - exitProgress * 0.8
      scale = 1 - exitProgress * 0.05
      rotation = -8 - exitProgress * 5
    }

    // Circular postmark with date text
    return (
      <div
        style={{
          position: 'absolute',
          top: '35%',
          right: '22%',
          transform: `translate(50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        {/* Outer circle */}
        <div
          style={{
            width: stampSize,
            height: stampSize,
            borderRadius: '50%',
            border: `3px solid ${color}`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner circle */}
          <div
            style={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              border: `2px solid ${color}`,
            }}
          />
          {/* Horizontal divider lines */}
          <div
            style={{
              position: 'absolute',
              top: '38%',
              left: '12%',
              right: '12%',
              height: 2,
              background: color,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '60%',
              left: '12%',
              right: '12%',
              height: 2,
              background: color,
            }}
          />
          {/* Top arc text — city name */}
          <div
            style={{
              position: 'absolute',
              top: '14%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: stampSize * 0.09,
              fontWeight: 700,
              color,
              letterSpacing: 2,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            U.S. POSTAL
          </div>
          {/* Center date — the main word */}
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: `clamp(16px, ${stampSize * 0.14}px, 48px)`,
              fontWeight: 700,
              color,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              zIndex: 2,
            }}
          >
            {word}
          </div>
          {/* Bottom arc — state/zip */}
          <div
            style={{
              position: 'absolute',
              bottom: '14%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: stampSize * 0.08,
              fontWeight: 700,
              color,
              letterSpacing: 2,
              whiteSpace: 'nowrap',
            }}
          >
            NY 10001
          </div>
          {/* Ink spatter imperfection */}
          {[0.2, 0.6, 0.85].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${pos * 100}%`,
                left: `${(pos * 70 + i * 20) % 90}%`,
                width: 3 + i,
                height: 3 + i,
                borderRadius: '50%',
                background: color,
                opacity: 0.2,
              }}
            />
          ))}
        </div>
      </div>
    )
  },
}

function PostmarkCancelComponent(props: MotionGraphicProps<PostmarkCancelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-postmark-cancel',
  title: 'Kinetic Postmark Cancel',
  description:
    'Circular date postmark stamped onto envelope with wavy cancellation lines. Ink slam-down impact with postal office authenticity, franked mail aesthetic.',
  tags: ['kinetic', 'typography', 'postmark', 'postal', 'cancellation', 'stamp', 'mail', 'franking', 'ink'],
  category: 'captions',
  component: PostmarkCancelComponent as any,
  defaultConfig: {
    words: ['MAILED', 'POSTED', 'STAMPED', 'SENT'],
    colors: ['#2a2a3a', '#2a2a3a', '#2a2a3a', '#2a2a3a'],
    bgColor: '#c4b8a0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MAILED', 'POSTED', 'STAMPED', 'SENT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a2a3a', '#2a2a3a', '#2a2a3a', '#2a2a3a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#c4b8a0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
