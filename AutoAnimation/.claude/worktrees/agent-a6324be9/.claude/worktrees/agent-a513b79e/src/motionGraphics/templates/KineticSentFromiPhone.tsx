import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SentFromiPhoneConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Simulated email thread
const EMAIL_THREAD = [
  { from: 'Boss', subject: 'RE: Q4 Results', body: 'Can we discuss this?', time: '9:42 AM', unread: false },
  { from: 'You', subject: 'RE: Q4 Results', body: 'On my way to a meeting', time: '9:55 AM', unread: false },
  { from: 'Boss', subject: 'RE: Q4 Results', body: 'Please reply ASAP!', time: '10:01 AM', unread: true },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* iOS Mail header */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'clamp(28px, 5.5vw, 44px)',
            background: 'rgba(248,248,248,0.95)',
            borderBottom: '1px solid rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'clamp(8px, 2vw, 16px)',
            paddingRight: 'clamp(8px, 2vw, 16px)',
            gap: 'clamp(6px, 1.5vw, 12px)',
          }}
        >
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(8px, 1.5vw, 12px)', color: '#007AFF', fontWeight: 400 }}>
            ◀ Inbox
          </span>
          <span style={{ flex: 1, textAlign: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(7px, 1.2vw, 10px)', fontWeight: 600, color: '#000' }}>
            RE: Q4 Results
          </span>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(8px, 1.5vw, 12px)', color: '#007AFF' }}>↩</span>
        </div>

        {/* Email thread */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(28px, 5.5vw, 44px)',
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'hidden',
          }}
        >
          {EMAIL_THREAD.map((email, i) => (
            <div
              key={i}
              style={{
                padding: 'clamp(6px, 1.3vw, 10px) clamp(10px, 2.5vw, 20px)',
                borderBottom: '1px solid rgba(0,0,0,0.07)',
                display: 'flex',
                gap: 'clamp(6px, 1.5vw, 12px)',
                alignItems: 'flex-start',
                background: email.unread ? 'rgba(0,122,255,0.04)' : 'transparent',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 'clamp(16px, 3vw, 24px)',
                  height: 'clamp(16px, 3vw, 24px)',
                  borderRadius: '50%',
                  background: i === 1 ? '#007AFF' : '#FF3B30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 'clamp(6px, 1vw, 8px)',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {email.from[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 'clamp(7px, 1.2vw, 10px)',
                      fontWeight: email.unread ? 700 : 500,
                      color: '#000',
                    }}
                  >
                    {email.from}
                  </span>
                  <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(5px, 0.9vw, 7px)', color: 'rgba(0,0,0,0.4)' }}>
                    {email.time}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 'clamp(6px, 1.1vw, 9px)',
                    color: 'rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {email.body}
                </div>
              </div>
              {email.unread && (
                <div
                  style={{
                    width: 'clamp(6px, 1.2vw, 9px)',
                    height: 'clamp(6px, 1.2vw, 9px)',
                    borderRadius: '50%',
                    background: '#007AFF',
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Word slides up like a quick email reply
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.35) / 0.65)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.3) * 4))
    const wordY = (1 - easeOutExpo(Math.min(1, Math.max(0, (enterProgress - 0.3) / 0.7)))) * 30
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.08) * 0.01 : 1

    // "Sent from my iPhone" signature slides in
    const sigP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - 0.55) / 0.35)))
    const sigOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 3) : Math.min(1, Math.max(0, (enterProgress - 0.5) * 5))

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Main word — the email reply */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${wordY}px) scale(${wordP * pulse})`,
            opacity: wordOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(34px, 8.5vw, 118px)',
              fontWeight: 800,
              color,
              textShadow: `0 2px 20px ${color}33`,
              letterSpacing: -2,
            }}
          >
            {word}
          </div>
        </div>

        {/* "Sent from my iPhone" signature */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: `translateX(-50%) scale(${sigP})`,
            opacity: sigOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(9px, 1.7vw, 13px)',
              color: 'rgba(0,0,0,0.35)',
              fontStyle: 'italic',
            }}
          >
            Sent from my iPhone
          </div>
        </div>
      </div>
    )
  },
}

function SentFromiPhoneComponent(props: MotionGraphicProps<SentFromiPhoneConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sent-from-iphone',
  title: 'Kinetic Sent from my iPhone',
  description:
    'iOS Mail email thread UI — unread dot, back/reply controls, thread rows, then the word appears as a crisp email reply body followed by the iconic "Sent from my iPhone" signature',
  tags: ['kinetic', 'typography', 'email', 'iphone', 'ios', 'signature', 'internet-moment', 'digital-native', 'meme'],
  category: 'captions',
  component: SentFromiPhoneComponent as any,
  defaultConfig: {
    words: ['YES', 'NOTED', 'ON IT', 'LATER'],
    colors: ['#007AFF', '#FF3B30', '#34C759', '#FF9500'],
    bgColor: '#FFFFFF',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['YES', 'NOTED', 'ON IT', 'LATER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#007AFF', '#FF3B30', '#34C759', '#FF9500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
