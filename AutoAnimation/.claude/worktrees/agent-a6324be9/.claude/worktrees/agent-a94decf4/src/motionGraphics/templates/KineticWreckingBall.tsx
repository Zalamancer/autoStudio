import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WreckingBallConfig extends KineticBaseConfig {
  ballColor: string
}

/* ---------- Easing curves matching demolition physics ---------- */

// Ball swings in on a pendulum arc — sinusoidal
function pendulumAngle(t: number, amplitude: number, phase: number): number {
  return amplitude * Math.cos(t * Math.PI * 2 + phase) * Math.exp(-t * 0.8)
}

// Debris chunks fly outward with cubic deceleration
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Text assembles from rubble — each shard slides into place
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Impact deceleration — ball slows fast on contact
function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Ball swings continuously as background element
    const pivotX = width / 2
    const pivotY = 0
    const cableLen = height * 0.35
    const ballAngle = Math.sin(time * 1.8) * 28   // degrees
    const ballRad = (ballAngle * Math.PI) / 180
    const ballX = pivotX + Math.sin(ballRad) * cableLen
    const ballY = pivotY + Math.cos(ballRad) * cableLen
    const ballR = Math.min(width, height) * 0.06

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Rubble dust — subtle gradient at base */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20%',
            background: `linear-gradient(0deg, rgba(120, 100, 80, 0.08) 0%, transparent 100%)`,
          }}
        />
        {/* Concrete chip texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at ${10 + seededRand(1) * 80}% ${20 + seededRand(2) * 60}%, rgba(140, 125, 105, 0.04) 0%, transparent 2%),
              radial-gradient(circle at ${10 + seededRand(3) * 80}% ${20 + seededRand(4) * 60}%, rgba(130, 115, 95, 0.03) 0%, transparent 1.5%),
              radial-gradient(circle at ${10 + seededRand(5) * 80}% ${20 + seededRand(6) * 60}%, rgba(150, 135, 110, 0.04) 0%, transparent 2.5%),
              radial-gradient(circle at ${10 + seededRand(7) * 80}% ${20 + seededRand(8) * 60}%, rgba(140, 120, 100, 0.03) 0%, transparent 1.8%)
            `,
          }}
        />

        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Pivot mount bar at top */}
          <rect
            x={pivotX - 18}
            y={0}
            width={36}
            height={6}
            fill="rgba(180, 160, 100, 0.12)"
            rx={1}
          />

          {/* Cable */}
          <line
            x1={pivotX}
            y1={3}
            x2={ballX}
            y2={ballY}
            stroke="rgba(180, 160, 100, 0.15)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Wrecking ball */}
          <circle
            cx={ballX}
            cy={ballY}
            r={ballR}
            fill="none"
            stroke="rgba(180, 160, 100, 0.1)"
            strokeWidth={2}
          />
          {/* Ball surface — chain attachment divots */}
          <circle cx={ballX} cy={ballY} r={ballR * 0.15} fill="rgba(180, 160, 100, 0.08)" />
          {/* Ball motion trail */}
          <circle
            cx={ballX - Math.sin(ballRad) * 8}
            cy={ballY - Math.cos(ballRad) * 2}
            r={ballR * 0.9}
            fill="none"
            stroke="rgba(180, 160, 100, 0.04)"
            strokeWidth={1}
          />

          {/* Safety fence at base */}
          {Array.from({ length: 8 }, (_, i) => {
            const fx = (width * i) / 7
            return (
              <g key={`fence-${i}`} opacity={0.06}>
                <line x1={fx} y1={height - 16} x2={fx} y2={height} stroke="rgba(240, 200, 40, 1)" strokeWidth={2} />
              </g>
            )
          })}
          <line
            x1={0}
            y1={height - 16}
            x2={width}
            y2={height - 16}
            stroke="rgba(240, 200, 40, 0.06)"
            strokeWidth={1.5}
          />

          {/* DEMOLITION label */}
          <text
            x={12}
            y={height - 4}
            fill="rgba(240, 200, 40, 0.1)"
            fontSize={7}
            fontFamily="'Arial', sans-serif"
            fontWeight={700}
            letterSpacing={3}
          >
            DEMOLITION ZONE
          </text>
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
    const fontSize = Math.min(width / (totalChars * 0.65), 130)
    const charW = fontSize * 0.62
    const textWidth = totalChars * charW
    const startX = width / 2 - textWidth / 2
    const centerY = height / 2

    // Ball swing for exit impact
    const pivotX = width / 2
    const pivotY = -height * 0.1
    const cableLen = height * 0.65

    // Ball swings from right (rest) to left (impact at center) during exit
    let ballAngleDeg = 30   // parked right while not in exit
    let ballVisible = false

    if (phase === 'exit') {
      // Ball swings from 30deg right to 0 (impact) over first 40% of exit
      const swingT = Math.min(1, exitProgress / 0.4)
      ballAngleDeg = 30 * (1 - easeInExpo(swingT))
      // After impact, ball swings through to left side
      if (exitProgress > 0.4) {
        const throughT = (exitProgress - 0.4) / 0.6
        ballAngleDeg = -30 * easeOutCubic(throughT)
      }
      ballVisible = true
    } else if (phase === 'hold') {
      ballAngleDeg = 32 + Math.sin(holdProgress * Math.PI * 2) * 2
      ballVisible = holdProgress > 0.5  // Ball appears late in hold, looming
    }

    const ballRad = (ballAngleDeg * Math.PI) / 180
    const ballX = pivotX + Math.sin(ballRad) * cableLen
    const ballY = pivotY + Math.cos(ballRad) * cableLen
    const ballR = Math.min(width, height) * 0.065

    // Impact happened at exitProgress ~0.4 — chars scatter after that
    const impactTime = 0.4

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Wrecking ball for this word's exit sequence */}
        {ballVisible && (
          <svg
            width={width}
            height={height}
            style={{ position: 'absolute', inset: 0, overflow: 'visible', zIndex: 10 }}
          >
            <line
              x1={pivotX}
              y1={0}
              x2={ballX}
              y2={ballY}
              stroke={`rgba(180, 160, 100, ${phase === 'exit' ? 0.5 : 0.15})`}
              strokeWidth={2.5}
            />
            <circle
              cx={ballX}
              cy={ballY}
              r={ballR}
              fill={`rgba(140, 120, 90, ${phase === 'exit' ? 0.35 : 0.1})`}
              stroke={`rgba(180, 155, 100, ${phase === 'exit' ? 0.6 : 0.15})`}
              strokeWidth={2}
            />
            {/* Chain link texture on ball */}
            <circle
              cx={ballX}
              cy={ballY}
              r={ballR * 0.2}
              fill={`rgba(100, 85, 65, ${phase === 'exit' ? 0.4 : 0.1})`}
            />
          </svg>
        )}

        {/* Characters — assemble from debris on enter, scatter on exit impact */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {chars.map((char, ci) => {
            const stagger = ci * 0.07
            const charSeed = seededRand(ci * 127.1 + index * 311.7)
            const charX = startX + ci * charW

            let xOffset = 0
            let yOffset = 0
            let rotation = 0
            let opacity = 0
            let scale = 1
            let blur = 0

            if (phase === 'enter') {
              // Chars fly in from random directions — debris assembling into word
              const t = Math.max(0, Math.min(1, (enterProgress - stagger * 0.8) / (1 - stagger * 0.6)))
              const eased = easeOutBack(t)
              // Each char comes from a different direction
              const angle = charSeed * Math.PI * 2
              const dist = 80 + charSeed * 60
              xOffset = Math.cos(angle) * dist * (1 - eased)
              yOffset = Math.sin(angle) * dist * (1 - eased)
              rotation = (1 - eased) * (charSeed > 0.5 ? 1 : -1) * 45
              opacity = Math.min(1, t * 2.5)
              scale = 0.4 + eased * 0.6
              blur = (1 - eased) * 4
            } else if (phase === 'hold') {
              opacity = 1
              // Very slight vibration — structure under stress
              xOffset = Math.sin(holdProgress * Math.PI * 8 + ci * 1.3) * 0.8
              yOffset = Math.sin(holdProgress * Math.PI * 6 + ci * 0.9) * 0.5
              // Ball looming makes text shake harder
              const loomShake = holdProgress > 0.5 ? (holdProgress - 0.5) * 2 : 0
              xOffset += Math.sin(holdProgress * Math.PI * 12 + ci * 2.1) * loomShake * 2
            } else {
              // Before ball impact: text stands
              if (exitProgress < impactTime) {
                opacity = 1
                // Rumble intensifies as ball approaches
                const rumbleT = exitProgress / impactTime
                xOffset = Math.sin(exitProgress * Math.PI * 20 + ci * 1.7) * rumbleT * 3
                yOffset = Math.sin(exitProgress * Math.PI * 15 + ci * 2.3) * rumbleT * 2
              } else {
                // Post-impact: chars shatter outward from ball contact point
                const t = (exitProgress - impactTime) / (1 - impactTime)
                const eased = easeOutCubic(t)
                // Each char scatters in a different direction, chars near center scatter most
                const distFromCenter = Math.abs(ci - totalChars / 2) / (totalChars / 2)
                const scatter = 60 + charSeed * 80 + (1 - distFromCenter) * 80
                const scatterAngle = (charSeed * Math.PI * 2) + (ci < totalChars / 2 ? Math.PI : 0) * 0.3
                xOffset = Math.cos(scatterAngle) * scatter * eased
                yOffset = (Math.sin(scatterAngle) * scatter + eased * 50) * eased  // gravity adds down
                rotation = eased * (charSeed > 0.5 ? 1 : -1) * (90 + charSeed * 180)
                opacity = 1 - Math.pow(eased, 0.7)
                scale = 1 + eased * 0.3
                blur = eased * 3
              }
            }

            return (
              <div
                key={ci}
                style={{
                  position: 'absolute',
                  left: charX,
                  top: centerY - fontSize * 0.55,
                  width: charW,
                  height: fontSize * 1.1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg) scale(${scale})`,
                  opacity,
                  filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
                    fontSize: `clamp(28px, 10vw, ${fontSize}px)`,
                    fontWeight: 900,
                    color,
                    textShadow: `0 2px 6px rgba(0,0,0,0.5)`,
                    letterSpacing: 0,
                    display: 'block',
                  }}
                >
                  {char}
                </span>
              </div>
            )
          })}
        </div>

        {/* Impact flash at moment of contact */}
        {phase === 'exit' && exitProgress >= impactTime - 0.05 && exitProgress < impactTime + 0.12 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(240, 220, 160, ${Math.max(0, 0.15 - Math.abs(exitProgress - impactTime) * 1.5)})`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Dust cloud at impact */}
        {phase === 'exit' && exitProgress > impactTime && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: centerY,
              transform: 'translate(-50%, -50%)',
              width: `${(exitProgress - impactTime) * 300}px`,
              height: `${(exitProgress - impactTime) * 200}px`,
              background: 'radial-gradient(ellipse, rgba(140, 125, 100, 0.12) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
              filter: 'blur(8px)',
              opacity: 1 - (exitProgress - impactTime) / 0.6,
            }}
          />
        )}
      </div>
    )
  },
}

function WreckingBallComponent(props: MotionGraphicProps<WreckingBallConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wrecking-ball',
  title: 'Wrecking Ball',
  description:
    'Characters assemble from scattered debris on enter, then a pendulum wrecking ball swings in and shatters them apart on exit — with impact flash, dust cloud, and physics-accurate scatter.',
  tags: [
    'kinetic',
    'typography',
    'wrecking',
    'demolition',
    'construction',
    'impact',
    'shatter',
    'debris',
    'industrial',
    'pendulum',
    'ball',
  ],
  category: 'captions',
  component: WreckingBallComponent as any,
  defaultConfig: {
    words: ['SMASH', 'WRECK', 'DEMO', 'BREAK'],
    colors: ['#F04030', '#E03020', '#FF5040', '#D02818'],
    bgColor: '#111010',
    cycleDuration: 1.8,
    ballColor: '#8C7850',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SMASH', 'WRECK', 'DEMO', 'BREAK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F04030', '#E03020', '#FF5040', '#D02818'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111010', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.8,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'ballColor',
      label: 'Ball Color',
      type: 'color',
      defaultValue: '#8C7850',
      group: 'Style',
    },
  ],
})
