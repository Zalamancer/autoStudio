import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DialUpConnectConfig extends KineticBaseConfig {}

// Dial-up modem connection stages
const CONNECT_STAGES = [
  { label: 'Dialing...', progress: 0.0 },
  { label: 'Negotiating...', progress: 0.2 },
  { label: 'Authenticating...', progress: 0.45 },
  { label: 'Connected!', progress: 0.7 },
  { label: '56k baud', progress: 0.85 },
]

// Static noise bars at deterministic Y positions
const NOISE_BARS = Array.from({ length: 6 }, (_, i) => ({
  y: (i * 16.3 + 5) % 90,
  w: 30 + (i * 23 + 11) % 50,
  x: (i * 37 + 7) % 60,
  speed: 0.5 + (i * 13 + 3) % 10 * 0.15,
}))

// Scrambled modem character set
const MODEM_CHARS = 'ATDPLxzXZ01!@#$%&*()_+=-[]{}|;:,./<>?`~'
function modemChar(seed: number): string {
  const idx = Math.abs(Math.floor(Math.sin(seed * 89.1 + 44.3) * 99283.7)) % MODEM_CHARS.length
  return MODEM_CHARS[idx]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Connection status — cycles through stages based on time
    const stageIndex = Math.floor(time * 1.2) % CONNECT_STAGES.length
    const stage = CONNECT_STAGES[stageIndex]

    // Noise intensity — high at start, settles
    const noiseIntensity = Math.max(0, 1 - (stageIndex / CONNECT_STAGES.length))

    // Progress bar fill
    const barWidth = stage.progress * 100

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          overflow: 'hidden',
        }}
      >
        {/* CRT-style scanlines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Horizontal noise bars — static interference */}
        {NOISE_BARS.map((bar, i) => {
          const active = noiseIntensity > 0.3 && ((i + Math.floor(time * 8)) % 3 !== 0)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${bar.x}%`,
                top: `${(bar.y + time * bar.speed * 5) % 100}%`,
                width: `${bar.w * noiseIntensity}%`,
                height: 2,
                background: `rgba(200,200,200,${active ? noiseIntensity * 0.3 : 0})`,
                filter: 'blur(0.5px)',
              }}
            />
          )
        })}

        {/* Connection dialog box — Windows 98 style */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(180px, 55vw, 400px)',
            background: '#C0C0C0',
            border: '2px solid',
            borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            fontFamily: "'Arial', sans-serif",
          }}
        >
          {/* Title bar */}
          <div
            style={{
              background: 'linear-gradient(90deg, #000080 0%, #1084D0 100%)',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#fff', fontSize: 'clamp(8px, 1.8vw, 12px)', fontWeight: 700 }}>
              Connecting to Internet...
            </span>
            <div
              style={{
                width: 'clamp(12px, 3vw, 18px)',
                height: 'clamp(12px, 3vw, 18px)',
                background: '#C0C0C0',
                border: '1px solid',
                borderColor: '#FFF #808080 #808080 #FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(8px, 1.5vw, 10px)',
                color: '#000',
                fontWeight: 700,
              }}
            >
              ×
            </div>
          </div>
          {/* Content */}
          <div style={{ padding: 'clamp(4px, 1.5vw, 10px)' }}>
            {/* Phone icon area */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 'clamp(14px, 4vw, 28px)' }}>📞</span>
              <div>
                <div
                  style={{
                    fontFamily: "'Arial', sans-serif",
                    fontSize: 'clamp(8px, 1.8vw, 12px)',
                    color: '#000',
                    fontWeight: 700,
                  }}
                >
                  {stage.label}
                </div>
                {/* Modem AT command noise */}
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(6px, 1.3vw, 9px)',
                    color: '#404040',
                    letterSpacing: 1,
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => modemChar(i * 17 + Math.floor(time * 10))).join('')}
                </div>
              </div>
            </div>
            {/* Progress bar — Win 98 style */}
            <div
              style={{
                height: 'clamp(8px, 2vw, 14px)',
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: '#808080 #FFF #FFF #808080',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${barWidth}%`,
                  background: '#000080',
                  transition: 'width 0.1s',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    // The word "loads" character by character — like slow dial-up rendering a webpage
    const seed = index * 67 + 23
    const totalChars = word.length

    let visibleChars = totalChars
    let opacity = 1
    let scrambleChars: string[] = []

    if (phase === 'enter') {
      // Characters appear one by one, slowly — dial-up loading
      visibleChars = Math.floor(enterProgress * totalChars)
      opacity = 0.4 + enterProgress * 0.6
      // Remaining chars are scrambled noise
      scrambleChars = word.split('').map((ch, ci) => {
        if (ci < visibleChars) return ch
        // Cycling through modem garbage chars
        return modemChar(ci * 37 + seed + Math.floor(enterProgress * 20))
      })
    } else if (phase === 'hold') {
      scrambleChars = word.split('')
      // Occasional single-char corruption — data integrity issues
      const corruptIdx = Math.floor(holdProgress * 12) % totalChars
      if (holdProgress > 0.3 && holdProgress < 0.35) {
        scrambleChars[corruptIdx] = modemChar(corruptIdx * 53 + seed)
      }
    } else {
      scrambleChars = word.split('')
      opacity = 1 - exitProgress
      // Connection drops — chars start dropping off
      const dropCount = Math.floor(exitProgress * totalChars)
      for (let i = totalChars - 1; i >= totalChars - dropCount; i--) {
        if (scrambleChars[i]) scrambleChars[i] = modemChar(i * 71 + seed + Math.floor(exitProgress * 15))
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Main loaded text */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textShadow: `1px 1px 0px rgba(0,0,0,0.3)`,
          }}
        >
          {scrambleChars.map((ch, ci) => (
            <span
              key={ci}
              style={{
                color: ci < visibleChars || phase !== 'enter'
                  ? color
                  : `rgba(${parseInt(color.slice(1, 3), 16)},${parseInt(color.slice(3, 5), 16)},${parseInt(color.slice(5, 7), 16)},0.3)`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
        {/* Transfer rate readout below */}
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(9px, 2vw, 14px)',
            color: phase === 'hold' ? '#888888' : 'transparent',
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          {`${Math.floor(28 + holdProgress * 28)}kbps`}
        </div>
      </div>
    )
  },
}

function DialUpConnectComponent(props: MotionGraphicProps<DialUpConnectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dial-up-connect',
  title: 'Kinetic Dial-Up Connect',
  description: 'Dial-up modem nostalgia: text loads character-by-character with modem noise, Win 98 connection dialog, progress bar, and corruption artifacts',
  tags: ['kinetic', 'typography', 'dialup', 'modem', 'loading', 'nostalgia', '90s', 'internet', 'windows98'],
  category: 'captions',
  component: DialUpConnectComponent as any,
  defaultConfig: {
    words: ['LOADING', 'PLEASE', 'WAIT', 'CONNECTED'],
    colors: ['#000080', '#000080', '#000080', '#006000'],
    bgColor: '#C0C0C0',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOADING', 'PLEASE', 'WAIT', 'CONNECTED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#000080', '#000080', '#000080', '#006000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C0C0C0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
  ],
})
