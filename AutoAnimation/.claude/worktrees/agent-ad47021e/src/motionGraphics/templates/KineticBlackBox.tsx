import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlackBoxConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Waveform audio line — simulated CVR playback
    const wavePoints: string[] = []
    const waveY = height * 0.5
    const segments = 60
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width
      const waveSeed = Math.floor(time * 10) * segments + i
      const amplitude = 8 + seededRand(waveSeed) * 25
      const y = waveY + (seededRand(waveSeed + 1) - 0.5) * amplitude * 2
      wavePoints.push(`${x},${y}`)
    }
    // Recovery beacon blink
    const beaconPhase = (time * 1.5) % 1
    const beaconOn = beaconPhase < 0.12 || (beaconPhase > 0.2 && beaconPhase < 0.28)
    // Impact damage scratches — static positions
    const scratches: { x1: number; y1: number; x2: number; y2: number }[] = [
      { x1: width * 0.12, y1: height * 0.15, x2: width * 0.22, y2: height * 0.2 },
      { x1: width * 0.75, y1: height * 0.1, x2: width * 0.82, y2: height * 0.18 },
      { x1: width * 0.6, y1: height * 0.82, x2: width * 0.7, y2: height * 0.88 },
      { x1: width * 0.08, y1: height * 0.7, x2: width * 0.15, y2: height * 0.78 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Orange box body */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '4%',
            right: '4%',
            bottom: '6%',
            background: 'linear-gradient(180deg, #E86A17 0%, #D45A0A 40%, #C04E08 100%)',
            borderRadius: 8,
          }}
        />
        {/* Impact damage scratches */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, opacity: 0.2 }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {scratches.map((s, i) => (
            <line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke="rgba(60,30,10,0.6)"
              strokeWidth={2 + seededRand(i * 5) * 2}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {/* Audio waveform line (CVR playback) */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0 }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <polyline
            points={wavePoints.join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1.5}
          />
          {/* Playhead indicator */}
          <line
            x1={((time * 30) % width)}
            y1={height * 0.35}
            x2={((time * 30) % width)}
            y2={height * 0.65}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1}
          />
        </svg>
        {/* Recovery beacon (top right) */}
        <div
          style={{
            position: 'absolute',
            top: '9%',
            right: '8%',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: beaconOn ? '#FF3300' : 'rgba(100,30,10,0.6)',
            boxShadow: beaconOn ? '0 0 12px 4px rgba(255,50,0,0.5), 0 0 30px 8px rgba(255,50,0,0.2)' : 'none',
          }}
        />
        {/* Panel label text */}
        <div
          style={{
            position: 'absolute',
            bottom: '9%',
            left: '8%',
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          CVR — FLIGHT DATA RECORDER
        </div>
        {/* Scuffed surface noise */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '4%',
            right: '4%',
            bottom: '6%',
            borderRadius: 8,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent, transparent 4px,
              rgba(0,0,0,0.02) 4px, rgba(0,0,0,0.02) 5px
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 59 + 11
    let opacity = 0
    let translateX = 0
    let blur = 0

    if (phase === 'enter') {
      // Playback start — text scrubs in like audio tape
      opacity = Math.min(1, enterProgress * 1.5)
      translateX = (1 - enterProgress) * 40
      // Audio distortion blur at start
      blur = (1 - enterProgress) * 3
    } else if (phase === 'hold') {
      opacity = 1
      // Slight tape wobble during playback
      translateX = Math.sin(f * 0.4 + seed) * 1.5
      // Occasional dropout
      const dropSeed = Math.floor(f * 0.15) + seed
      if (seededRand(dropSeed) < 0.03) {
        opacity = 0.4
      }
    } else {
      opacity = 1 - exitProgress
      translateX = -exitProgress * 30
      blur = exitProgress * 4
    }

    return (
      <>
        {/* Text shadow on orange surface */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX + 2}px), calc(-50% + 2px))`,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(0,0,0,0.35)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 4,
            opacity: opacity * 0.6,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          {word}
        </div>
        {/* Main CVR text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%)`,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 4,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: '0 0 6px rgba(255,255,255,0.15)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function BlackBoxComponent(props: MotionGraphicProps<BlackBoxConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-black-box',
  title: 'Kinetic Black Box',
  description: 'Flight recorder CVR playback with waveform audio line, orange box body, impact damage scratches, recovery beacon blink, and tape scrub text reveal',
  tags: ['kinetic', 'typography', 'black-box', 'flight', 'recorder', 'aviation', 'cvr', 'warning'],
  category: 'captions',
  component: BlackBoxComponent as any,
  defaultConfig: {
    words: ['MAYDAY', 'BRACE', 'IMPACT', 'RECOVER'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#1a1008',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MAYDAY', 'BRACE', 'IMPACT', 'RECOVER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1008', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
