import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AOLInstantConfig extends KineticBaseConfig {}

// AIM buddy list — fixed names
const BUDDIES = [
  { name: 'xXxSkater4LifexXx', status: 'online', icon: '🤘' },
  { name: 'PurpleButterfly95', status: 'away', icon: '🦋' },
  { name: 'CoolKid2001', status: 'online', icon: '😎' },
  { name: 'GuitarHero_Ryan', status: 'idle', icon: '🎸' },
  { name: 'lol2themax', status: 'online', icon: '😂' },
]

// AIM status colors
const STATUS_COLORS: Record<string, string> = {
  online: '#00AA00',
  away: '#FF8800',
  idle: '#888888',
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Blinking online indicator for first buddy
    const blink = Math.floor(time * 2) % 2 === 0

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          overflow: 'hidden',
          fontFamily: "'Arial', 'Helvetica', sans-serif",
        }}
      >
        {/* AIM buddy list panel — left side */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 'clamp(100px, 28vw, 200px)',
            background: '#D4D0C8',
            border: '1px solid #808080',
            borderLeft: 'none',
            overflow: 'hidden',
          }}
        >
          {/* AIM title bar */}
          <div
            style={{
              background: 'linear-gradient(180deg, #1C6BD4 0%, #0850C0 100%)',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#fff', fontSize: 'clamp(7px, 1.6vw, 11px)', fontWeight: 700 }}>AIM</span>
            <span style={{ color: '#fff', fontSize: 'clamp(7px, 1.5vw, 10px)' }}>×</span>
          </div>
          {/* My screen name */}
          <div
            style={{
              padding: '3px 4px',
              background: '#FFFFC0',
              borderBottom: '1px solid #A0A090',
              fontSize: 'clamp(7px, 1.5vw, 10px)',
              color: '#000080',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span style={{ color: blink ? '#00AA00' : '#AAAAAA' }}>●</span>
            <span>TotallyMe2001</span>
          </div>
          {/* Buddy group */}
          <div
            style={{
              padding: '2px 4px',
              background: '#B0C8E8',
              fontSize: 'clamp(7px, 1.4vw, 10px)',
              color: '#000050',
              fontWeight: 700,
              borderBottom: '1px solid #9090A0',
            }}
          >
            Buddies ({BUDDIES.filter((b) => b.status !== 'idle').length}/{BUDDIES.length})
          </div>
          {/* Buddy list */}
          {BUDDIES.map((buddy, i) => (
            <div
              key={i}
              style={{
                padding: '1px 4px 1px 8px',
                fontSize: 'clamp(6px, 1.3vw, 9px)',
                color: buddy.status === 'idle' ? '#888888' : '#000000',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                background: i === 0 ? '#C8DCFF' : 'transparent',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ color: STATUS_COLORS[buddy.status], fontSize: 'clamp(6px, 1.2vw, 8px)' }}>●</span>
              <span>{buddy.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buddy.name}</span>
            </div>
          ))}
          {/* Away message ticker */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '2px 4px',
              background: '#FFFFF0',
              borderTop: '1px solid #A0A090',
              fontSize: 'clamp(6px, 1.2vw, 8px)',
              color: '#808000',
              fontStyle: 'italic',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            brb... gtg 2 practice 🎸
          </div>
        </div>

        {/* Chat window background — right side */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(100px, 28vw, 200px)',
            top: 0,
            right: 0,
            bottom: 0,
            background: '#FFFFFF',
          }}
        />

        {/* Door sound visual indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(8px, 2vw, 16px)',
            right: 'clamp(8px, 2vw, 16px)',
            width: 'clamp(24px, 6vw, 44px)',
            height: 'clamp(24px, 6vw, 44px)',
            background: '#FFDD44',
            border: '2px solid #AA8800',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(12px, 3vw, 22px)',
            opacity: Math.sin(time * 0.8) > 0.9 ? 1 : 0.3,
          }}
        >
          🚪
        </div>
      </div>
    )
  },

  renderWord: ({ word, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0

    // Enter: message slides in from right like incoming IM
    if (phase === 'enter') {
      translateX = (1 - enterProgress) * 80
      opacity = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      opacity = 1 - exitProgress
      translateX = exitProgress * -20
    }

    // AIM screen name for this message
    const senderNames = ['xXxSkater4LifexXx', 'PurpleButterfly95', 'CoolKid2001', 'GuitarHero_Ryan']
    const sender = senderNames[index % senderNames.length]
    const senderColors = ['#8B0000', '#800080', '#006400', '#00008B']
    const senderColor = senderColors[index % senderColors.length]

    // Timestamp
    const hour = 4 + index
    const timeStr = `${hour > 12 ? hour - 12 : hour}:${String((index * 7) % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%)`,
          opacity,
          width: 'clamp(160px, 50vw, 420px)',
        }}
      >
        {/* AIM chat bubble */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #C0C0C0',
            borderRadius: 2,
            boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Chat window title */}
          <div
            style={{
              background: 'linear-gradient(180deg, #4080E0 0%, #1050C0 100%)',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#fff', fontSize: 'clamp(8px, 1.8vw, 11px)', fontWeight: 700 }}>
              IM with {sender}
            </span>
            <span style={{ color: '#fff', fontSize: 'clamp(8px, 1.6vw, 10px)' }}>× □ −</span>
          </div>
          {/* Message area */}
          <div
            style={{
              padding: 'clamp(6px, 2vw, 14px)',
              minHeight: 'clamp(40px, 12vw, 90px)',
              background: '#FFFFF8',
              borderBottom: '1px solid #E0E0D8',
            }}
          >
            {/* Sender name with color */}
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: 'clamp(10px, 2.5vw, 16px)',
                fontWeight: 700,
                color: senderColor,
              }}
            >
              {sender}:
            </span>{' '}
            {/* The word as the message */}
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: 'clamp(10px, 2.5vw, 16px)',
                color: '#000000',
              }}
            >
              {word.toLowerCase()} lol
            </span>
            {/* Timestamp */}
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: 'clamp(7px, 1.5vw, 10px)',
                color: '#888888',
                marginLeft: 8,
              }}
            >
              ({timeStr})
            </span>
          </div>
          {/* Input box */}
          <div
            style={{
              padding: '3px 4px',
              background: '#E8E8E0',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 'clamp(14px, 3.5vw, 22px)',
                background: '#FFFFFF',
                border: '1px solid #808080',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px',
                fontFamily: "'Arial', sans-serif",
                fontSize: 'clamp(8px, 1.8vw, 11px)',
                color: '#666',
              }}
            >
              {phase === 'hold' ? 'type a message...' : ''}
            </div>
            <div
              style={{
                padding: '2px 6px',
                background: '#D4D0C8',
                border: '1px solid',
                borderColor: '#FFF #808080 #808080 #FFF',
                fontFamily: "'Arial', sans-serif",
                fontSize: 'clamp(7px, 1.5vw, 10px)',
                color: '#000',
                cursor: 'pointer',
              }}
            >
              Send
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function AOLInstantComponent(props: MotionGraphicProps<AOLInstantConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-aol-instant',
  title: 'Kinetic AOL Instant',
  description:
    'AIM/AOL Instant Messenger aesthetic: buddy list, chat window, colored screen names, away messages, and door sound indicator',
  tags: ['kinetic', 'typography', 'aim', 'aol', 'instant-messenger', 'nostalgia', '2000s', 'chat', 'buddy-list'],
  category: 'captions',
  component: AOLInstantComponent as any,
  defaultConfig: {
    words: ['hey', 'whats up', 'lol', 'brb'],
    colors: ['#8B0000', '#800080', '#006400', '#00008B'],
    bgColor: '#F0F0F0',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['hey', 'whats up', 'lol', 'brb'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#8B0000', '#800080', '#006400', '#00008B'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F0F0', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 6,
      group: 'Timing',
    },
  ],
})
