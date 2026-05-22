import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZapBurstConfig extends KineticBaseConfig {}

// ZAP! style: jagged starburst explosion shape behind text
// The starburst is an SVG polygon with alternating long/short points
// Text sits on top — high-voltage comic book action word energy

function starburstPath(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const step = Math.PI / points
  let d = ''
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = i * step - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)}`
  }
  return d + 'Z'
}

const BURST_COLORS = ['#FFD700', '#FF4500', '#FF0099', '#00CCFF', '#FFEE00']
const BURST_BORDER_COLORS = ['#CC0000', '#880000', '#660066', '#006699', '#CC8800']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)',
          backgroundSize: '10px 10px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 43 + 19
    const burstColor = BURST_COLORS[index % BURST_COLORS.length]
    const borderColor = BURST_BORDER_COLORS[index % BURST_BORDER_COLORS.length]

    let scale = 1
    let opacity = 1
    let burstScale = 1
    let rotation = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 5)
      // Burst explodes from tiny to overshoot then settle
      const t = enterProgress
      if (t < 0.3) {
        burstScale = (t / 0.3) * 1.4
      } else if (t < 0.55) {
        burstScale = 1.4 - ((t - 0.3) / 0.25) * 0.5
      } else {
        burstScale = 0.9 + ((t - 0.55) / 0.45) * 0.1
      }
      scale = burstScale * 0.9
      // Slight spin-in
      rotation = (1 - enterProgress) * ((seed % 2 === 0) ? 15 : -15)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      burstScale = 1
      // Slow drift rotation during hold
      rotation = Math.sin((seed) * 0.01) * 3
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.4
      burstScale = scale
      rotation = exitProgress * ((seed % 2 === 0) ? 20 : -20)
    }

    const cx = 160
    const cy = 110
    const outerR = 130
    const innerR = 80
    const points = 12 + (seed % 4) // 12-15 points for variety

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity: Math.max(0, opacity),
        }}
      >
        <svg width="320" height="220" viewBox="0 0 320 220" style={{ overflow: 'visible' }}>
          {/* Starburst border (slightly larger, black) */}
          <path
            d={starburstPath(cx, cy, outerR + 5, innerR + 3, points)}
            fill="#000000"
          />
          {/* Starburst fill */}
          <path
            d={starburstPath(cx, cy, outerR, innerR, points)}
            fill={burstColor}
          />
          {/* Inner glow ring */}
          <path
            d={starburstPath(cx, cy, outerR * 0.72, innerR * 0.72, points)}
            fill="none"
            stroke={borderColor}
            strokeWidth="2"
            opacity="0.5"
          />
        </svg>

        {/* Text on top of burst */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(32px, 8vw, 120px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            fontStyle: 'italic',
            color: color,
            WebkitTextStroke: '3px #000000',
            textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            userSelect: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ZapBurstComponent(props: MotionGraphicProps<ZapBurstConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zap-burst',
  title: 'Kinetic Zap Burst',
  description: 'ZAP! style jagged starburst explosion behind text — spiky SVG polygon bursts out with spring physics, bright pop-art colors, italic bold text on top',
  tags: ['kinetic', 'typography', 'comic', 'zap', 'burst', 'starburst', 'explosion', 'pop-art', 'action'],
  category: 'captions',
  component: ZapBurstComponent as any,
  defaultConfig: {
    words: ['ZAP!', 'POW!', 'WHAM!', 'KA-BOOM!'],
    colors: ['#000000', '#000000', '#000000', '#000000'],
    bgColor: '#0000CC',
    cycleDuration: 0.85,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ZAP!', 'POW!', 'WHAM!', 'KA-BOOM!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#000000', '#000000', '#000000', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0000CC', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.85, min: 0.3, max: 5, group: 'Timing' },
  ],
})
