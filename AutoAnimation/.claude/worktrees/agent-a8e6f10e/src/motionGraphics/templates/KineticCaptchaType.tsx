import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CaptchaTypeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Distortion lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const x1 = rand(i * 31) * width; const y1 = rand(i * 47 + 1) * height
          const x2 = rand(i * 31 + 2) * width; const y2 = rand(i * 47 + 3) * height
          const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
          return (
            <div key={i} style={{
              position: 'absolute', left: x1, top: y1, width: len, height: 1,
              background: `rgba(255,255,255,${0.03 + rand(i * 13) * 0.04})`,
              transform: `rotate(${angle}deg)`, transformOrigin: '0 0',
            }} />
          )
        })}
        {/* Noise dots */}
        {Array.from({ length: 15 }, (_, i) => (
          <div key={`d-${i}`} style={{
            position: 'absolute',
            left: rand(i * 67 + Math.floor(time * 0.5)) * width,
            top: rand(i * 89 + Math.floor(time * 0.5)) * height,
            width: 2 + rand(i * 23) * 3, height: 2 + rand(i * 23) * 3, borderRadius: '50%',
            background: `rgba(255,255,255,${0.03 + rand(i * 41) * 0.04})`,
          }} />
        ))}
        <div style={{ position: 'absolute', top: 8, left: 10, fontFamily: "'Courier New', monospace", fontSize: 9, color: 'rgba(255,255,255,0.08)' }}>
          VERIFY YOU ARE HUMAN
        </div>
        <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: "'Courier New', monospace", fontSize: 9, color: 'rgba(255,255,255,0.06)' }}>
          &#x21BB;
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const seed = index * 181 + 73
    const chars = word.split('')

    /** Build a distorted character with CAPTCHA warping */
    const distortedChar = (ch: string, ci: number, amount: number, opacity: number) => {
      const rot = (rand(seed + ci * 37) - 0.5) * 40 * amount
      const sx = 0.6 + rand(seed + ci * 53) * 0.8 * amount + (1 - amount)
      const sy = 0.7 + rand(seed + ci * 67) * 0.6 * amount + (1 - amount)
      const skew = (rand(seed + ci * 79) - 0.5) * 25 * amount
      const yOff = (rand(seed + ci * 91) - 0.5) * 30 * amount
      const hasLine = rand(seed + ci * 103) < 0.4 && amount > 0.3

      return (
        <span key={ci} style={{
          display: 'inline-block', fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 140px)', fontWeight: 700, color, position: 'relative', margin: '0 1px',
          transform: `rotate(${rot}deg) scaleX(${sx}) scaleY(${sy}) skewX(${skew}deg) translateY(${yOff}px)`,
          opacity,
          textShadow: amount > 0.5 ? `${(rand(seed + ci) - 0.5) * 4}px ${(rand(seed + ci + 1) - 0.5) * 4}px 2px rgba(0,0,0,0.3)` : 'none',
        }}>
          {ch}
          {hasLine && (
            <div style={{
              position: 'absolute', left: -2, right: -2, top: '50%', height: 2,
              background: `rgba(255,255,255,${0.15 * amount})`,
              transform: `rotate(${(rand(seed + ci * 11) - 0.5) * 20}deg)`,
            }} />
          )}
        </span>
      )
    }

    const center: React.CSSProperties = {
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
    }

    if (phase === 'enter') {
      const distort = 1 - smoothstep(enterProgress)
      return (
        <div style={center}>
          {chars.map((ch, ci) => distortedChar(ch, ci, distort, 0.4 + smoothstep(enterProgress) * 0.6))}
        </div>
      )
    } else if (phase === 'hold') {
      const wobble = Math.sin(holdProgress * Math.PI * 6) * 0.5
      const checkOp = holdProgress > 0.15 ? Math.min(1, (holdProgress - 0.15) * 5) : 0

      return (
        <div style={center}>
          <span style={{
            fontFamily: "'Courier New', monospace", fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700, color, letterSpacing: 4, display: 'inline-block',
            transform: `rotate(${wobble}deg)`, textShadow: `0 0 8px ${color}30`,
          }}>
            {word}
          </span>
          <span style={{ display: 'inline-block', marginLeft: 12, fontSize: 'clamp(20px, 5vw, 50px)', color: '#00CC66', opacity: checkOp, transform: `scale(${0.8 + checkOp * 0.2})` }}>
            &#x2713;
          </span>
        </div>
      )
    } else {
      const distort = smoothstep(exitProgress)
      return (
        <div style={{ ...center, opacity: 1 - exitProgress * 0.5 }}>
          {chars.map((ch, ci) => distortedChar(ch, ci, distort, 1 - distort * 0.7))}
        </div>
      )
    }
  },
}

function CaptchaTypeComponent(props: MotionGraphicProps<CaptchaTypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-captcha-type',
  title: 'Kinetic CAPTCHA Type',
  description: 'CAPTCHA-distorted text that straightens into readable words — per-character rotation, skew, scale warping that smoothly resolves, with noise lines and verification check',
  tags: ['kinetic', 'typography', 'captcha', 'distorted', 'verify', 'digital', 'security', 'warp'],
  category: 'captions',
  component: CaptchaTypeComponent as any,
  defaultConfig: {
    words: ['VERIFY', 'HUMAN', 'ACCESS', 'GRANT'],
    colors: ['#DDDDDD', '#CCCCCC', '#EEEEEE', '#BBBBBB'],
    bgColor: '#0e0e14',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VERIFY', 'HUMAN', 'ACCESS', 'GRANT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DDDDDD', '#CCCCCC', '#EEEEEE', '#BBBBBB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e0e14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
