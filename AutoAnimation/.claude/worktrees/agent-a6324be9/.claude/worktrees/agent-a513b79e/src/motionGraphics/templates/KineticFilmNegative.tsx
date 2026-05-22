import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmNegativeConfig extends KineticBaseConfig {}

// Ease functions
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * KineticFilmNegative
 * Text enters as a film negative — colors fully inverted (invert(1)), orange-tinted
 * background like an unprinted negative strip. At the peak of the enter phase a
 * bright "contact-print flash" triggers and the inversion snaps to positive.
 * Exit reverses: fades back into the negative with a low-contrast wash.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Orange-brown negative strip base; subtle ambient flicker
    const flicker = 0.97 + Math.sin(t * 47.3) * 0.03
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Film edge rebate — thin orange strip */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            90deg,
            rgba(255,160,30,0.04) 0px,
            rgba(255,160,30,0.04) 18px,
            transparent 18px,
            transparent 36px
          )`,
          opacity: flicker,
        }} />
        {/* Sprocket holes top */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`t${i}`} style={{
            position: 'absolute',
            top: 5,
            left: `${8 + i * 11.5}%`,
            width: 10,
            height: 7,
            borderRadius: 2,
            border: '1px solid rgba(255,160,30,0.18)',
          }} />
        ))}
        {/* Sprocket holes bottom */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`b${i}`} style={{
            position: 'absolute',
            bottom: 5,
            left: `${8 + i * 11.5}%`,
            width: 10,
            height: 7,
            borderRadius: 2,
            border: '1px solid rgba(255,160,30,0.18)',
          }} />
        ))}
        {/* Film edge label */}
        <div style={{
          position: 'absolute',
          top: 7,
          left: '2%',
          fontFamily: 'monospace',
          fontSize: 7,
          color: 'rgba(255,160,30,0.25)',
          letterSpacing: 2,
        }}>
          KODAK  5400T  ▷  135-36
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Phase: enter — show as negative, flash into positive at enterProgress≈0.75
    // hold — fully positive, slight breathe
    // exit — inversion creeps back in

    // Flash threshold: at 75% of enter, a bright white flash fires and flips inversion
    const FLASH_AT = 0.75

    let invertVal = 0
    let brightness = 1
    let opacity = 1
    let flashOpacity = 0
    let contrast = 1
    let sepia = 0

    if (phase === 'enter') {
      if (enterProgress < FLASH_AT) {
        // Still a negative: invert(1), orange-ish hue shift
        const negP = enterProgress / FLASH_AT
        invertVal = 1
        sepia = 0.4 * (1 - negP * 0.5)
        brightness = 0.6 + negP * 0.5        // negative starts dim, brightens to flash
        contrast = 0.8 + negP * 0.5
        opacity = 0.3 + negP * 0.7
        flashOpacity = 0
      } else {
        // Flash and flip to positive
        const flashP = (enterProgress - FLASH_AT) / (1 - FLASH_AT)
        invertVal = 0
        brightness = 1 + (1 - flashP) * 2.5   // bright peak then normalises
        contrast = 1 + (1 - flashP) * 0.5
        flashOpacity = Math.max(0, 1 - flashP * 2.5)
        opacity = 1
        sepia = 0
      }
    } else if (phase === 'hold') {
      invertVal = 0
      brightness = 1
      opacity = 1
      // Gentle luminance breathe
      const breathe = Math.sin(holdProgress * Math.PI * 2) * 0.03
      brightness = 1 + breathe
    } else {
      // Exit: positive fades back into negative
      const ep = easeInQuad(exitProgress)
      invertVal = ep
      sepia = ep * 0.4
      brightness = 1 - ep * 0.3
      contrast = 1 - ep * 0.2
      opacity = 1 - ep * 0.6
    }

    const filterStr = [
      invertVal > 0.01 ? `invert(${invertVal.toFixed(3)})` : '',
      sepia > 0.01 ? `sepia(${sepia.toFixed(3)})` : '',
      `brightness(${brightness.toFixed(3)})`,
      `contrast(${contrast.toFixed(3)})`,
    ].filter(Boolean).join(' ')

    return (
      <>
        {/* Contact-print flash overlay */}
        {flashOpacity > 0.01 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'white',
            opacity: flashOpacity,
            pointerEvents: 'none',
          }} />
        )}

        {/* The text itself */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: filterStr,
        }}>
          <div style={{
            fontFamily: "'Helvetica Neue', Helvetica, 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: phase === 'enter' && enterProgress < FLASH_AT
              ? '#F8A030'   // negative strip colour
              : color,      // true positive colour
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}>
            {word}
          </div>
        </div>

        {/* NEG / POS badge */}
        <div style={{
          position: 'absolute',
          bottom: '14%',
          right: '8%',
          fontFamily: 'monospace',
          fontSize: 'clamp(9px, 2vw, 14px)',
          letterSpacing: 2,
          color: invertVal > 0.5 ? 'rgba(255,160,30,0.4)' : `${color}44`,
          opacity: Math.min(opacity * 1.2, 1),
        }}>
          {invertVal > 0.5 ? '◼ NEG' : '◻ POS'}
        </div>
      </>
    )
  },
}

function FilmNegativeComponent(props: MotionGraphicProps<FilmNegativeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-negative',
  title: 'Film Negative',
  description: 'Text enters as an inverted film negative with orange cast, then a contact-print flash fires and snaps it to a sharp positive. Exit reverses back into the negative.',
  tags: ['kinetic', 'typography', 'film', 'negative', 'invert', 'photography', 'darkroom', 'flash', 'analog'],
  category: 'captions',
  component: FilmNegativeComponent as any,
  defaultConfig: {
    words: ['NEGATIVE', 'EXPOSURE', 'POSITIVE', 'DEVELOP'],
    colors: ['#f0ece4', '#e8e2d8', '#ffffff', '#ddd8cc'],
    bgColor: '#1a1208',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEGATIVE', 'EXPOSURE', 'POSITIVE', 'DEVELOP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f0ece4', '#e8e2d8', '#ffffff', '#ddd8cc'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1208', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.6, max: 5, group: 'Timing' },
  ],
})
