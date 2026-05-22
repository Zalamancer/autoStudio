import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ElevatorIndicatorConfig extends KineticBaseConfig {
  panelColor: string
}

/* ---------- Easing curves matching elevator physics ---------- */

// Smooth deceleration as car arrives at floor
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// Gentle acceleration as car departs
function easeInQuad(t: number): number {
  return t * t
}

// Mechanical overshoot for the indicator needle
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return (Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const cx = width / 2
    const panelTop = height * 0.08
    const panelH = height * 0.28
    const panelW = width * 0.6

    // Needle swings smoothly during transitions
    const needleAngle = Math.sin(frame / fps * 1.8) * 35

    // Indicator dots representing floors — 7 floors
    const floorCount = 7
    const arcRadius = panelW * 0.38
    const arcCenterY = panelTop + panelH * 0.75

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Brushed brass panel texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              180deg,
              transparent,
              transparent 1px,
              rgba(180, 150, 80, 0.015) 1px,
              rgba(180, 150, 80, 0.015) 2px
            )`,
          }}
        />

        {/* Art deco wall pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 59px,
                rgba(180, 150, 80, 0.04) 59px,
                rgba(180, 150, 80, 0.04) 60px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 59px,
                rgba(180, 150, 80, 0.04) 59px,
                rgba(180, 150, 80, 0.04) 60px
              )
            `,
          }}
        />

        {/* Indicator panel — brass semicircle */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Panel backing */}
          <ellipse
            cx={cx}
            cy={arcCenterY}
            rx={panelW * 0.44}
            ry={panelH * 0.55}
            fill="none"
            stroke="rgba(180, 150, 80, 0.15)"
            strokeWidth={1.5}
          />
          <ellipse
            cx={cx}
            cy={arcCenterY}
            rx={panelW * 0.42}
            ry={panelH * 0.52}
            fill="none"
            stroke="rgba(180, 150, 80, 0.08)"
            strokeWidth={0.5}
          />

          {/* Floor number dots along the arc */}
          {Array.from({ length: floorCount }, (_, i) => {
            const angle = -Math.PI + (Math.PI * (i + 0.5)) / floorCount
            const dx = cx + Math.cos(angle) * arcRadius
            const dy = arcCenterY + Math.sin(angle) * (panelH * 0.38)
            const floorLabel = `${i + 1}`
            const brightness = 0.2 + Math.abs(seededRand(i * 7 + 3)) * 0.15
            return (
              <g key={`floor-${i}`}>
                <circle cx={dx} cy={dy} r={3} fill={`rgba(180, 150, 80, ${brightness})`} />
                <text
                  x={dx}
                  y={dy - 7}
                  textAnchor="middle"
                  fill={`rgba(180, 150, 80, ${brightness + 0.1})`}
                  fontSize={7}
                  fontFamily="'Georgia', serif"
                >
                  {floorLabel}
                </text>
              </g>
            )
          })}

          {/* Needle */}
          <line
            x1={cx}
            y1={arcCenterY}
            x2={cx + Math.cos(((needleAngle - 90) * Math.PI) / 180) * arcRadius * 0.9}
            y2={arcCenterY + Math.sin(((needleAngle - 90) * Math.PI) / 180) * (panelH * 0.34)}
            stroke="rgba(220, 180, 80, 0.6)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={arcCenterY} r={3} fill="rgba(220, 180, 80, 0.5)" />
        </svg>

        {/* Direction arrows */}
        <div
          style={{
            position: 'absolute',
            top: panelTop + panelH + 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 24,
            opacity: 0.25,
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 18,
              color: '#B4964F',
              opacity: Math.sin(frame / fps * 3) > 0 ? 0.8 : 0.3,
            }}
          >
            ▲
          </span>
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 18,
              color: '#B4964F',
              opacity: Math.sin(frame / fps * 3) > 0 ? 0.3 : 0.8,
            }}
          >
            ▼
          </span>
        </div>
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
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.65), 140)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Floor text — characters slide up from below like an analog counter */}
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
            overflow: 'hidden',
          }}
        >
          {chars.map((char, ci) => {
            const stagger = ci * 0.07
            const charSeed = seededRand(ci * 127.1 + index * 311.7)

            let yOffset = 0
            let charOpacity = 0
            let charScale = 1

            if (phase === 'enter') {
              // Each character slides up from below, staggered — like floor numbers scrolling
              const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
              const eased = easeOutBack(t)
              yOffset = (1 - eased) * (fontSize * 1.2 + Math.abs(charSeed) * 20)
              charOpacity = Math.min(1, t * 3)
              charScale = 0.7 + eased * 0.3
            } else if (phase === 'hold') {
              // Subtle mechanical vibration — elevator hum
              yOffset = Math.sin(holdProgress * Math.PI * 6 + ci * 0.9) * 1.2
              charOpacity = 1
              charScale = 1 + Math.sin(holdProgress * Math.PI * 4 + ci * 1.3) * 0.008
            } else {
              // Characters slide downward on exit — elevator departing
              const t = Math.max(0, Math.min(1, (exitProgress - stagger) / (1 - stagger * 0.5)))
              const eased = easeInQuad(t)
              yOffset = eased * (-fontSize * 1.5)
              charOpacity = 1 - eased
              charScale = 1 - eased * 0.2
            }

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Character window — like the indicator cutout */}
                <div
                  style={{
                    overflow: 'hidden',
                    height: fontSize * 1.15,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: `clamp(32px, 10vw, ${fontSize}px)`,
                      fontWeight: 700,
                      color,
                      transform: `translateY(${yOffset}px) scaleY(${charScale})`,
                      display: 'inline-block',
                      opacity: charOpacity,
                      textShadow: `0 0 20px ${color}50, 0 0 40px ${color}20`,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {char}
                  </span>
                </div>

                {/* Brass underline per character — like counter slots */}
                <div
                  style={{
                    width: fontSize * 0.55,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, rgba(180, 150, 80, ${charOpacity * 0.35}), transparent)`,
                    marginTop: 2,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Floor indicator label */}
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 10,
            color: 'rgba(180, 150, 80, 0.3)',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity:
              phase === 'enter'
                ? easeOutQuart(enterProgress)
                : phase === 'exit'
                  ? 1 - exitProgress
                  : 1,
          }}
        >
          FLOOR {index + 1}
        </div>
      </div>
    )
  },
}

function ElevatorIndicatorComponent(props: MotionGraphicProps<ElevatorIndicatorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-elevator-indicator',
  title: 'Elevator Indicator',
  description:
    'Art deco elevator floor indicator with brass semicircle dial, swinging needle, and characters that scroll up from below like analog counter digits arriving at each floor.',
  tags: [
    'kinetic',
    'typography',
    'elevator',
    'indicator',
    'architecture',
    'art-deco',
    'brass',
    'floor',
    'lobby',
    'spatial',
  ],
  category: 'captions',
  component: ElevatorIndicatorComponent as any,
  defaultConfig: {
    words: ['LOBBY', 'GOING', 'UP', 'ARRIVE'],
    colors: ['#E8C872', '#D4A847', '#E8C872', '#F0D890'],
    bgColor: '#1A1410',
    cycleDuration: 1.3,
    panelColor: '#B4964F',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LOBBY', 'GOING', 'UP', 'ARRIVE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8C872', '#D4A847', '#E8C872', '#F0D890'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1410', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'panelColor',
      label: 'Panel Color',
      type: 'color',
      defaultValue: '#B4964F',
      group: 'Style',
    },
  ],
})
