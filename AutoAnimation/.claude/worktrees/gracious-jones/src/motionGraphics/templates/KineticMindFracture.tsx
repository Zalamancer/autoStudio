import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MindFractureConfig extends KineticBaseConfig {
  splitCount: number
}

// Ease-out with a final micro-tremble — tension not fully released
function easeOutTremor(t: number): number {
  const base = 1 - Math.pow(1 - t, 3)
  // Add small tremble in the last 15%
  const tremble = t > 0.85 ? Math.sin((t - 0.85) / 0.15 * Math.PI * 6) * 0.012 * (1 - (t - 0.85) / 0.15) : 0
  return Math.min(1, base + tremble)
}

// Asymmetric ease: fast in, slow predatory exit
function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function seededRand(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Web of fracture lines — static, like a cracked screen or broken mind
    // Lines radiate from off-center point (feels intentionally wrong)
    const crackOriginX = width * 0.52
    const crackOriginY = height * 0.47
    const crackCount = 7

    // Slow pulse on the cracks — like the screen is under pressure
    const crackPulse = 0.5 + Math.sin(time * 0.7) * 0.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark radial gradient — pressure point at crack origin */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${crackOriginX}px ${crackOriginY}px, rgba(40,20,60,${0.3 * crackPulse}) 0%, rgba(0,0,0,0) 50%)`,
          }}
        />

        {/* Fracture lines via SVG */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {Array.from({ length: crackCount }, (_, i) => {
            const angle = (i / crackCount) * Math.PI * 2 + seededRand(i * 3) * 0.8
            const length = (0.3 + seededRand(i * 7 + 1) * 0.5) * Math.min(width, height) * 0.7
            const jog = (seededRand(i * 5 + 2) - 0.5) * 0.3

            // Each crack is two segments with a jog — looks organic not geometric
            const midDist = length * (0.3 + seededRand(i * 11) * 0.4)
            const midX = crackOriginX + Math.cos(angle) * midDist + Math.sin(angle) * jog * midDist
            const midY = crackOriginY + Math.sin(angle) * midDist - Math.cos(angle) * jog * midDist
            const endX = crackOriginX + Math.cos(angle) * length
            const endY = crackOriginY + Math.sin(angle) * length

            const baseOpacity = (0.06 + seededRand(i * 9 + 4) * 0.06) * (0.8 + crackPulse * 0.2)

            return (
              <g key={i}>
                <line
                  x1={crackOriginX}
                  y1={crackOriginY}
                  x2={midX}
                  y2={midY}
                  stroke={`rgba(80,0,120,${baseOpacity})`}
                  strokeWidth={0.8}
                />
                <line
                  x1={midX}
                  y1={midY}
                  x2={endX}
                  y2={endY}
                  stroke={`rgba(80,0,120,${baseOpacity * 0.7})`}
                  strokeWidth={0.5}
                />
              </g>
            )
          })}
          {/* Central fracture point — small dot of concentrated unease */}
          <circle
            cx={crackOriginX}
            cy={crackOriginY}
            r={2}
            fill={`rgba(120,0,180,${0.15 + crackPulse * 0.1})`}
          />
        </svg>

        {/* Vignette — deep and asymmetric */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 48% 47%, transparent 20%, rgba(0,0,0,0.75) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle purple haze at top — like something emanating */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(40,0,60,${0.12 + Math.sin(time * 0.5) * 0.04}) 0%, transparent 30%)`,
          }}
        />

        {/* Fine horizontal scan interference — barely there */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(40,0,60,0.015) 4px, rgba(40,0,60,0.015) 5px)',
            pointerEvents: 'none',
          }}
        />
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
    const fontSize = Math.min(width / (totalChars * 0.56), 152)
    const time = (frame ?? 0) / (fps ?? 30)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Render the word as two split halves — upper and lower — that come apart during hold */}
        {(['top', 'bottom'] as const).map((half) => {
          const isTop = half === 'top'
          // How much the halves split apart — during hold, they breathe open slightly
          let splitOffset = 0
          let halfOpacity = 1
          let halfBlur = 0
          let translateX = 0
          let scaleX = 1
          let overallTranslateY = 0

          if (phase === 'enter') {
            // Halves arrive from opposite sides and meet in the middle — unsettling collision
            const dirMult = isTop ? -1 : 1
            const t = Math.max(0, Math.min(1, enterProgress))
            const eased = easeOutTremor(t)
            overallTranslateY = dirMult * (1 - eased) * (fontSize * 1.2)
            halfOpacity = Math.min(1, t * 2)
            scaleX = 0.7 + eased * 0.3
            halfBlur = (1 - eased) * 4
            // After collision: tiny tremble lingers (handled by easeOutTremor)
            splitOffset = eased > 0.95 ? (1 - eased) * fontSize * 0.05 * dirMult : 0
          } else if (phase === 'hold') {
            // Halves breathe apart — like a mind cracking open, slow and wrong
            const breathFreq = 1.8
            const breathe = (Math.sin(time * breathFreq * Math.PI * 2) + 1) * 0.5
            const dirMult = isTop ? -1 : 1
            splitOffset = dirMult * breathe * (fontSize * 0.06)
            halfOpacity = 1
            // Very slow lateral micro-drift — paranoia
            translateX = Math.sin(time * 0.6 + (isTop ? 0.3 : 1.4)) * 1.5
          } else {
            // Exit: halves fracture apart — top flies up, bottom falls
            const dirMult = isTop ? -1 : 1
            const t = Math.max(0, Math.min(1, exitProgress))
            const eased = easeInExpo(t)
            overallTranslateY = dirMult * eased * (fontSize * 2.5)
            halfOpacity = 1 - eased
            halfBlur = eased * 5
            scaleX = 1 + eased * 0.2
          }

          return (
            <div
              key={half}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${overallTranslateY + splitOffset}px)) translateX(${translateX}px) scaleX(${scaleX})`,
                display: 'flex',
                gap: 1,
                overflow: 'hidden',
                height: fontSize * 0.6,
                alignItems: isTop ? 'flex-end' : 'flex-start',
                opacity: halfOpacity,
                filter: halfBlur > 0.1 ? `blur(${halfBlur}px)` : 'none',
              }}
            >
              {chars.map((char, ci) => {
                // Per-char stagger adds unease on enter
                const charStagger = ci * 0.025
                let charTranslateX = 0

                if (phase === 'enter') {
                  // Chars within each half have slight horizontal jitter on arrival
                  const t2 = Math.max(0, Math.min(1, enterProgress - charStagger))
                  charTranslateX = (1 - easeOutTremor(t2)) * (seededRand(ci * 7 + index * 3) - 0.5) * 8
                } else if (phase === 'hold') {
                  // Micro-stagger wobble per char — barely perceptible, adds to unease
                  charTranslateX = Math.sin(time * 2.7 + ci * 0.9 + index * 1.7) * 0.4
                }

                return (
                  <span
                    key={ci}
                    style={{
                      display: 'inline-block',
                      fontFamily: "'Arial Black', 'Impact', sans-serif",
                      fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
                      fontWeight: 900,
                      color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      transform: `translateX(${charTranslateX}px)`,
                      textShadow: `0 0 10px ${color}50, 0 0 25px ${color}20`,
                      transition: 'none',
                      userSelect: 'none',
                      lineHeight: 1,
                      // Force the clipping — top half shows bottom of glyph, bottom half shows top
                      // via the parent overflow:hidden + height + alignment
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                )
              })}
            </div>
          )
        })}

        {/* Fracture line between the halves — visible only during hold breathing */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              right: '10%',
              height: 1,
              transform: 'translateY(-50%)',
              background: `linear-gradient(90deg, transparent, rgba(80,0,120,${0.15 + Math.sin(time * 1.8 * Math.PI * 2) * 0.1}), transparent)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function MindFractureComponent(props: MotionGraphicProps<MindFractureConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mind-fracture',
  title: 'Mind Fracture',
  description:
    'Dystopian/psychological horror kinetic type. Each word is split into top and bottom halves that collide on enter with a micro-tremble, breathe apart during hold like a fracturing mind, then fly apart violently on exit. Background has a web of crack lines radiating from an off-center pressure point. Built for: BREAKING, CONSPIRACY, THEY LIED, NOTHING IS REAL.',
  tags: [
    'kinetic',
    'typography',
    'dark',
    'dystopian',
    'horror',
    'psychological',
    'conspiracy',
    'split',
    'fracture',
    'thriller',
    'moody',
    'mysterious',
    'ominous',
  ],
  category: 'captions',
  component: MindFractureComponent as any,
  defaultConfig: {
    words: ['NOTHING', 'IS REAL', 'THEY LIED', 'WAKE UP'],
    colors: ['#9966cc', '#7744aa', '#b088ee', '#8855bb'],
    bgColor: '#060408',
    cycleDuration: 1.4,
    splitCount: 2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['NOTHING', 'IS REAL', 'THEY LIED', 'WAKE UP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#9966cc', '#7744aa', '#b088ee', '#8855bb'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060408', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'splitCount',
      label: 'Split Count',
      type: 'number',
      defaultValue: 2,
      min: 2,
      max: 2,
      group: 'Animation',
    },
  ],
})
