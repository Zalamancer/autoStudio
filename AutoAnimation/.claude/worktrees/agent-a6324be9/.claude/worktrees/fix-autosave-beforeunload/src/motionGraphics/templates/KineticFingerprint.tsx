import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FingerprintConfig extends KineticBaseConfig {}

function seededRand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Generate concentric whorl-like ellipses for fingerprint texture */
function WhorlLines({ cx, cy, rings, color, opacity, seed }: {
  cx: number; cy: number; rings: number; color: string; opacity: number; seed: number
}) {
  const lines = []
  for (let r = 0; r < rings; r++) {
    const rx = 12 + r * 14 + seededRand(seed + r * 7) * 6
    const ry = 8 + r * 9 + seededRand(seed + r * 11) * 4
    const rot = seededRand(seed + r * 13) * 30 - 15
    const dash = r % 3 === 0 ? '4 3' : r % 3 === 1 ? '6 2' : '3 4'
    lines.push(
      <ellipse
        key={r}
        cx={cx} cy={cy}
        rx={rx} ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={0.8 + seededRand(seed + r) * 0.6}
        strokeDasharray={dash}
        opacity={opacity * (0.5 + seededRand(seed + r * 17) * 0.5)}
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    )
  }
  return <>{lines}</>
}

const SVG_W = 340
const SVG_H = 200

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Scanner pulse: glow sweeps top to bottom
    const pulseY = ((time * 0.8) % 1.4 - 0.2) * 100

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fingerprint scanner green tint */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,200,80,0.04) 0%, transparent 100%)',
        }} />
        {/* Sensor grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,200,80,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,80,0.02) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }} />
        {/* Scan pulse line */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: `${pulseY}%`, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(0,255,80,0.4), rgba(0,255,120,0.7), rgba(0,255,80,0.4), transparent)',
          boxShadow: '0 0 10px rgba(0,255,80,0.3)',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 191 + 83
    const chars = word.split('')

    // Each character's position as fraction of total
    // Fingerprint whorls are present; they "resolve" into the letter as scan sweeps down

    if (phase === 'enter') {
      const scanY = enterProgress // 0=top, 1=bottom of text area

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          {/* SVG fingerprint whorls underneath */}
          <svg
            width={SVG_W} height={SVG_H}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: Math.max(0, 1 - enterProgress * 1.6) }}
          >
            {chars.map((_, ci) => {
              const cx = (SVG_W / chars.length) * (ci + 0.5)
              const cy = SVG_H / 2
              return (
                <WhorlLines
                  key={ci}
                  cx={cx} cy={cy}
                  rings={6 + ci % 3}
                  color={color}
                  opacity={0.5}
                  seed={seed + ci * 29}
                />
              )
            })}
          </svg>
          {/* Text revealed by scan clipPath */}
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 10vw, 145px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            clipPath: `inset(0 0 ${100 - scanY * 100}% 0)`,
            textShadow: `0 0 14px ${color}70`,
          }}>
            {word}
          </div>
          {/* Scan line at reveal edge */}
          <div style={{
            position: 'absolute', left: -20, right: -20,
            top: `${scanY * 100}%`, height: 2,
            background: `linear-gradient(90deg, transparent, ${color}CC, transparent)`,
            boxShadow: `0 0 8px ${color}80`,
          }} />
        </div>
      )
    } else if (phase === 'hold') {
      // Show text with faint whorl watermark
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <svg
            width={SVG_W} height={SVG_H}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.06 + Math.sin(holdProgress * Math.PI * 4) * 0.02 }}
          >
            {chars.map((_, ci) => (
              <WhorlLines key={ci} cx={(SVG_W / chars.length) * (ci + 0.5)} cy={SVG_H / 2} rings={5} color={color} opacity={0.7} seed={seed + ci * 29} />
            ))}
          </svg>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 10vw, 145px)',
            fontWeight: 700, color, whiteSpace: 'nowrap', letterSpacing: 8,
            textShadow: `0 0 12px ${color}50`,
          }}>
            {word}
          </div>
          {/* VERIFIED badge */}
          <div style={{
            position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'monospace', fontSize: 10, color: `${color}70`, letterSpacing: 4, whiteSpace: 'nowrap',
            opacity: holdProgress,
          }}>
            IDENTITY VERIFIED
          </div>
        </div>
      )
    } else {
      // Re-dissolve into whorls
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', opacity: 1 - exitProgress }}>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 10vw, 145px)',
            fontWeight: 700, color, whiteSpace: 'nowrap', letterSpacing: 8,
            filter: `blur(${exitProgress * 3}px)`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function FingerprintComponent(props: MotionGraphicProps<FingerprintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fingerprint',
  title: 'Kinetic Fingerprint',
  description: 'Fingerprint scanner whorls and ridges resolve into text characters as a scan pulse sweeps top-to-bottom, identity verified',
  tags: ['kinetic', 'typography', 'fingerprint', 'biometric', 'scan', 'security', 'identity', 'reveal'],
  category: 'captions',
  component: FingerprintComponent as any,
  defaultConfig: {
    words: ['MATCH', 'SCAN', 'VERIFY', 'ACCESS'],
    colors: ['#00FF66', '#00DDAA', '#00FF66', '#00BBFF'],
    bgColor: '#020d06',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MATCH', 'SCAN', 'VERIFY', 'ACCESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF66', '#00DDAA', '#00FF66', '#00BBFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020d06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
