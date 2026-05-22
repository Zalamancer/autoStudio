import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CraneHoistConfig extends KineticBaseConfig {
  steelColor: string
}

/* ---------- Easing curves matching cable/load physics ---------- */

// Heavy load starts slow under inertia — then crane motor pulls hard
function easeInOutExpo(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2
}

// Load settles with cable oscillation — pendulum damping
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

// Release — cable goes slack fast
function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Crane boom position (top-left of frame)
    const boomX = width * 0.08
    const boomTipX = width * 0.85
    const boomY = height * 0.12
    const trolleyX = boomX + (boomTipX - boomX) * (0.5 + Math.sin(time * 0.4) * 0.08)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sky gradient — construction site dawn */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(20, 35, 55, 0) 0%, rgba(40, 55, 80, 0) 100%)`,
          }}
        />
        {/* Construction site haze */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: `linear-gradient(0deg, rgba(80, 65, 45, 0.06) 0%, transparent 100%)`,
          }}
        />

        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Tower mast — vertical column */}
          <rect
            x={boomX - 3}
            y={boomY}
            width={6}
            height={height - boomY}
            fill="none"
            stroke="rgba(180, 160, 100, 0.12)"
            strokeWidth={1.5}
          />
          {/* Lattice cross-braces on mast */}
          {Array.from({ length: 6 }, (_, i) => {
            const segH = (height - boomY) / 6
            const y1 = boomY + i * segH
            const y2 = y1 + segH
            return (
              <g key={`mast-${i}`} opacity={0.08}>
                <line x1={boomX - 3} y1={y1} x2={boomX + 3} y2={y2}
                  stroke="rgba(180, 160, 100, 1)" strokeWidth={0.8} />
                <line x1={boomX + 3} y1={y1} x2={boomX - 3} y2={y2}
                  stroke="rgba(180, 160, 100, 1)" strokeWidth={0.8} />
              </g>
            )
          })}

          {/* Crane boom — horizontal arm */}
          <line
            x1={boomX}
            y1={boomY}
            x2={boomTipX}
            y2={boomY}
            stroke="rgba(200, 175, 90, 0.18)"
            strokeWidth={3}
            strokeLinecap="square"
          />
          {/* Boom lattice */}
          {Array.from({ length: 5 }, (_, i) => {
            const t = (i + 0.5) / 5
            const lx = boomX + (boomTipX - boomX) * t
            return (
              <line
                key={`boom-${i}`}
                x1={lx - 8}
                y1={boomY}
                x2={lx + 8}
                y2={boomY + 10}
                stroke="rgba(200, 175, 90, 0.08)"
                strokeWidth={0.8}
              />
            )
          })}

          {/* Counter-jib */}
          <line
            x1={boomX}
            y1={boomY}
            x2={boomX - width * 0.18}
            y2={boomY}
            stroke="rgba(200, 175, 90, 0.1)"
            strokeWidth={2}
          />

          {/* Trolley */}
          <rect
            x={trolleyX - 5}
            y={boomY - 2}
            width={10}
            height={6}
            fill="rgba(220, 185, 80, 0.22)"
            rx={1}
          />

          {/* Warning stripes on mast base */}
          <rect
            x={boomX - 5}
            y={height - 20}
            width={10}
            height={20}
            fill="none"
            stroke="rgba(240, 200, 0, 0.12)"
            strokeWidth={0.5}
          />
        </svg>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
    fps,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.65), 128)
    const time = frame / fps

    // Crane cable connects from trolley (top of frame) to text
    const boomX = width * 0.08
    const boomTipX = width * 0.85
    const trolleyX = boomX + (boomTipX - boomX) * (0.5 + Math.sin(time * 0.4) * 0.08)
    const boomY = height * 0.12

    // Text vertical position — lifts from bottom to center
    let textY = 0        // offset from center, positive = down
    let opacity = 0
    let cableLength = 0
    let swingAngle = 0   // pendulum swing in degrees

    if (phase === 'enter') {
      // Text hoisted up from below — starts at bottom, lifted to center
      const p = easeInOutExpo(enterProgress)
      textY = (1 - p) * height * 0.6
      opacity = Math.min(1, enterProgress * 4)
      // Pendulum swing settles as it arrives — elastic bounce
      swingAngle = (1 - easeOutElastic(Math.min(1, enterProgress * 1.1))) * 12
      cableLength = boomY + height / 2 - textY - height * 0.05
    } else if (phase === 'hold') {
      textY = 0
      opacity = 1
      // Gentle sway — load hanging on cable in wind
      swingAngle = Math.sin(holdProgress * Math.PI * 3 + index * 0.7) * 1.5
      cableLength = boomY + height / 2 - height * 0.05
    } else {
      // Exit: cable released — load drops and fades
      const p = easeInQuad(exitProgress)
      textY = p * height * 0.5
      opacity = 1 - p
      swingAngle = p * 8
      cableLength = boomY + height / 2 + textY - height * 0.05
    }

    const textCenterY = height / 2 + textY

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Cable from trolley to load */}
        {opacity > 0.05 && (
          <svg
            width={width}
            height={height}
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            <line
              x1={trolleyX}
              y1={boomY + 4}
              x2={width / 2 + Math.sin((swingAngle * Math.PI) / 180) * 20}
              y2={textCenterY - fontSize * 0.55}
              stroke={`rgba(200, 175, 90, ${opacity * 0.35})`}
              strokeWidth={1.5}
              strokeDasharray="none"
            />
            {/* Hook */}
            <circle
              cx={width / 2 + Math.sin((swingAngle * Math.PI) / 180) * 20}
              cy={textCenterY - fontSize * 0.55 + 3}
              r={3}
              fill="none"
              stroke={`rgba(200, 175, 90, ${opacity * 0.4})`}
              strokeWidth={1}
            />
          </svg>
        )}

        {/* Text block — the steel beam payload */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: textCenterY,
            transform: `translate(-50%, -50%) rotate(${swingAngle}deg)`,
            opacity,
          }}
        >
          {/* Steel beam background plate */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px -12px',
              background: `linear-gradient(180deg,
                rgba(80, 70, 55, 0.0) 0%,
                rgba(60, 55, 45, 0.0) 100%
              )`,
              borderTop: `2px solid ${color}18`,
              borderBottom: `2px solid ${color}10`,
            }}
          />

          {/* Characters — bold slab serif like embossed steel plate */}
          <div style={{ display: 'flex', gap: 0 }}>
            {chars.map((char, ci) => {
              const stagger = ci * 0.04
              const charOpacity = phase === 'enter'
                ? Math.max(0, Math.min(1, (enterProgress - stagger) / 0.3))
                : 1

              return (
                <span
                  key={ci}
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
                    fontSize: `clamp(32px, 10vw, ${fontSize}px)`,
                    fontWeight: 900,
                    color,
                    letterSpacing: '0.02em',
                    opacity: charOpacity,
                    textShadow: `
                      0 2px 0 ${color}25,
                      0 4px 8px rgba(0,0,0,0.4)
                    `,
                  }}
                >
                  {char}
                </span>
              )
            })}
          </div>

          {/* Rigging sling lines at top of beam */}
          {opacity > 0.1 && (
            <div
              style={{
                position: 'absolute',
                top: -8,
                left: '30%',
                right: '30%',
                height: 8,
                borderLeft: `1.5px solid ${color}20`,
                borderRight: `1.5px solid ${color}20`,
                borderTop: `1.5px solid ${color}20`,
                borderRadius: '4px 4px 0 0',
              }}
            />
          )}
        </div>

        {/* Warning tag — dangles from hook */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              right: width * 0.15,
              top: textCenterY - fontSize * 0.3,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 7,
              fontWeight: 700,
              color: `rgba(240, 200, 40, 0.2)`,
              letterSpacing: 2,
              transform: `rotate(${swingAngle + 3}deg)`,
              whiteSpace: 'nowrap',
            }}
          >
            LOAD {(index + 1) * 2400} kg
          </div>
        )}
      </div>
    )
  },
}

function CraneHoistComponent(props: MotionGraphicProps<CraneHoistConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crane-hoist',
  title: 'Crane Hoist',
  description:
    'Text is lifted into frame as a steel beam payload on a crane cable — exponential hoist motion with elastic pendulum swing, rigging slings, and gravity drop on exit.',
  tags: [
    'kinetic',
    'typography',
    'crane',
    'hoist',
    'construction',
    'lift',
    'steel',
    'industrial',
    'building',
    'pendulum',
  ],
  category: 'captions',
  component: CraneHoistComponent as any,
  defaultConfig: {
    words: ['LIFT', 'HOIST', 'RAISE', 'HIGH'],
    colors: ['#F0E060', '#D4C040', '#E8D450', '#FFE870'],
    bgColor: '#0E1218',
    cycleDuration: 1.5,
    steelColor: '#C8B870',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LIFT', 'HOIST', 'RAISE', 'HIGH'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F0E060', '#D4C040', '#E8D450', '#FFE870'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E1218', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'steelColor',
      label: 'Steel Color',
      type: 'color',
      defaultValue: '#C8B870',
      group: 'Style',
    },
  ],
})
