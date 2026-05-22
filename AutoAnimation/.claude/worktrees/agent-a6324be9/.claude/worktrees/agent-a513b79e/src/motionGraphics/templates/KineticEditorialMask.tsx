import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EditorialMaskConfig extends KineticBaseConfig {
  accentColor: string
}

/* ---------- Easing curves ---------- */

// Guillotine drop — razor sharp then decelerates
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Ink bleeding out — ease in
function easeInCubic(t: number): number {
  return t * t * t
}

// Elegant settle with just a whisper of overshoot
function easeOutBack(t: number): number {
  const c1 = 1.0
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fine typographic grid — 12-column editorial layout ghost */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.018) 0px,
              rgba(255,255,255,0.018) 1px,
              transparent 1px,
              transparent ${width / 12}px
            )`,
            backgroundSize: `${width / 12}px 100%`,
          }}
        />

        {/* Top masthead hairline */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: width * 0.08,
            right: width * 0.08,
            height: '0.5px',
            background: `rgba(255,255,255,${0.12 + Math.sin(time * 0.5) * 0.03})`,
          }}
        />

        {/* Bottom caption line */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: width * 0.08,
            right: width * 0.08,
            height: '0.5px',
            background: `rgba(255,255,255,${0.08 + Math.sin(time * 0.5 + 1) * 0.02})`,
          }}
        />

        {/* Issue number / folio text */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: width * 0.08,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 8,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.14)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          NO. 01
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: width * 0.08,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 8,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.14)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            textAlign: 'right',
          }}
        >
          EDITORIAL
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
    const fontSize = Math.min(width / (totalChars * 0.55), 150)

    // The mask is a horizontal clip-path that rises from the baseline to reveal text.
    // A thin accent line precedes the reveal — like a scalpel cut on a magazine spread.
    const maskProgress =
      phase === 'enter'
        ? easeOutExpo(enterProgress)
        : phase === 'hold'
        ? 1
        : 1 - easeInCubic(exitProgress)

    // Accent line — thin rule that animates left-to-right just before text appears
    const accentLineProgress =
      phase === 'enter'
        ? easeOutExpo(Math.min(1, enterProgress * 1.8))
        : phase === 'hold'
        ? 1
        : 1 - easeInCubic(exitProgress)

    const textBlockH = fontSize * 1.2
    const textTop = height / 2 - textBlockH / 2
    const textBottom = height / 2 + textBlockH / 2

    // Clip height: reveal from bottom edge up
    const revealHeight = maskProgress * textBlockH
    const clipTop = textBottom - revealHeight

    // Hold: barely perceptible scale breath — composed, restrained
    const holdScale = phase === 'hold'
      ? 1 + Math.sin(holdProgress * Math.PI * 1.5) * 0.004
      : 1

    // Exit: entire block shifts up and fades out — editorial page turn
    const exitY = phase === 'exit' ? -easeInCubic(exitProgress) * 22 : 0
    const exitOpacity = phase === 'exit' ? 1 - easeInCubic(exitProgress) : 1

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Accent rule — draws across above the text block */}
        <div
          style={{
            position: 'absolute',
            top: textTop - 10,
            left: width * 0.12,
            height: '1px',
            width: `${accentLineProgress * (width * 0.76)}px`,
            background: color,
            opacity: 0.7,
          }}
        />

        {/* Word — revealed via clip-path from baseline upward */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${exitY}px)) scale(${holdScale})`,
            opacity: exitOpacity,
            clipPath: `inset(${clipTop - textTop}px 0px 0px 0px)`,
            willChange: 'clip-path, transform, opacity',
          }}
        >
          <span
            style={{
              display: 'block',
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              fontSize: `clamp(24px, 10vw, ${fontSize}px)`,
              fontWeight: 200,
              color,
              letterSpacing: '0.22em',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </span>
        </div>

        {/* Second hairline — draws below text after reveal completes */}
        {maskProgress > 0.85 && (
          <div
            style={{
              position: 'absolute',
              top: textBottom + 8,
              left: width * 0.12,
              height: '0.5px',
              width: `${((maskProgress - 0.85) / 0.15) * (width * 0.76)}px`,
              background: color,
              opacity: 0.25,
            }}
          />
        )}
      </div>
    )
  },
}

function EditorialMaskComponent(props: MotionGraphicProps<EditorialMaskConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-editorial-mask',
  title: 'Editorial Mask',
  description:
    'Thin accent rule draws across, then text is revealed upward from the baseline via a precise clip-path — like a scalpel cut on a Vogue spread. Ultra-light Helvetica weight, 12-column ghost grid, hairline rules. Fashion editorial and brand manifesto.',
  tags: [
    'kinetic',
    'typography',
    'editorial',
    'magazine',
    'luxury',
    'fashion',
    'reveal',
    'mask',
    'minimal',
    'vogue',
    'brand',
    'premium',
  ],
  category: 'captions',
  component: EditorialMaskComponent as any,
  defaultConfig: {
    words: ['VOGUE', 'COUTURE', 'SAVOIR', 'FAIRE'],
    colors: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#FFFFFF'],
    bgColor: '#0C0C0C',
    cycleDuration: 1.6,
    accentColor: '#FFFFFF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['VOGUE', 'COUTURE', 'SAVOIR', 'FAIRE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0C0C', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'accentColor',
      label: 'Accent Color',
      type: 'color',
      defaultValue: '#FFFFFF',
      group: 'Style',
    },
  ],
})
