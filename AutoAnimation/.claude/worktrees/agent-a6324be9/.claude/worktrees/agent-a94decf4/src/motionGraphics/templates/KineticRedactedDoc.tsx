import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RedactedDocConfig extends KineticBaseConfig {
  redactColor: string
}

// Easing: overshoot that settles wrong — like something snapping into place under duress
function easeOutBackHard(t: number): number {
  const c1 = 2.2
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Exit: disappears fast then slows, like a file being yanked
function easeInQuartSnap(t: number): number {
  return t * t * t * t
}

function seededRand(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Document page lines — aged government paper feel
    const lineCount = 14
    const lineSpacing = height / (lineCount + 1)

    // Slow paper-fiber shimmer
    const shimmer = 0.5 + Math.sin(time * 0.4) * 0.08

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Aged paper texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(170deg, rgba(40,35,25,${shimmer * 0.06}) 0%, transparent 50%, rgba(30,20,10,${shimmer * 0.08}) 100%)`,
          }}
        />

        {/* Document ruled lines — faint, creates the "classified document" context */}
        {Array.from({ length: lineCount }, (_, i) => {
          const y = lineSpacing * (i + 1)
          const lineOpacity = 0.04 + seededRand(i * 7 + 3) * 0.03
          // Some lines are "redacted" — replaced with solid black bars
          const isRedacted = seededRand(i * 13 + 7) > 0.72
          if (isRedacted) {
            const barWidth = (0.3 + seededRand(i * 5 + 1) * 0.5) * width
            const barX = seededRand(i * 3 + 2) * (width - barWidth)
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: barX,
                  top: y - 5,
                  width: barWidth,
                  height: 11,
                  background: 'rgba(0,0,0,0.65)',
                }}
              />
            )
          }
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '5%',
                right: '5%',
                top: y,
                height: 1,
                background: `rgba(100,90,70,${lineOpacity})`,
              }}
            />
          )
        })}

        {/* Classification stamp — top */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            fontWeight: 700,
            color: `rgba(120,0,0,${0.25 + Math.sin(time * 0.3) * 0.05})`,
            letterSpacing: 6,
            textTransform: 'uppercase',
            border: '1px solid rgba(120,0,0,0.18)',
            padding: '2px 10px',
          }}
        >
          CLASSIFIED
        </div>

        {/* Bottom classification repeat */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            fontWeight: 700,
            color: 'rgba(120,0,0,0.18)',
            letterSpacing: 6,
          }}
        >
          CLASSIFIED
        </div>

        {/* Document fold crease — slightly off-center */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '48%',
            width: 1,
            background: 'linear-gradient(180deg, transparent, rgba(80,70,50,0.06) 20%, rgba(80,70,50,0.06) 80%, transparent)',
          }}
        />

        {/* Vignette — keeps it from feeling clean */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)',
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
    const fontSize = Math.min(width / (totalChars * 0.62), 144)
    const time = (frame ?? 0) / (fps ?? 30)

    // Hold phase: surveillance micro-drift — like watching a printed photo under a lamp
    const driftX = Math.sin(time * 0.9 + index * 1.3) * 1.2
    const driftY = Math.sin(time * 1.4 + index * 2.1) * 0.8

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`,
            display: 'flex',
            gap: 1,
          }}
        >
          {chars.map((char, ci) => {
            // Characters unredact in sequence — left to right, each sliding out from under black bar
            const stagger = ci * 0.07
            let opacity = 0
            let clipPath = 'inset(0 100% 0 0)'
            let translateX = 0
            let translateY = 0
            let charOpacity = 1

            // Redaction bar dimensions per char (covers the character)
            let redactBarWidth = 0
            let redactBarOpacity = 0

            if (phase === 'enter') {
              const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.7)))
              const eased = easeOutBackHard(Math.min(1, t))
              // Clip reveals from left — like the redaction bar is being slid off
              clipPath = `inset(0 ${Math.max(0, (1 - eased) * 100)}% 0 0)`
              opacity = 1
              // Redaction bar slides right as char is revealed
              redactBarWidth = (1 - Math.min(1, eased)) * 100
              redactBarOpacity = 1 - eased
            } else if (phase === 'hold') {
              clipPath = 'inset(0 0% 0 0)'
              opacity = 1
              // Unsettling micro-drift — breathing surveillance feel
              translateX = driftX + Math.sin(time * 3.1 + ci * 0.5) * 0.3
              translateY = driftY + Math.sin(time * 2.3 + ci * 0.8) * 0.3
              // Very occasional single-char reblack — like the redaction is fighting back
              const reRedact = seededRand(Math.floor(time * 6) + ci * 13 + index * 7) > 0.96
              charOpacity = reRedact ? 0.05 : 1
            } else {
              // Exit: chars get re-redacted — black bar slams back over each from right to left
              const reverseStagger = (totalChars - 1 - ci) * 0.055
              const t = Math.max(0, Math.min(1, (exitProgress - reverseStagger) / (1 - reverseStagger * 0.6)))
              const eased = easeInQuartSnap(t)
              clipPath = `inset(0 ${eased * 100}% 0 0)`
              opacity = 1
              redactBarWidth = eased * 100
              redactBarOpacity = eased
            }

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  transform: `translate(${translateX}px, ${translateY}px)`,
                }}
              >
                {/* The actual character */}
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Courier New', 'Courier', monospace",
                    fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    opacity: opacity * charOpacity,
                    clipPath,
                    textShadow: `0 0 8px ${color}40`,
                    transition: 'none',
                    willChange: 'clip-path',
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>

                {/* Redaction bar — black rectangle that slides */}
                {redactBarOpacity > 0.02 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '5%',
                      right: 0,
                      width: `${redactBarWidth}%`,
                      height: '90%',
                      background: '#000000',
                      opacity: redactBarOpacity,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Stamped CLASSIFIED bar overlay during hold — barely legible */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '5%',
              right: '5%',
              transform: 'translateY(-50%) rotate(-2deg)',
              height: fontSize * 1.05,
              border: `2px solid rgba(120,0,0,${0.08 + seededRand(Math.floor(time * 3)) * 0.04})`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function RedactedDocComponent(props: MotionGraphicProps<RedactedDocConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-redacted-doc',
  title: 'Redacted Document',
  description:
    'Classified government document aesthetic. Characters reveal themselves by sliding out from under black redaction bars (enter), hold with surveillance micro-drift and occasional re-redaction, then bars slam back over them (exit). Aged paper texture, ruled lines, CLASSIFIED stamp. Built for: EXPOSED, HIDDEN FILES, THEY HID THIS.',
  tags: [
    'kinetic',
    'typography',
    'dark',
    'conspiracy',
    'classified',
    'redacted',
    'document',
    'thriller',
    'true-crime',
    'dystopian',
    'mysterious',
    'moody',
  ],
  category: 'captions',
  component: RedactedDocComponent as any,
  defaultConfig: {
    words: ['CLASSIFIED', 'HIDDEN', 'EXPOSED', 'DELETED'],
    colors: ['#c8b89a', '#b0a080', '#c8b89a', '#d0c0a8'],
    bgColor: '#0c0a07',
    cycleDuration: 1.5,
    redactColor: '#000000',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CLASSIFIED', 'HIDDEN', 'EXPOSED', 'DELETED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Text Colors',
      type: 'text-array',
      defaultValue: ['#c8b89a', '#b0a080', '#c8b89a', '#d0c0a8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0a07', group: 'Style' },
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
      key: 'redactColor',
      label: 'Redaction Bar Color',
      type: 'color',
      defaultValue: '#000000',
      group: 'Style',
    },
  ],
})
