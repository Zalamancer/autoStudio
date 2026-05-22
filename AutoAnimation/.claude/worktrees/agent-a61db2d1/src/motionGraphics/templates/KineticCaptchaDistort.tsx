import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CaptchaDistortConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Generate noise lines like CAPTCHA images
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = []
    for (let i = 0; i < 12; i++) {
      const seed = i * 73 + 19
      lines.push({
        x1: pseudoRandom(seed) * width,
        y1: pseudoRandom(seed + 1) * height,
        x2: pseudoRandom(seed + 2) * width,
        y2: pseudoRandom(seed + 3) * height,
        color: `rgba(${80 + Math.floor(pseudoRandom(seed + 4) * 100)}, ${80 + Math.floor(pseudoRandom(seed + 5) * 100)}, ${80 + Math.floor(pseudoRandom(seed + 6) * 100)}, 0.25)`,
      })
    }

    // Scatter dots like CAPTCHA noise
    const dots: { x: number; y: number; r: number }[] = []
    for (let i = 0; i < 40; i++) {
      const seed = i * 37 + frame * 0.02
      dots.push({
        x: pseudoRandom(seed) * width,
        y: pseudoRandom(seed + 1) * height,
        r: 1 + pseudoRandom(seed + 2) * 2,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CAPTCHA box frame */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            right: '10%',
            bottom: '15%',
            border: '2px solid rgba(180,180,180,0.3)',
            borderRadius: 4,
            background: 'rgba(255,255,255,0.03)',
          }}
        />
        {/* Noise lines */}
        <svg style={{ position: 'absolute', inset: 0 }} viewBox={`0 0 ${width} ${height}`}>
          {lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth={1} />
          ))}
          {dots.map((d, i) => (
            <circle key={`d${i}`} cx={d.x} cy={d.y} r={d.r} fill="rgba(120,120,120,0.2)" />
          ))}
        </svg>
        {/* "I'm not a robot" checkbox area */}
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: 0.25,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              border: '1.5px solid rgba(180,180,180,0.6)',
              borderRadius: 2,
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          <div
            style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: 10,
              color: 'rgba(180,180,180,0.5)',
            }}
          >
            I'm not a robot
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 137 + 41

    // Each character gets individual distortion that straightens over time
    const chars = word.split('').map((ch, ci) => {
      const charSeed = seed + ci * 97
      // Base distortion values
      const baseRotation = (pseudoRandom(charSeed) - 0.5) * 50
      const baseSkewX = (pseudoRandom(charSeed + 1) - 0.5) * 30
      const baseOffsetY = (pseudoRandom(charSeed + 2) - 0.5) * 20
      const baseScaleX = 0.7 + pseudoRandom(charSeed + 3) * 0.6

      let distortAmount: number
      let opacity: number

      if (phase === 'enter') {
        // Heavily warped, gradually straightening
        distortAmount = 1 - enterProgress * 0.7
        opacity = 0.3 + enterProgress * 0.7
      } else if (phase === 'hold') {
        // Mostly straight with slight residual warp, occasional re-distortion
        const burst = Math.sin(holdProgress * Math.PI * 4 + ci) > 0.8
        distortAmount = burst ? 0.4 : 0.1 + Math.sin(f * 0.05 + ci) * 0.05
        opacity = 1
      } else {
        // Re-distort on exit
        distortAmount = 0.1 + exitProgress * 0.9
        opacity = 1 - exitProgress
      }

      const rotation = baseRotation * distortAmount
      const skewX = baseSkewX * distortAmount
      const offsetY = baseOffsetY * distortAmount
      const scaleX = 1 + (baseScaleX - 1) * distortAmount

      // Color cycling during heavy distortion
      const hueShift = distortAmount > 0.5 ? (pseudoRandom(charSeed + f * 0.3) - 0.5) * 40 : 0
      const charColor = distortAmount > 0.5
        ? `hsl(${210 + hueShift}, 40%, ${50 + pseudoRandom(charSeed + 4) * 20}%)`
        : color

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${offsetY}px) rotate(${rotation}deg) skewX(${skewX}deg) scaleX(${scaleX})`,
            color: charColor,
            opacity,
            textShadow: distortAmount > 0.3 ? `0 0 ${distortAmount * 6}px rgba(100,100,100,0.3)` : 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    // Strikethrough noise line across the word
    const lineY = 45 + Math.sin(f * 0.1 + seed) * 10
    const showLine = phase === 'enter' && enterProgress < 0.8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(44px, 12vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 'clamp(4px, 1.5vw, 12px)',
        }}
      >
        {chars}
        {showLine && (
          <div
            style={{
              position: 'absolute',
              left: '-5%',
              right: '-5%',
              top: `${lineY}%`,
              height: 2,
              background: `rgba(120,120,120,${0.3 * (1 - enterProgress)})`,
              transform: `rotate(${(pseudoRandom(seed + 99) - 0.5) * 8}deg)`,
            }}
          />
        )}
      </div>
    )
  },
}

function CaptchaDistortComponent(props: MotionGraphicProps<CaptchaDistortConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-captcha-distort',
  title: 'Kinetic CAPTCHA Distort',
  description: 'Warped CAPTCHA text with noise lines and scattered dots, characters individually distorted that gradually straighten to readable text',
  tags: ['kinetic', 'typography', 'captcha', 'distort', 'internet', 'security', 'digital'],
  category: 'captions',
  component: CaptchaDistortComponent as any,
  defaultConfig: {
    words: ['VERIFY', 'HUMAN', 'ACCESS', 'GRANT'],
    colors: ['#4A5568', '#2D3748', '#4A5568', '#38A169'],
    bgColor: '#F7F7F7',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VERIFY', 'HUMAN', 'ACCESS', 'GRANT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4A5568', '#2D3748', '#38A169'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F7F7F7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
