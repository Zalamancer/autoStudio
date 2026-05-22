import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DuolingoStreakConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

const LESSON_ITEMS = [
  { label: 'Spanish', progress: 0.82, xp: 340, color: '#58CC02' },
  { label: 'French', progress: 0.45, xp: 180, color: '#1CB0F6' },
  { label: 'Japanese', progress: 0.63, xp: 250, color: '#FF9600' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Flame flicker
    const flicker = 0.9 + Math.sin(time * 12) * 0.1
    const flicker2 = 0.85 + Math.sin(time * 9 + 1.3) * 0.15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Duolingo top nav */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'clamp(28px, 5.5vw, 44px)',
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '2px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'clamp(10px, 2.5vw, 20px)',
            paddingRight: 'clamp(10px, 2.5vw, 20px)',
            gap: 'clamp(8px, 2vw, 16px)',
          }}
        >
          {/* Streak flame */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 'clamp(12px, 2.3vw, 18px)', transform: `scale(${flicker})`, display: 'inline-block' }}>
              🔥
            </span>
            <span
              style={{
                fontFamily: '"Nunito", system-ui, sans-serif',
                fontSize: 'clamp(9px, 1.7vw, 13px)',
                fontWeight: 800,
                color: '#FF9600',
              }}
            >
              47
            </span>
          </div>
          {/* Gem/hearts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 'clamp(10px, 2vw, 16px)' }}>💎</span>
            <span
              style={{
                fontFamily: '"Nunito", system-ui, sans-serif',
                fontSize: 'clamp(9px, 1.7vw, 13px)',
                fontWeight: 800,
                color: '#1CB0F6',
              }}
            >
              850
            </span>
          </div>
          <div style={{ flex: 1 }} />
          {/* XP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 'clamp(10px, 2vw, 16px)' }}>⚡</span>
            <span
              style={{
                fontFamily: '"Nunito", system-ui, sans-serif',
                fontSize: 'clamp(9px, 1.7vw, 13px)',
                fontWeight: 800,
                color: '#FFD900',
              }}
            >
              770 XP
            </span>
          </div>
        </div>

        {/* Bottom nav */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'clamp(28px, 5.5vw, 44px)',
            background: 'rgba(255,255,255,0.04)',
            borderTop: '2px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          {['🏠', '🔍', '🏆', '👤'].map((icon, i) => (
            <span
              key={i}
              style={{
                fontSize: 'clamp(12px, 2.2vw, 17px)',
                opacity: i === 0 ? 1 : 0.35,
              }}
            >
              {icon}
            </span>
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const nodes: React.ReactNode[] = []

    // Streak count fires in with elastic bounce
    const streakP = easeOutElastic(Math.min(1, enterProgress / 0.35))
    const streakOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 3) : Math.min(1, enterProgress * 5)

    nodes.push(
      <div
        key="streak"
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          transform: `translateX(-50%) scale(${streakP})`,
          opacity: streakOpacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(32px, 8vw, 64px)',
            filter: `drop-shadow(0 0 ${12 + Math.sin(f * 0.15) * 4}px #FF9600)`,
          }}
        >
          🔥
        </div>
        <div
          style={{
            fontFamily: '"Nunito", system-ui, sans-serif',
            fontSize: 'clamp(14px, 3vw, 22px)',
            fontWeight: 900,
            color: '#FF9600',
            lineHeight: 1,
            marginTop: -4,
          }}
        >
          {47 + index} day streak!
        </div>
      </div>,
    )

    // Progress bars slide in
    LESSON_ITEMS.forEach((item, i) => {
      const delay = 0.2 + i * 0.1
      const barP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - delay) / 0.25)))
      const barOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 2) : barP
      const barY = height * 0.38 + i * (Math.min(height * 0.1, 30) + 6)

      nodes.push(
        <div
          key={`bar-${i}`}
          style={{
            position: 'absolute',
            left: width * 0.1,
            top: barY,
            width: width * 0.8,
            opacity: barOpacity,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 3,
              fontFamily: '"Nunito", system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <span>{item.label}</span>
            <span style={{ color: item.color }}>{item.xp} XP</span>
          </div>
          <div
            style={{
              height: 'clamp(6px, 1.2vw, 9px)',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${item.progress * barP * 100}%`,
                background: item.color,
                borderRadius: 100,
                transition: 'none',
              }}
            />
          </div>
        </div>,
      )
    })

    // Main word explodes like a lesson complete
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.6) / 0.4)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.55) * 5))
    const bounce = phase === 'hold' ? 1 + Math.sin(f * 0.1) * 0.02 : 1

    nodes.push(
      <div
        key="word"
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: `translateX(-50%) scale(${wordP * bounce})`,
          opacity: wordOpacity,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontFamily: '"Nunito", system-ui, sans-serif',
            fontSize: 'clamp(36px, 9vw, 124px)',
            fontWeight: 900,
            color,
            textShadow: `0 4px 0 ${color}55, 0 0 30px ${color}44`,
            letterSpacing: -1,
          }}
        >
          {word}
        </div>
      </div>,
    )

    return <>{nodes}</>
  },
}

function DuolingoStreakComponent(props: MotionGraphicProps<DuolingoStreakConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-duolingo-streak',
  title: 'Kinetic Duolingo Streak',
  description:
    'Duolingo app UI with a flame streak count that bounces in with elastic scale, XP progress bars fill in, then the word celebrates like a lesson complete',
  tags: ['kinetic', 'typography', 'duolingo', 'streak', 'gamification', 'learning', 'platform', 'digital-native', 'app'],
  category: 'captions',
  component: DuolingoStreakComponent as any,
  defaultConfig: {
    words: ['STREAK', 'LEARN', 'FLUENT', 'GOALS'],
    colors: ['#58CC02', '#FF9600', '#1CB0F6', '#FF4B4B'],
    bgColor: '#131F24',
    cycleDuration: 2.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STREAK', 'LEARN', 'FLUENT', 'GOALS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#58CC02', '#FF9600', '#1CB0F6', '#FF4B4B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#131F24', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
