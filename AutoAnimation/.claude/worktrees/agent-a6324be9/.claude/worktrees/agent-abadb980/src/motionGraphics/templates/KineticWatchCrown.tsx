import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WatchCrownConfig extends KineticBaseConfig {}

// Ease out with a winding deceleration — crown slows as mainspring tension rises
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

// Spiral unwind: each character follows a tightening spiral path
// r = baseR * (1 - t) * factor, theta = turns * 2π * (1-t)
function spiralPos(
  t: number, // 0 = wound tight, 1 = fully unwound to position
  targetX: number,
  targetY: number,
  cx: number,
  turns: number,
): { x: number; y: number } {
  const unwound = easeOutExpo(t)
  const radius = (1 - unwound) * Math.min(Math.abs(targetX - cx), 60) * 2.5
  const theta = (1 - unwound) * turns * Math.PI * 2
  return {
    x: targetX + Math.cos(theta) * radius,
    y: targetY + Math.sin(theta) * radius,
  }
}

const CROWN_NOTCHES = 12

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Crown knurling rotates slowly — visual crown on right edge
    const crownAngle = time * 45 // 45°/sec — slow wind

    const crownX = width * 0.92
    const crownY = height * 0.5
    const crownR = Math.min(width, height) * 0.055

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Case side — horizontal lines suggesting watch case profile */}
        <div
          style={{
            position: 'absolute',
            top: '32%',
            right: 0,
            width: '8%',
            height: '36%',
            background: 'linear-gradient(to right, transparent, rgba(160,160,180,0.08))',
            borderTop: '1px solid rgba(180,180,200,0.12)',
            borderBottom: '1px solid rgba(180,180,200,0.12)',
          }}
        />

        {/* Crown stem */}
        <div
          style={{
            position: 'absolute',
            top: crownY - 2,
            right: width - crownX + crownR,
            width: crownR * 1.4,
            height: 4,
            background: 'linear-gradient(to right, rgba(160,160,180,0.08), rgba(180,175,160,0.2))',
          }}
        />

        {/* Crown body — rotating knurled wheel */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* Crown disc */}
          <circle
            cx={crownX}
            cy={crownY}
            r={crownR}
            fill="url(#crownGrad)"
            stroke="rgba(200,195,175,0.3)"
            strokeWidth={1.5}
          />

          <defs>
            <radialGradient id="crownGrad" cx="40%" cy="35%">
              <stop offset="0%" stopColor="rgba(200,195,175,0.35)" />
              <stop offset="100%" stopColor="rgba(100,95,80,0.2)" />
            </radialGradient>
          </defs>

          {/* Knurling notches — rotate with crown */}
          {Array.from({ length: CROWN_NOTCHES }, (_, i) => {
            const ang = ((crownAngle + i * (360 / CROWN_NOTCHES)) * Math.PI) / 180
            const innerR = crownR * 0.65
            const x1 = crownX + Math.cos(ang) * innerR
            const y1 = crownY + Math.sin(ang) * innerR
            const x2 = crownX + Math.cos(ang) * crownR
            const y2 = crownY + Math.sin(ang) * crownR
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(220,215,190,0.25)" strokeWidth={1.2} />
          })}

          {/* Crown center pip */}
          <circle cx={crownX} cy={crownY} r={crownR * 0.18} fill="rgba(200,195,175,0.4)" />

          {/* Wind direction arrows — faint */}
          {[0, 180].map((baseDeg, i) => {
            const rad = ((baseDeg + crownAngle * 0.3) * Math.PI) / 180
            const ax = crownX + Math.cos(rad) * crownR * 1.5
            const ay = crownY + Math.sin(rad) * crownR * 1.5
            return (
              <text
                key={i}
                x={ax}
                y={ay}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={crownR * 0.6}
                fill="rgba(180,175,150,0.12)"
                transform={`rotate(${baseDeg + crownAngle * 0.3}, ${ax}, ${ay})`}
              >
                ↻
              </text>
            )
          })}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const cx = width * 0.46 // shifted slightly left from center (away from crown)
    const cy = height / 2

    // Final positions: characters laid out horizontally centered
    const charWidth = Math.min((width * 0.65) / totalChars, 90)
    const totalWidth = charWidth * totalChars
    const startX = cx - totalWidth / 2 + charWidth / 2

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {chars.map((char, ci) => {
          const targetX = startX + ci * charWidth
          const targetY = cy

          // Characters unwind from the same crown origin point (right side)
          // Stagger: later chars unwind later, like spring uncoiling
          const stagger = (totalChars - 1 - ci) * 0.09
          const staggeredT =
            phase === 'enter' ? Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5))) : 0

          let x = targetX
          let y = targetY
          let opacity = 1
          let scale = 1
          let rotDeg = 0

          if (phase === 'enter') {
            const pos = spiralPos(staggeredT, targetX, targetY, cx, 1.5 + ci * 0.3)
            x = pos.x
            y = pos.y
            opacity = Math.min(1, staggeredT * 2.5)
            scale = 0.4 + 0.6 * easeOutExpo(staggeredT)
            // Characters spin as they unwind — matching spiral rotation
            rotDeg = (1 - easeOutExpo(staggeredT)) * (ci % 2 === 0 ? 360 : -360)
          } else if (phase === 'hold') {
            x = targetX
            y = targetY
          } else {
            // Wind back — characters spiral back into the crown
            const revStagger = ci * 0.07
            const revT = Math.max(0, Math.min(1, (exitProgress - revStagger) / (1 - revStagger * 0.5)))
            const pos = spiralPos(1 - revT, targetX, targetY, cx, 1.2 + ci * 0.2)
            x = pos.x
            y = pos.y
            opacity = 1 - easeInExpo(revT)
            scale = 1 - revT * 0.5
            rotDeg = revT * (ci % 2 === 0 ? -270 : 270)
          }

          return (
            <div
              key={ci}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotDeg}deg)`,
                opacity,
                fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                fontSize: 'clamp(38px, 8.5vw, 125px)',
                fontWeight: 300,
                color,
                letterSpacing: '0.1em',
                textShadow: `0 0 24px ${color}35`,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {char}
            </div>
          )
        })}
      </div>
    )
  },
}

function WatchCrownComponent(props: MotionGraphicProps<WatchCrownConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-watch-crown',
  title: 'Watch Crown Wind',
  description:
    'Characters unwind from a spiral like a mainspring being released — each letter coils in from the crown side, spinning and expanding as the spring unwinds. A rotating knurled crown decorates the right edge.',
  tags: ['kinetic', 'typography', 'watch', 'crown', 'mainspring', 'wind', 'spiral', 'horology', 'clockwork'],
  category: 'captions',
  component: WatchCrownComponent as any,
  defaultConfig: {
    words: ['WIND', 'SET', 'KEEP', 'TIME'],
    colors: ['#C8C4B8', '#E8E4D8', '#A8A498', '#D4D0C4'],
    bgColor: '#0C0B09',
    cycleDuration: 1.7,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WIND', 'SET', 'KEEP', 'TIME'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C8C4B8', '#E8E4D8', '#A8A498', '#D4D0C4'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0B09', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.7,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
