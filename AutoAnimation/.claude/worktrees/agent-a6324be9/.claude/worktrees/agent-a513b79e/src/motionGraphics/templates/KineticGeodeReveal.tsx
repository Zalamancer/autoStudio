import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GeodeRevealConfig extends KineticBaseConfig {
  crystalColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Deterministic random [0,1] from seed
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Build a rough polygon path simulating an irregular geode shell
function geodeOutline(seed: number, points: number): string {
  const pts: string[] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2
    const r = 48 + rand(seed + i * 7) * 8 - 4
    const x = 50 + Math.cos(angle) * r
    const y = 50 + Math.sin(angle) * r * 0.85
    pts.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }
  return `polygon(${pts.join(', ')})`
}

// Inner crystal cavity — smaller, more irregular
function geodeCavity(seed: number, points: number, scale: number): string {
  const pts: string[] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2
    const r = 28 + rand(seed + i * 13 + 51) * 10 - 5
    const x = 50 + Math.cos(angle) * r * scale
    const y = 50 + Math.sin(angle) * r * scale * 0.9
    pts.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }
  return `polygon(${pts.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        // Subtle rocky texture: fine repeating diagonal lines
        backgroundImage: `
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 6px,
            rgba(255,255,255,0.012) 6px,
            rgba(255,255,255,0.012) 7px
          ),
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 9px,
            rgba(0,0,0,0.018) 9px,
            rgba(0,0,0,0.018) 10px
          )
        `,
      }}
    >
      {/* Ambient mineral glow at center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: Math.min(width, height) * 0.8,
          height: Math.min(width, height) * 0.5,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(160,100,220,0.06), transparent 65%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const seed = index * 89 + 37
    const t = (frame ?? 0) / 30

    // --- ENTER: shell cracks open, revealing crystal interior ---
    // Phase 1 (0–0.4): rough outer shell materializes
    // Phase 2 (0.4–0.7): crack propagates (clipPath opens)
    // Phase 3 (0.7–1.0): text crystallizes inside cavity

    let shellOpacity = 0
    let cavityScale = 0
    let textOpacity = 0
    let textScale = 1
    let textGlow = 0
    let exitShift = 0
    let exitBlur = 0

    if (phase === 'enter') {
      const shellP = Math.min(1, enterProgress / 0.45)
      const crackP = Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3))
      const revealP = Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3))

      shellOpacity = easeOutExpo(shellP)
      cavityScale = easeOutBack(crackP)
      textOpacity = easeOutExpo(revealP)
      textGlow = revealP * 1.5
      textScale = 0.85 + easeOutBack(Math.min(1, revealP * 1.2)) * 0.15
    } else if (phase === 'hold') {
      shellOpacity = 1
      cavityScale = 1
      textOpacity = 1
      textScale = 1
      // Gentle inner glow pulse — crystal breathing light
      textGlow = 0.6 + Math.sin(t * 2.8 + index * 1.3) * 0.4
    } else {
      // EXIT: geode snaps shut — shell halves close inward
      const ep = easeInQuad(exitProgress)
      shellOpacity = 1 - ep * 0.3
      cavityScale = Math.max(0, 1 - easeInQuad(exitProgress * 1.3))
      textOpacity = Math.max(0, 1 - ep * 1.4)
      exitShift = ep * 30
      exitBlur = ep * 8
    }

    // Crack line: a jagged polygon split that opens vertically
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Outer geode shell — rough rocky exterior */}
        {shellOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%)`,
              width: '78%',
              height: '55%',
              opacity: shellOpacity,
            }}
          >
            {/* Left shell half — slides left on exit */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)',
                transform: `translateX(${-exitShift}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, #5C4033, #3D2B1F)`,
                  clipPath: geodeOutline(seed, 12),
                  boxShadow: `inset 2px 2px 8px rgba(0,0,0,0.5)`,
                }}
              />
            </div>
            {/* Right shell half — slides right on exit */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                transform: `translateX(${exitShift}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(315deg, #5C4033, #3D2B1F)`,
                  clipPath: geodeOutline(seed + 100, 12),
                  boxShadow: `inset -2px 2px 8px rgba(0,0,0,0.5)`,
                }}
              />
            </div>

            {/* Crystal cavity — inner purple amethyst lining */}
            {cavityScale > 0.01 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: geodeCavity(seed + 200, 16, cavityScale),
                  background: `radial-gradient(ellipse at 45% 40%, #C39BD3, #7D3C98 45%, #4A235A 75%, #2C1A40)`,
                  filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
                }}
              >
                {/* Druzy crystal points: tiny white/purple glints */}
                {Array.from({ length: 10 }, (_, i) => {
                  const cx = 20 + rand(seed + i * 31) * 60
                  const cy = 20 + rand(seed + i * 47) * 60
                  const sz = 2 + rand(seed + i * 61) * 4
                  const glow = 0.3 + Math.sin(t * 3 + i * 1.1) * 0.2
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${cx}%`,
                        top: `${cy}%`,
                        width: sz,
                        height: sz * 2.5,
                        background: `rgba(255,255,255,${glow})`,
                        clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                        transform: `rotate(${rand(seed + i * 19) * 360}deg)`,
                        filter: `blur(${0.3}px)`,
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* The word — revealed inside the crystal cavity */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: textOpacity,
            filter: [exitBlur > 0 ? `blur(${exitBlur * 0.5}px)` : ''].filter(Boolean).join(' ') || undefined,
            whiteSpace: 'nowrap',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 8vw, 110px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color,
            textShadow:
              textGlow > 0.1 ? `0 0 ${12 * textGlow}px ${color}cc, 0 0 ${30 * textGlow}px ${color}55` : undefined,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function GeodeRevealComponent(props: MotionGraphicProps<GeodeRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-geode-reveal',
  title: 'Geode Reveal',
  description:
    'A rough stone geode cracks open — the rocky outer shell splits apart to unveil an amethyst crystal cavity within. The word materializes inside the druzy interior as crystal points catch light.',
  tags: ['kinetic', 'typography', 'geode', 'crystal', 'geology', 'reveal', 'amethyst', 'mineral', 'crack', 'gemstone'],
  category: 'captions',
  component: GeodeRevealComponent as any,
  defaultConfig: {
    words: ['DEEP', 'HIDDEN', 'FOUND', 'CORE'],
    colors: ['#E8D5FF', '#D4B8F0', '#F0E0FF', '#C8A8E8'],
    bgColor: '#1A0E24',
    cycleDuration: 2.0,
    crystalColor: '#9B59B6',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DEEP', 'HIDDEN', 'FOUND', 'CORE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8D5FF', '#D4B8F0', '#F0E0FF', '#C8A8E8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0E24', group: 'Style' },
    { key: 'crystalColor', label: 'Crystal Color', type: 'color', defaultValue: '#9B59B6', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
  ],
})
