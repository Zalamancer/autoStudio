import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UltrasoundRevealConfig extends KineticBaseConfig {}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Ultrasound speckle noise — deterministic grainy particles
    const speckles: { x: number; y: number; o: number; s: number }[] = []
    for (let i = 0; i < 80; i++) {
      const seed = i * 37 + Math.floor(t * 4) * 13
      speckles.push({
        x: pseudo(seed) * width,
        y: pseudo(seed + 1) * height,
        o: pseudo(seed + 2) * 0.08 + 0.02,
        s: pseudo(seed + 3) * 3 + 1,
      })
    }

    // Sweeping probe beam — fan-shaped sector scan
    const sweepAngle = Math.sin(t * 1.8) * 25

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sector scan cone overlay — the ultrasound field of view */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Fan-shaped imaging sector */}
          <defs>
            <radialGradient id="us-sector" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stopColor="rgba(160,200,220,0.06)" />
              <stop offset="60%" stopColor="rgba(100,160,200,0.03)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <path
            d={`M ${width / 2} 0 L ${width * 0.15} ${height} L ${width * 0.85} ${height} Z`}
            fill="url(#us-sector)"
          />

          {/* Depth ruler marks on the right edge */}
          {Array.from({ length: 8 }, (_, i) => {
            const y = (i + 1) * (height / 9)
            return (
              <g key={`dm-${i}`}>
                <line
                  x1={width - 20}
                  y1={y}
                  x2={width - 10}
                  y2={y}
                  stroke="rgba(100,180,220,0.2)"
                  strokeWidth={1}
                />
                <text
                  x={width - 8}
                  y={y + 3}
                  fill="rgba(100,180,220,0.15)"
                  fontSize={6}
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {i + 1}
                </text>
              </g>
            )
          })}

          {/* Sweeping scan line beam */}
          <line
            x1={width / 2}
            y1={0}
            x2={width / 2 + Math.tan((sweepAngle * Math.PI) / 180) * height}
            y2={height}
            stroke="rgba(120,200,240,0.12)"
            strokeWidth={2}
          />
        </svg>

        {/* Speckle noise layer */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}>
          {speckles.map((sp, i) => (
            <circle key={`sp-${i}`} cx={sp.x} cy={sp.y} r={sp.s} fill={`rgba(180,210,230,${sp.o})`} />
          ))}
        </svg>

        {/* CRT vignette for ultrasound monitor look */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Patient info overlay (top-left) */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 10,
            fontFamily: 'monospace',
            fontSize: 7,
            color: 'rgba(120,200,240,0.25)',
            letterSpacing: 1,
            lineHeight: '11px',
          }}
        >
          <div>FREQ: 3.5 MHz</div>
          <div>DEPTH: 12 cm</div>
          <div>GAIN: 72 dB</div>
        </div>

        {/* TGC curve indicator (right side) */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 30,
            fontFamily: 'monospace',
            fontSize: 7,
            color: 'rgba(120,200,240,0.2)',
          }}
        >
          2D MODE
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
    width,
    height,
    index,
    frame,
  }: WordRenderProps) => {
    const letters = word.split('')
    const fontSize = Math.min(width / (letters.length * 0.65), 120)
    const totalWidth = letters.length * fontSize * 0.65
    const startX = (width - totalWidth) / 2
    const f = frame ?? 0

    if (phase === 'enter') {
      // Probe sweep reveal: scan line moves left-to-right like a transducer
      // Each letter materializes from noisy speckle into clarity as the beam passes

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Scan beam line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${easeOutQuad(enterProgress) * 100}%`,
              width: 3,
              background: 'linear-gradient(180deg, transparent, rgba(120,200,240,0.25), transparent)',
              boxShadow: '0 0 12px rgba(120,200,240,0.15)',
            }}
          />

          {letters.map((letter, i) => {
            const letterNorm = i / Math.max(1, letters.length - 1)
            const delay = letterNorm * 0.6
            const charT = Math.max(0, Math.min(1, (enterProgress - delay) / 0.4))
            const revealT = easeOutQuad(charT)

            // Pre-reveal: noisy speckle blob
            const noiseOpacity = charT < 0.3 ? charT / 0.3 * 0.4 : Math.max(0, 0.4 * (1 - (charT - 0.3) / 0.7))
            // Letter clarity
            const letterOpacity = revealT
            // Ultrasound shimmer — slight vertical wobble
            const wobbleY = (1 - revealT) * (pseudo(i * 23 + 5) - 0.5) * 8
            const blurAmt = (1 - revealT) * 4

            return (
              <div key={i} style={{ position: 'absolute', left: startX + i * fontSize * 0.65, top: '50%' }}>
                {/* Speckle ghost behind each letter */}
                <div
                  style={{
                    position: 'absolute',
                    left: fontSize * 0.15,
                    top: -fontSize * 0.3,
                    width: fontSize * 0.5,
                    height: fontSize * 0.8,
                    borderRadius: '40%',
                    background: `radial-gradient(ellipse, rgba(160,210,230,${noiseOpacity}), transparent 70%)`,
                    transform: `translateY(${wobbleY}px)`,
                  }}
                />
                {/* Actual letter */}
                <div
                  style={{
                    transform: `translateY(calc(-50% + ${wobbleY}px))`,
                    fontFamily: "'Courier New', monospace",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color,
                    opacity: letterOpacity,
                    filter: `blur(${blurAmt}px)`,
                    textShadow: `0 0 6px rgba(120,200,240,${letterOpacity * 0.3})`,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}
                >
                  {letter}
                </div>
              </div>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Active hold: ultrasound probe micro-sweep — letters shimmer with speckle texture
      const sweepOffset = Math.sin(holdProgress * Math.PI * 4) * 1.5

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Subtle scanning beam oscillation */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `calc(50% + ${sweepOffset * 20}px)`,
              width: 2,
              background: 'linear-gradient(180deg, transparent, rgba(120,200,240,0.08), transparent)',
            }}
          />

          {letters.map((letter, i) => {
            // Speckle shimmer per character
            const shimmer = Math.sin(holdProgress * Math.PI * 6 + i * 1.7) * 0.08
            const microY = Math.sin(f * 0.12 + i * 0.9) * 0.8

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: startX + i * fontSize * 0.65,
                  top: '50%',
                  transform: `translateY(calc(-50% + ${microY}px))`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color,
                  opacity: 0.92 + shimmer,
                  textShadow: `0 0 8px rgba(120,200,240,0.25), 0 0 3px rgba(160,220,240,${0.15 + shimmer})`,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                {letter}
              </div>
            )
          })}

          {/* Echo depth indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'monospace',
              fontSize: 8,
              color: `${color}40`,
              letterSpacing: 2,
            }}
          >
            ECHO: {word} // DEPTH: 8.2cm
          </div>
        </div>
      )
    } else {
      // Exit: probe lifts off — letters dissolve back into speckle noise (mirrors enter)
      // Right-to-left dissolution (reverse of enter)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Receding scan beam */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${(1 - easeInQuad(exitProgress)) * 100}%`,
              width: 3,
              background: 'linear-gradient(180deg, transparent, rgba(120,200,240,0.2), transparent)',
            }}
          />

          {letters.map((letter, i) => {
            // Reverse stagger: last letter dissolves first
            const revI = letters.length - 1 - i
            const letterNorm = revI / Math.max(1, letters.length - 1)
            const delay = letterNorm * 0.5
            const charT = Math.max(0, Math.min(1, (exitProgress - delay) / 0.5))
            const dissolveT = easeInQuad(charT)

            const noiseOpacity = dissolveT > 0.3 && dissolveT < 0.9
              ? (dissolveT - 0.3) / 0.6 * 0.35
              : 0
            const letterOpacity = 1 - dissolveT
            const blurAmt = dissolveT * 5
            const wobbleY = dissolveT * (pseudo(i * 31 + 7) - 0.5) * 10

            return (
              <div key={i} style={{ position: 'absolute', left: startX + i * fontSize * 0.65, top: '50%' }}>
                {/* Dissolving speckle cloud */}
                <div
                  style={{
                    position: 'absolute',
                    left: fontSize * 0.15,
                    top: -fontSize * 0.3,
                    width: fontSize * 0.5,
                    height: fontSize * 0.8,
                    borderRadius: '40%',
                    background: `radial-gradient(ellipse, rgba(160,210,230,${noiseOpacity}), transparent 70%)`,
                    transform: `translateY(${wobbleY}px)`,
                  }}
                />
                <div
                  style={{
                    transform: `translateY(calc(-50% + ${wobbleY}px))`,
                    fontFamily: "'Courier New', monospace",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color,
                    opacity: letterOpacity,
                    filter: `blur(${blurAmt}px)`,
                    textShadow: `0 0 6px rgba(120,200,240,${letterOpacity * 0.2})`,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}
                >
                  {letter}
                </div>
              </div>
            )
          })}
        </div>
      )
    }
  },
}

function UltrasoundRevealComponent(props: MotionGraphicProps<UltrasoundRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ultrasound-reveal',
  title: 'Kinetic Ultrasound Reveal',
  description:
    'Ultrasound probe scan reveals text through speckle noise — letters materialize from grainy echoes as the beam sweeps across, with depth markers, sector cone, and TGC overlay. Dissolves back to speckle on exit.',
  tags: ['kinetic', 'typography', 'ultrasound', 'medical', 'scan', 'probe', 'imaging', 'sonography', 'speckle'],
  category: 'captions',
  component: UltrasoundRevealComponent as any,
  defaultConfig: {
    words: ['ECHO', 'SCAN', 'PULSE', 'DEPTH'],
    colors: ['#A0D4E8', '#88C8E0', '#B0DCF0', '#90CCE4'],
    bgColor: '#060D14',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ECHO', 'SCAN', 'PULSE', 'DEPTH'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#A0D4E8', '#88C8E0', '#B0DCF0', '#90CCE4'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060D14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
