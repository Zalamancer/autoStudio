import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScaffoldingRevealConfig extends KineticBaseConfig {
  scaffoldColor: string
}

/* ---------- Easing curves matching construction physics ---------- */

// Heavy steel tubes clanking into position
function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

// Scaffolding drops away under gravity
function easeInQuad(t: number): number {
  return t * t
}

// Tarp sliding off the revealed facade
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return (Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Generate scaffold grid positions for the background
    const hBars = 6
    const vBars = 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Concrete texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                rgba(140, 130, 110, 0.012) 3px,
                rgba(140, 130, 110, 0.012) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 5px,
                rgba(140, 130, 110, 0.008) 5px,
                rgba(140, 130, 110, 0.008) 6px
              )
            `,
          }}
        />

        {/* Safety mesh / netting overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 8px,
                rgba(40, 120, 60, 0.015) 8px,
                rgba(40, 120, 60, 0.015) 9px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 8px,
                rgba(40, 120, 60, 0.015) 8px,
                rgba(40, 120, 60, 0.015) 9px
              )
            `,
          }}
        />

        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Background scaffold grid — vertical poles */}
          {Array.from({ length: vBars }, (_, i) => {
            const x = (width * (i + 0.5)) / vBars
            const poleOpacity = 0.04 + Math.abs(seededRand(i * 13 + 7)) * 0.03
            return (
              <line
                key={`vp-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke={`rgba(160, 150, 130, ${poleOpacity})`}
                strokeWidth={1.5}
              />
            )
          })}

          {/* Background scaffold grid — horizontal ledgers */}
          {Array.from({ length: hBars }, (_, i) => {
            const y = (height * (i + 0.5)) / hBars
            const barOpacity = 0.03 + Math.abs(seededRand(i * 19 + 3)) * 0.02
            return (
              <line
                key={`hp-${i}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={`rgba(160, 150, 130, ${barOpacity})`}
                strokeWidth={1}
              />
            )
          })}

          {/* Diagonal braces */}
          {Array.from({ length: 4 }, (_, i) => {
            const x1 = (width * i) / 4
            const y1 = height * (0.3 + Math.abs(seededRand(i * 31 + 11)) * 0.4)
            const x2 = x1 + width / 4
            const y2 = y1 + (seededRand(i * 47 + 5) > 0.5 ? 1 : -1) * height * 0.2
            const braceOpacity = 0.02 + Math.abs(seededRand(i * 23 + 9)) * 0.02
            return (
              <line
                key={`db-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={`rgba(160, 150, 130, ${braceOpacity})`}
                strokeWidth={0.8}
              />
            )
          })}

          {/* Coupler joints — small circles at intersections */}
          {Array.from({ length: 6 }, (_, i) => {
            const jx = width * (0.15 + Math.abs(seededRand(i * 37 + 17)) * 0.7)
            const jy = height * (0.15 + Math.abs(seededRand(i * 43 + 23)) * 0.7)
            const pulse = 0.03 + Math.sin(time * 1.5 + i * 1.2) * 0.01
            return (
              <circle
                key={`cj-${i}`}
                cx={jx}
                cy={jy}
                r={2.5}
                fill="none"
                stroke={`rgba(180, 170, 140, ${pulse})`}
                strokeWidth={1}
              />
            )
          })}

          {/* Hard hat zone label */}
          <text
            x={width - 12}
            y={height - 10}
            textAnchor="end"
            fill="rgba(200, 170, 40, 0.12)"
            fontSize={7}
            fontFamily="'Arial', sans-serif"
            fontWeight={700}
            letterSpacing={2}
          >
            HARD HAT AREA
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
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.65), 140)
    const textWidth = totalChars * fontSize * 0.62
    const startX = width / 2 - textWidth / 2
    const centerY = height / 2

    // Scaffold geometry around each character
    const scaffBarColor = 'rgba(180, 170, 140, 0.5)'
    const scaffBraceColor = 'rgba(180, 170, 140, 0.25)'

    // How many scaffold bars: 2 verticals + 3 horizontals per char
    const charW = fontSize * 0.62
    const charH = fontSize * 1.1
    const padX = 6
    const padY = 10

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {chars.map((_, ci) => {
            const stagger = ci * 0.08
            const cx = startX + ci * charW + charW / 2
            const topY = centerY - charH / 2 - padY
            const botY = centerY + charH / 2 + padY
            const leftX = cx - charW / 2 - padX
            const rightX = cx + charW / 2 + padX
            const midY = (topY + botY) / 2

            let scaffoldOpacity = 0
            let scaffoldDrop = 0

            if (phase === 'enter') {
              // Scaffold bars assemble with bounce — staggered per character
              const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
              scaffoldOpacity = Math.min(1, easeOutBounce(t))
              scaffoldDrop = 0
            } else if (phase === 'hold') {
              // Scaffold starts disassembling at holdProgress 0.5
              const disassembleT = Math.max(0, (holdProgress - 0.4) / 0.6)
              scaffoldOpacity = 1 - easeInQuad(disassembleT)
              scaffoldDrop = easeInQuad(disassembleT) * 30
            } else {
              scaffoldOpacity = 0
              scaffoldDrop = 60
            }

            if (scaffoldOpacity < 0.01) return null

            return (
              <g key={`scaffold-${ci}`} opacity={scaffoldOpacity}>
                {/* Left vertical pole */}
                <line
                  x1={leftX}
                  y1={topY + scaffoldDrop * 0.3}
                  x2={leftX}
                  y2={botY + scaffoldDrop}
                  stroke={scaffBarColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                {/* Right vertical pole */}
                <line
                  x1={rightX}
                  y1={topY + scaffoldDrop * 0.3}
                  x2={rightX}
                  y2={botY + scaffoldDrop}
                  stroke={scaffBarColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                {/* Top horizontal ledger */}
                <line
                  x1={leftX}
                  y1={topY + scaffoldDrop * 0.3}
                  x2={rightX}
                  y2={topY + scaffoldDrop * 0.3}
                  stroke={scaffBarColor}
                  strokeWidth={1.5}
                />
                {/* Middle horizontal ledger */}
                <line
                  x1={leftX}
                  y1={midY + scaffoldDrop * 0.6}
                  x2={rightX}
                  y2={midY + scaffoldDrop * 0.6}
                  stroke={scaffBarColor}
                  strokeWidth={1.5}
                />
                {/* Bottom horizontal ledger */}
                <line
                  x1={leftX}
                  y1={botY + scaffoldDrop}
                  x2={rightX}
                  y2={botY + scaffoldDrop}
                  stroke={scaffBarColor}
                  strokeWidth={1.5}
                />
                {/* Diagonal brace — X pattern */}
                <line
                  x1={leftX}
                  y1={topY + scaffoldDrop * 0.3}
                  x2={rightX}
                  y2={midY + scaffoldDrop * 0.6}
                  stroke={scaffBraceColor}
                  strokeWidth={0.8}
                />
                <line
                  x1={rightX}
                  y1={topY + scaffoldDrop * 0.3}
                  x2={leftX}
                  y2={midY + scaffoldDrop * 0.6}
                  stroke={scaffBraceColor}
                  strokeWidth={0.8}
                />
                {/* Coupler joints — circles at intersections */}
                {[
                  [leftX, topY + scaffoldDrop * 0.3],
                  [rightX, topY + scaffoldDrop * 0.3],
                  [leftX, botY + scaffoldDrop],
                  [rightX, botY + scaffoldDrop],
                ].map(([jx, jy], ji) => (
                  <circle
                    key={`coupler-${ci}-${ji}`}
                    cx={jx}
                    cy={jy}
                    r={2.5}
                    fill="none"
                    stroke="rgba(200, 190, 160, 0.4)"
                    strokeWidth={1}
                  />
                ))}
              </g>
            )
          })}
        </svg>

        {/* Characters revealed as scaffold drops away */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((char, ci) => {
            const stagger = ci * 0.08
            const charSeed = Math.abs(seededRand(ci * 127.1 + index * 311.7))

            let charOpacity = 0
            let charScale = 1
            let charBlur = 0
            let yShift = 0

            if (phase === 'enter') {
              // Character hidden behind scaffold — fades in as scaffold completes assembly
              const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
              const scaffoldDone = easeOutBounce(t)
              // Character appears after scaffold is mostly built (after 70% of its build)
              const revealT = Math.max(0, (scaffoldDone - 0.7) / 0.3)
              charOpacity = revealT
              charBlur = (1 - revealT) * 3
              charScale = 0.9 + revealT * 0.1
            } else if (phase === 'hold') {
              charOpacity = 1
              // Breathing — subtle vertical bob like the building settling
              yShift = Math.sin(holdProgress * Math.PI * 5 + ci * 0.7 + charSeed * 2) * 1.5
              charScale = 1 + Math.sin(holdProgress * Math.PI * 3 + ci * 1.2) * 0.006
            } else {
              // Exit: scaffold is already gone — text crumbles downward like demolition
              const t = Math.max(0, Math.min(1, (exitProgress - stagger * 0.8) / (1 - stagger * 0.5)))
              const eased = easeInQuad(t)
              charOpacity = 1 - eased
              yShift = eased * (40 + charSeed * 30)
              charScale = 1 - eased * 0.3
              // Slight random rotation per char — debris tumble
              const rotAngle = eased * (seededRand(ci * 71 + index * 53) > 0.5 ? 1 : -1) * 15
              // Apply rotation via a wrapper below
            }

            // Compute exit rotation
            let exitRotation = 0
            if (phase === 'exit') {
              const t = Math.max(0, Math.min(1, (exitProgress - stagger * 0.8) / (1 - stagger * 0.5)))
              const eased = easeInQuad(t)
              exitRotation = eased * (seededRand(ci * 71 + index * 53) > 0.5 ? 1 : -1) * 15
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                  fontSize: `clamp(32px, 10vw, ${fontSize}px)`,
                  fontWeight: 800,
                  color,
                  opacity: charOpacity,
                  transform: `translateY(${yShift}px) scale(${charScale}) rotate(${exitRotation}deg)`,
                  filter: charBlur > 0.1 ? `blur(${charBlur}px)` : undefined,
                  textShadow: `0 2px 8px ${color}20`,
                  letterSpacing: '0.02em',
                }}
              >
                {char}
              </span>
            )
          })}
        </div>

        {/* Construction progress bar at bottom */}
        {phase !== 'exit' && (
          <div
            style={{
              position: 'absolute',
              bottom: height * 0.1,
              left: width * 0.2,
              right: width * 0.2,
              height: 3,
              background: 'rgba(180, 170, 140, 0.08)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width:
                  phase === 'enter'
                    ? `${easeOutExpo(enterProgress) * 100}%`
                    : '100%',
                background: `linear-gradient(90deg, rgba(200, 170, 40, 0.3), ${color}40)`,
                borderRadius: 2,
                transition: 'none',
              }}
            />
          </div>
        )}
      </div>
    )
  },
}

function ScaffoldingRevealComponent(props: MotionGraphicProps<ScaffoldingRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scaffolding-reveal',
  title: 'Scaffolding Reveal',
  description:
    'Steel scaffold bars assemble around each character with bounce physics, then drop away under gravity to reveal the text beneath — like a building facade unveiled during construction.',
  tags: [
    'kinetic',
    'typography',
    'scaffolding',
    'construction',
    'architecture',
    'reveal',
    'building',
    'spatial',
    'demolition',
    'steel',
  ],
  category: 'captions',
  component: ScaffoldingRevealComponent as any,
  defaultConfig: {
    words: ['BUILD', 'RAISE', 'UNVEIL', 'OPEN'],
    colors: ['#E8D5A0', '#D4C080', '#C8B470', '#E0C890'],
    bgColor: '#12110E',
    cycleDuration: 1.5,
    scaffoldColor: '#B4AA8C',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BUILD', 'RAISE', 'UNVEIL', 'OPEN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8D5A0', '#D4C080', '#C8B470', '#E0C890'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12110E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'scaffoldColor',
      label: 'Scaffold Color',
      type: 'color',
      defaultValue: '#B4AA8C',
      group: 'Style',
    },
  ],
})
