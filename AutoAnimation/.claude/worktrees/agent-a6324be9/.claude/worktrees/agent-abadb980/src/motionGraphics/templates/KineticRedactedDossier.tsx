import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RedactedDossierConfig extends KineticBaseConfig {
  redactColor: string
}

/* ---------- Easing for classified-document reveal ---------- */

// Redaction bar slides off — crisp bureaucratic motion
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Text stamps down with authority
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Slow creep for tension before the reveal
function easeInQuad(t: number): number {
  return t * t
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return (Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Paper scan line — slow vertical drift
    const scanY = ((time * 18) % (height + 60)) - 30

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Aged paper texture — fine horizontal lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 4px,
              rgba(200, 190, 160, 0.018) 4px,
              rgba(200, 190, 160, 0.018) 5px
            )`,
          }}
        />

        {/* Faint ruled lines — dossier paper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 28px,
              rgba(180, 170, 140, 0.06) 28px,
              rgba(180, 170, 140, 0.06) 29px
            )`,
          }}
        />

        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Classified stamp — top right */}
          <text
            x={width - 20}
            y={32}
            textAnchor="end"
            fill="rgba(180, 30, 30, 0.18)"
            fontSize={10}
            fontFamily="'Courier New', monospace"
            fontWeight={700}
            letterSpacing={4}
            transform={`rotate(-8, ${width - 80}, 28)`}
          >
            TOP SECRET
          </text>
          <rect
            x={width - 160}
            y={18}
            width={142}
            height={20}
            fill="none"
            stroke="rgba(180, 30, 30, 0.12)"
            strokeWidth={1.5}
            transform={`rotate(-8, ${width - 80}, 28)`}
          />

          {/* Case number — faint header */}
          <text
            x={20}
            y={32}
            fill="rgba(160, 150, 120, 0.2)"
            fontSize={8}
            fontFamily="'Courier New', monospace"
            letterSpacing={3}
          >
            CASE NO. {Math.floor(seededRand(42) * 9000 + 1000)}-{Math.floor(seededRand(77) * 900 + 100)}
          </text>

          {/* Redacted stub lines — faint redacted paragraphs in background */}
          {Array.from({ length: 5 }, (_, i) => {
            const lineY = height * 0.7 + i * 22
            const lineW = width * (0.4 + Math.abs(seededRand(i * 13 + 7)) * 0.35)
            const lineX = width * 0.1
            return (
              <rect
                key={`stub-${i}`}
                x={lineX}
                y={lineY}
                width={lineW}
                height={9}
                fill={`rgba(10, 10, 10, ${0.35 + Math.abs(seededRand(i * 31 + 3)) * 0.1})`}
                rx={1}
              />
            )
          })}

          {/* Document scan line — photocopier CCD */}
          <line
            x1={0}
            y1={scanY}
            x2={width}
            y2={scanY}
            stroke="rgba(200, 210, 220, 0.035)"
            strokeWidth={2}
          />

          {/* File classification footer */}
          <text
            x={width / 2}
            y={height - 12}
            textAnchor="middle"
            fill="rgba(160, 150, 120, 0.18)"
            fontSize={7}
            fontFamily="'Courier New', monospace"
            letterSpacing={5}
          >
            EYES ONLY — DO NOT DUPLICATE
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
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.68), 145)

    // Redaction bar lifts upward revealing text per-character, left to right
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
          }}
        >
          {chars.map((char, ci) => {
            const stagger = ci * 0.09
            const charSeed = Math.abs(seededRand(ci * 127.1 + index * 311.7))

            // Redaction bar geometry
            let barScaleY = 1  // 1 = fully covers, 0 = fully lifted
            let charOpacity = 0
            let charY = 0
            let flickerOpacity = 1

            if (phase === 'enter') {
              const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
              const lifted = easeOutCubic(t)
              barScaleY = 1 - lifted
              // Text appears once bar is >60% lifted
              const textT = Math.max(0, (lifted - 0.6) / 0.4)
              charOpacity = easeOutBack(Math.min(1, textT * 1.2))
              charY = (1 - charOpacity) * 6
            } else if (phase === 'hold') {
              barScaleY = 0
              charOpacity = 1
              // Very subtle flicker — classified document unease
              flickerOpacity = 0.92 + Math.sin(holdProgress * Math.PI * 12 + ci * 0.7 + charSeed * 3) * 0.08
              charY = Math.sin(holdProgress * Math.PI * 2 + ci * 0.5) * 0.5
            } else {
              // Exit: redaction slams back down
              const t = Math.max(0, Math.min(1, (exitProgress - stagger * 0.6) / (1 - stagger * 0.5)))
              const slamT = easeInQuad(t)
              barScaleY = slamT
              charOpacity = 1 - easeOutCubic(Math.min(1, t * 2))
            }

            const barH = fontSize * 1.15
            const barW = fontSize * 0.72

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  width: barW,
                  height: barH,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* The text character underneath */}
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Courier New', 'Courier', monospace",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color,
                    opacity: charOpacity * flickerOpacity,
                    transform: `translateY(${charY}px)`,
                    textShadow: `0 0 20px ${color}40`,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {char}
                </span>

                {/* Redaction bar — slides up from bottom-anchor (transform-origin top) */}
                {barScaleY > 0.01 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(180deg, rgba(12, 12, 12, 0.97), rgba(8, 8, 8, 0.99))`,
                      transformOrigin: 'top center',
                      transform: `scaleY(${barScaleY})`,
                      // Small white edge highlight — physical redaction tape
                      boxShadow: `inset 0 -1px 0 rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.04)`,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* "DECLASSIFIED" stamp that fades in during hold */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              bottom: height * 0.14,
              left: '50%',
              transform: `translateX(-50%) rotate(-6deg)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(180, 30, 30, 0.35)',
              letterSpacing: 8,
              opacity: Math.min(1, holdProgress * 3),
              border: '1.5px solid rgba(180, 30, 30, 0.25)',
              padding: '3px 10px',
              whiteSpace: 'nowrap',
            }}
          >
            DECLASSIFIED
          </div>
        )}
      </div>
    )
  },
}

function RedactedDossierComponent(props: MotionGraphicProps<RedactedDossierConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-redacted-dossier',
  title: 'Redacted Dossier',
  description:
    'Classified document aesthetic: thick black redaction bars lift upward per character to reveal the word beneath, as if a dossier is being declassified in real time. Includes document scan line, case number, TOP SECRET stamp, and DECLASSIFIED reveal during hold.',
  tags: [
    'kinetic',
    'typography',
    'redacted',
    'classified',
    'dossier',
    'thriller',
    'documentary',
    'reveal',
    'tension',
    'cinematic',
    'mystery',
  ],
  category: 'captions',
  component: RedactedDossierComponent as any,
  defaultConfig: {
    words: ['THE TRUTH', 'IS EXPOSED', 'CLASSIFIED', 'REVEALED'],
    colors: ['#E8E0C8', '#D4CCB0', '#F0E8D0', '#E0D8C0'],
    bgColor: '#0C0B09',
    cycleDuration: 1.6,
    redactColor: '#0A0A0A',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['THE TRUTH', 'IS EXPOSED', 'CLASSIFIED', 'REVEALED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8E0C8', '#D4CCB0', '#F0E8D0', '#E0D8C0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0B09', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.4,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'redactColor',
      label: 'Redaction Color',
      type: 'color',
      defaultValue: '#0A0A0A',
      group: 'Style',
    },
  ],
})
