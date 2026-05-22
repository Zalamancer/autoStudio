import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlackHuddleConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const HUDDLE_AVATARS = [
  { initials: 'JD', bg: '#4A154B', speaking: true },
  { initials: 'SM', bg: '#007a5a', speaking: false },
  { initials: 'AK', bg: '#1264a3', speaking: false },
  { initials: 'TR', bg: '#e8912d', speaking: false },
]

const CHANNEL_LIST = ['#general', '#design', '#dev', '#random', '#announcements']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Speaking avatar pulses
    const speakPulse = 0.8 + Math.sin(time * 8) * 0.2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Slack sidebar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 'clamp(60px, 13vw, 100px)',
            background: '#3F0E40',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'clamp(8px, 2vw, 16px)',
            gap: 2,
          }}
        >
          {/* Workspace name */}
          <div
            style={{
              padding: 'clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px)',
              fontFamily: '"Lato", system-ui, sans-serif',
              fontSize: 'clamp(7px, 1.2vw, 10px)',
              fontWeight: 800,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            ProAnimate
          </div>
          {CHANNEL_LIST.map((ch, i) => (
            <div
              key={i}
              style={{
                padding: 'clamp(2px, 0.5vw, 4px) clamp(8px, 1.5vw, 12px)',
                fontFamily: '"Lato", system-ui, sans-serif',
                fontSize: 'clamp(6px, 1vw, 8px)',
                color: i === 1 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                fontWeight: i === 1 ? 700 : 400,
                background: i === 1 ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {ch}
            </div>
          ))}
        </div>

        {/* Huddle bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 'clamp(60px, 13vw, 100px)',
            right: 0,
            height: 'clamp(36px, 7vw, 56px)',
            background: '#1D1D1D',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'clamp(8px, 2vw, 16px)',
            gap: 'clamp(6px, 1.2vw, 10px)',
          }}
        >
          {/* Green huddle indicator */}
          <div
            style={{
              width: 'clamp(7px, 1.3vw, 10px)',
              height: 'clamp(7px, 1.3vw, 10px)',
              borderRadius: '50%',
              background: '#2bac76',
              boxShadow: `0 0 ${speakPulse * 8}px #2bac76`,
            }}
          />
          <span
            style={{
              fontFamily: '"Lato", system-ui, sans-serif',
              fontSize: 'clamp(6px, 1vw, 8px)',
              color: '#2bac76',
              fontWeight: 700,
            }}
          >
            Huddle · 4 participants
          </span>
          <div style={{ flex: 1 }} />
          {/* Avatar row */}
          <div style={{ display: 'flex', gap: -4, marginRight: 'clamp(6px, 1.5vw, 12px)' }}>
            {HUDDLE_AVATARS.map((av, i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(14px, 2.5vw, 20px)',
                  height: 'clamp(14px, 2.5vw, 20px)',
                  borderRadius: '50%',
                  background: av.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 'clamp(5px, 0.8vw, 6px)',
                  fontWeight: 700,
                  color: '#fff',
                  border: av.speaking ? `2px solid #2bac76` : '2px solid #1D1D1D',
                  marginLeft: i > 0 ? -4 : 0,
                  boxShadow: av.speaking ? `0 0 ${speakPulse * 6}px #2bac76` : 'none',
                  zIndex: av.speaking ? 2 : 1,
                }}
              >
                {av.initials}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Incoming huddle invite notification
    const notifP = easeOutBack(Math.min(1, Math.max(0, enterProgress / 0.45)))
    const notifOpacity = phase === 'enter'
      ? Math.min(1, enterProgress * 5)
      : phase === 'hold'
      ? Math.max(0, 1 - Math.max(0, (0 - 0) * 2))  // always 1
      : Math.max(0, 1 - exitProgress * 4)

    // Word scale in from notification ring
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.45) / 0.55)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.4) * 4))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.09) * 0.012 : 1

    // Sound wave rings around the speaking avatar
    const ringScale = 1 + ((f * 0.04) % 1) * 0.8
    const ringOpacity = 1 - ((f * 0.04) % 1)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Huddle join notification */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: `translateX(-50%) scale(${notifP})`,
            opacity: notifOpacity * (phase === 'enter' && enterProgress > 0.4 ? Math.max(0, 1 - (enterProgress - 0.4) * 6) : 1),
            width: 'clamp(140px, 42vw, 280px)',
          }}
        >
          <div
            style={{
              background: '#1D1D1D',
              borderRadius: 12,
              padding: 'clamp(8px, 1.8vw, 14px) clamp(10px, 2.5vw, 20px)',
              border: '1px solid rgba(43,172,118,0.4)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.5vw, 12px)',
            }}
          >
            {/* Pulsing avatar with sound rings */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: '2px solid #2bac76',
                  transform: `scale(${ringScale})`,
                  opacity: ringOpacity * 0.5,
                }}
              />
              <div
                style={{
                  width: 'clamp(22px, 4.5vw, 36px)',
                  height: 'clamp(22px, 4.5vw, 36px)',
                  borderRadius: '50%',
                  background: '#4A154B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 'clamp(8px, 1.5vw, 12px)',
                  fontWeight: 700,
                  color: '#fff',
                  border: '2px solid #2bac76',
                }}
              >
                JD
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: '"Lato", system-ui, sans-serif',
                  fontSize: 'clamp(7px, 1.3vw, 10px)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                Jake joined the huddle
              </div>
              <div
                style={{
                  fontFamily: '"Lato", system-ui, sans-serif',
                  fontSize: 'clamp(6px, 1vw, 8px)',
                  color: '#2bac76',
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                Join ·  Snooze
              </div>
            </div>
          </div>
        </div>

        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${wordP * pulse})`,
            opacity: wordOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: '"Lato", system-ui, sans-serif',
              fontSize: 'clamp(34px, 8.5vw, 118px)',
              fontWeight: 900,
              color,
              textShadow: `0 0 20px ${color}55, 0 4px 30px rgba(0,0,0,0.4)`,
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

function SlackHuddleComponent(props: MotionGraphicProps<SlackHuddleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slack-huddle',
  title: 'Kinetic Slack Huddle',
  description:
    'Slack workspace sidebar with a live huddle notification — avatar rings pulse with speaking animation, a join banner slides in, then the word bursts out bold',
  tags: ['kinetic', 'typography', 'slack', 'huddle', 'collaboration', 'creator', 'tool', 'digital-native', 'workplace'],
  category: 'captions',
  component: SlackHuddleComponent as any,
  defaultConfig: {
    words: ['SYNC', 'COLLAB', 'SHIP', 'BUILD'],
    colors: ['#2bac76', '#4A154B', '#1264a3', '#e8912d'],
    bgColor: '#222529',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SYNC', 'COLLAB', 'SHIP', 'BUILD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2bac76', '#4A154B', '#1264a3', '#e8912d'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#222529', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
