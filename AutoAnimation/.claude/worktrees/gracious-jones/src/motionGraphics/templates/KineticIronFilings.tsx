import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface IronFilingsConfig extends KineticBaseConfig {
  filingCount: number
  fieldStrength: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Magnetic field line hints — faint arcs */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}>
        {[-1, 0, 1].map((i) => (
          <ellipse
            key={i}
            cx="50%"
            cy="50%"
            rx={`${30 + i * 15}%`}
            ry={`${20 + i * 10}%`}
            fill="none"
            stroke="#888"
            strokeWidth="1"
            strokeDasharray="6 8"
          />
        ))}
      </svg>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const filingCount = 120
    const seed = index * 71

    let alignP = 0
    let releaseP = 0

    if (phase === 'enter') {
      alignP = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      alignP = 1
    } else {
      alignP = 1
      releaseP = exitProgress
    }

    const filings = []
    for (let i = 0; i < filingCount; i++) {
      const p0 = pseudo(seed + i * 19)
      const p1 = pseudo(seed + i * 13 + 1)
      const p2 = pseudo(seed + i * 7 + 2)
      const p3 = pseudo(seed + i * 5 + 3)
      const p4 = pseudo(seed + i * 3 + 4)

      // Start scattered chaotically around the field
      const startAngle = p0 * Math.PI * 2
      const startDist = 0.3 + p1 * 0.5
      const startX = Math.cos(startAngle) * startDist * width * 0.65
      const startY = Math.sin(startAngle) * startDist * height * 0.55

      // End: aligned in arc patterns following field lines (oval arcs)
      const fieldAngle = p2 * Math.PI * 2
      const fieldDist = 0.15 + p3 * 0.45
      const endX = Math.cos(fieldAngle) * fieldDist * width * 0.6
      const endY = Math.sin(fieldAngle) * fieldDist * height * 0.45

      const curX = startX + (endX - startX) * alignP
      const curY = startY + (endY - startY) * alignP

      // On release: fly outward explosively
      const releaseX = curX + (curX - endX * 0.3) * easeInBack(releaseP) * 1.5
      const releaseY = curY + (curY - endY * 0.3) * easeInBack(releaseP) * 1.5

      const finalX = phase === 'exit' ? releaseX : curX
      const finalY = phase === 'exit' ? releaseY : curY

      // Filing orientation follows field direction (like tiny bar magnets)
      const orientAngle = fieldAngle * (180 / Math.PI) + 90

      const length = 8 + p4 * 14
      const thick = 1 + p2 * 1.5
      const grayShade = 140 + Math.floor(p0 * 100)

      const opacity = Math.min(1, alignP * 3 + 0.1) * (1 - releaseP * releaseP)

      filings.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: length,
            height: thick,
            background: `rgba(${grayShade},${grayShade},${grayShade},1)`,
            borderRadius: thick / 2,
            transform: `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px)) rotate(${orientAngle + alignP * 0}deg)`,
            opacity,
          }}
        />,
      )
    }

    // Magnet hint — two poles
    const magnetOpacity = phase === 'enter' ? Math.min(1, enterProgress * 4) : phase === 'hold' ? 0.8 : 1 - releaseP

    // Text snaps in with a magnetic "click"
    const textScale = phase === 'enter' ? 0.85 + easeOutExpo(enterProgress) * 0.15 : 1
    const textOpacity =
      phase === 'enter' ? Math.min(1, (enterProgress - 0.5) / 0.5) : phase === 'hold' ? 1 : 1 - releaseP

    return (
      <>
        {filings}
        {/* Magnetic poles */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 4,
            opacity: magnetOpacity * 0.5,
          }}
        >
          {['N', 'S'].map((pole) => (
            <div
              key={pole}
              style={{
                width: 24,
                height: 10,
                background: pole === 'N' ? '#e74c3c' : '#3498db',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                fontSize: 8,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {pole}
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: Math.max(0, textOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>
      </>
    )
  },
}

function IronFilingsComponent(props: MotionGraphicProps<IronFilingsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-iron-filings',
  title: 'Kinetic Iron Filings',
  description:
    'Scattered iron filings snap into magnetic field arc patterns, orienting along invisible field lines to reveal the typography beneath.',
  tags: ['kinetic', 'typography', 'iron', 'filings', 'magnetic', 'field', 'align', 'scatter', 'physics', 'assembly'],
  category: 'captions',
  component: IronFilingsComponent as any,
  defaultConfig: {
    words: ['FORCE', 'FIELD', 'PULL', 'ALIGN'],
    colors: ['#FFFFFF', '#E8E8E8', '#C0C0C0', '#F0F0F0'],
    bgColor: '#0D1117',
    cycleDuration: 2.0,
    filingCount: 120,
    fieldStrength: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FORCE', 'FIELD', 'PULL', 'ALIGN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#E8E8E8', '#C0C0C0', '#F0F0F0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1117', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'filingCount',
      label: 'Filing Count',
      type: 'number',
      defaultValue: 120,
      min: 40,
      max: 200,
      group: 'Animation',
    },
    {
      key: 'fieldStrength',
      label: 'Field Strength',
      type: 'number',
      defaultValue: 1,
      min: 0.5,
      max: 3,
      group: 'Animation',
    },
  ],
})
