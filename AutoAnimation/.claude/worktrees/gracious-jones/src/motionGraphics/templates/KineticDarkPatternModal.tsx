import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DarkPatternModalConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Classic dark pattern deceptive UI buttons
const DARK_PATTERNS = [
  { confirm: 'YES! Start my free trial', dismiss: 'No thanks, I hate saving money', color: '#FF3B30' },
  { confirm: 'Subscribe & Save!', dismiss: "No, I'd rather pay full price", color: '#FF9500' },
  { confirm: 'Stay signed in', dismiss: 'Delete all my data', color: '#AF52DE' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Urgency countdown
    const secondsLeft = Math.max(0, Math.floor(15 - time))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Blurred page-behind */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(30,60,90,0.3), rgba(60,20,80,0.3))',
            filter: 'blur(3px)',
          }}
        />

        {/* Faint URL bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'clamp(18px, 3.5vw, 28px)',
            background: '#f8f8f8',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'clamp(8px, 2vw, 16px)',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 'clamp(6px, 1vw, 8px)', color: '#34C759', fontFamily: 'system-ui, sans-serif' }}>🔒</span>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(6px, 1vw, 8px)', color: 'rgba(0,0,0,0.5)' }}>
            totallysafe-deals.com
          </span>
          <div
            style={{
              marginLeft: 'auto',
              marginRight: 'clamp(6px, 1.5vw, 12px)',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1vw, 8px)',
              color: '#FF3B30',
              fontWeight: 700,
            }}
          >
            ⏱ {secondsLeft}s
          </div>
        </div>

        {/* Confetti / excitement decoration */}
        {['🎉', '⭐', '🎊', '✨'].map((e, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${20 + i * 20}%`,
              top: `${15 + Math.sin(time * 2 + i) * 8}%`,
              fontSize: 'clamp(10px, 2vw, 16px)',
              opacity: 0.25,
              transform: `rotate(${time * 30 + i * 45}deg)`,
            }}
          >
            {e}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const dp = DARK_PATTERNS[index % DARK_PATTERNS.length]

    // Modal slides up
    const modalP = easeOutBack(Math.min(1, enterProgress / 0.4))
    const modalOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, enterProgress * 5)
    const modalY = (1 - easeOutExpo(Math.min(1, enterProgress / 0.4))) * 40

    // Word replaces the confirm button text, massive scale
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.55) / 0.45)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.5) * 5))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.09) * 0.015 : 1

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Dark pattern modal */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${modalY}px) scale(${modalP})`,
            opacity: modalOpacity * (phase === 'enter' && enterProgress > 0.5 ? Math.max(0.1, 1 - (enterProgress - 0.5) * 5) : 1),
            width: 'clamp(150px, 45vw, 300px)',
            background: '#fff',
            borderRadius: 16,
            padding: 'clamp(10px, 2.5vw, 20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.5vw, 12px)',
          }}
        >
          {/* Warning icon */}
          <div style={{ textAlign: 'center', fontSize: 'clamp(16px, 3.5vw, 28px)' }}>🎁</div>

          {/* Fake urgency headline */}
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(9px, 1.7vw, 13px)',
              fontWeight: 800,
              color: '#000',
              textAlign: 'center',
            }}
          >
            WAIT! Don't leave yet!
          </div>

          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              color: 'rgba(0,0,0,0.55)',
              textAlign: 'center',
            }}
          >
            You're missing out on an exclusive offer...
          </div>

          {/* Big green confirm button */}
          <div
            style={{
              background: dp.color,
              borderRadius: 8,
              padding: 'clamp(5px, 1.2vw, 9px) clamp(8px, 2vw, 14px)',
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {dp.confirm}
          </div>

          {/* Shame link */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(5px, 0.9vw, 7px)',
              color: 'rgba(0,0,0,0.3)',
              textDecoration: 'underline',
            }}
          >
            {dp.dismiss}
          </div>
        </div>

        {/* Main word — the thing they're actually selling */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
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
              fontSize: 'clamp(34px, 8.5vw, 118px)',
              fontWeight: 900,
              color,
              textShadow: `0 0 24px ${color}55`,
              letterSpacing: -2,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function DarkPatternModalComponent(props: MotionGraphicProps<DarkPatternModalConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dark-pattern-modal',
  title: 'Kinetic Dark Pattern Modal',
  description:
    'Dark pattern popup — urgency countdown, shame-text dismiss link, and a manipulative confirm button slide in, then the word punches through as what they really want you to do',
  tags: ['kinetic', 'typography', 'dark-pattern', 'modal', 'ux', 'internet-moment', 'digital-native', 'viral', 'humor'],
  category: 'captions',
  component: DarkPatternModalComponent as any,
  defaultConfig: {
    words: ['NOPE', 'TRAP', 'SCAM', 'SKIP'],
    colors: ['#FF3B30', '#FF9500', '#AF52DE', '#007AFF'],
    bgColor: '#1C1C1E',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NOPE', 'TRAP', 'SCAM', 'SKIP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3B30', '#FF9500', '#AF52DE', '#007AFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1C1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
