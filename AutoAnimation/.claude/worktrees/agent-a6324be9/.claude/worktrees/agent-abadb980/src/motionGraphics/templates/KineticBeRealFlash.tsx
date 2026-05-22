import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BeRealFlashConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Flash burst at start
    const flashBurst = Math.max(0, 1 - time * 4)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Camera flash overlay */}
        {flashBurst > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(255,255,255,${flashBurst * 0.7})`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}

        {/* BeReal notification bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'clamp(28px, 5.5vw, 44px)',
            background: '#000',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(11px, 2.2vw, 17px)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: -0.5,
            }}
          >
            BeReal.
          </span>
        </div>

        {/* Dual camera placeholder frames */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(32px, 6.5vw, 52px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(100px, 28vw, 180px)',
            height: 'clamp(70px, 20vw, 130px)',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Rear cam */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(40,40,40,0.8), rgba(20,20,20,0.95))',
            }}
          />
          {/* Front cam pip */}
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              width: '35%',
              height: '45%',
              background: 'rgba(60,60,60,0.9)',
              borderRadius: 6,
              border: '2px solid #000',
            }}
          />
          {/* 2 min ago label */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: 6,
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(5px, 0.8vw, 6px)',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 600,
            }}
          >
            2 min late
          </div>
        </div>

        {/* Reaction emoji burst */}
        {[{ e: '😂', x: 0.12, y: 0.55 }, { e: '🔥', x: 0.75, y: 0.5 }, { e: '💀', x: 0.2, y: 0.7 }, { e: '😭', x: 0.8, y: 0.68 }].map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${r.x * 100}%`,
              top: `${r.y * 100}%`,
              fontSize: 'clamp(10px, 2vw, 16px)',
              opacity: 0.3,
            }}
          >
            {r.e}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Flash then word slams in
    const flashP = Math.min(1, enterProgress * 8)
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.15) / 0.85)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.1) * 4))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.1) * 0.015 : 1

    // "2 min late" counter that increments
    const minutesLate = 2 + Math.floor(f * 0.02)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* TIME IS UP banner */}
        <div
          style={{
            position: 'absolute',
            top: '52%',
            left: '50%',
            transform: `translateX(-50%) scale(${easeOutExpo(Math.min(1, enterProgress * 3))})`,
            opacity: Math.min(1, enterProgress * 6) * (phase === 'exit' ? Math.max(0, 1 - exitProgress * 4) : 1),
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(8px, 1.6vw, 12px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Time to BeReal · {minutesLate} min ago
          </div>
        </div>

        {/* Main word — slams in like BeReal notification */}
        <div
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '50%',
            transform: `translateX(-50%) scale(${wordP * pulse})`,
            opacity: wordOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(36px, 9vw, 124px)',
              fontWeight: 900,
              color,
              textShadow: `0 0 0px transparent`,
              letterSpacing: -3,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function BeRealFlashComponent(props: MotionGraphicProps<BeRealFlashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bereal-flash',
  title: 'Kinetic BeReal Flash',
  description:
    'BeReal dual-camera moment — a white camera flash bursts, rear+front cam frames appear, reaction emojis float, then the word slams in with the raw unfiltered BeReal energy',
  tags: ['kinetic', 'typography', 'bereal', 'camera', 'authentic', 'platform', 'digital-native', 'social', 'flash'],
  category: 'captions',
  component: BeRealFlashComponent as any,
  defaultConfig: {
    words: ['REAL', 'AUTHENTIC', 'NOW', 'UNFILTERED'],
    colors: ['#FFFFFF', '#FFD60A', '#FF3B30', '#30D158'],
    bgColor: '#000000',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REAL', 'AUTHENTIC', 'NOW', 'UNFILTERED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD60A', '#FF3B30', '#30D158'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
