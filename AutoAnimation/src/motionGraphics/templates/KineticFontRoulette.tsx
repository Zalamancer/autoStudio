import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FontRouletteConfig extends KineticBaseConfig {
  spinCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Font Roulette — the word spins through a rapid succession of font families
 * like a slot machine, landing on a final typeface with a satisfying click.
 * Each frame shows a different font: monospace, script, condensed, slab,
 * display, sans. The spin accelerates then decelerates to land. During hold,
 * the chosen font is displayed with a confident static hold. Exit: one more
 * spin-through then fades.
 */

const FONT_ROULETTE = [
  { family: "'Courier New', monospace", weight: 400, label: 'mono' },
  { family: "'Impact', 'Arial Narrow', sans-serif", weight: 900, label: 'display' },
  { family: "'Georgia', serif", weight: 700, label: 'serif' },
  { family: "'Helvetica Neue', Helvetica, sans-serif", weight: 300, label: 'grotesque' },
  { family: "'Arial Black', sans-serif", weight: 900, label: 'black' },
  { family: "'Palatino', 'Palatino Linotype', serif", weight: 400, label: 'oldstyle' },
  { family: "'Trebuchet MS', sans-serif", weight: 700, label: 'humanist' },
  { family: "'Courier New', monospace", weight: 700, label: 'typewriter' },
]

// The final "winner" font
const FINAL_FONT = { family: "'Georgia', 'Times New Roman', serif", weight: 700, label: 'winner' }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Slot machine frame lines */}
      <div
        style={{
          position: 'absolute',
          top: '32%',
          left: '8%',
          right: '8%',
          height: 1,
          background: 'rgba(128,128,128,0.15)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '68%',
          left: '8%',
          right: '8%',
          height: 1,
          background: 'rgba(128,128,128,0.15)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const fontSize = Math.min(width * 0.14, height * 0.17, 122)

    let currentFont: typeof FONT_ROULETTE[0]
    let opacity: number
    let scale: number = 1
    let flickerOpacity: number = 1
    let labelOpacity: number = 0

    if (phase === 'enter') {
      // Rapid spin during enter
      const spinCount = 6
      const fontIndex = Math.floor(easeOutExpo(enterProgress) * spinCount * FONT_ROULETTE.length) % FONT_ROULETTE.length
      currentFont = FONT_ROULETTE[fontIndex]
      opacity = Math.min(1, enterProgress * 3)
      // Flicker effect — fonts swap at discrete frames
      flickerOpacity = enterProgress > 0.8
        ? 1  // settling
        : 0.7 + Math.sin(enterProgress * Math.PI * 12) * 0.3
    } else if (phase === 'hold') {
      // Settled on final font
      if (holdProgress < 0.1) {
        // Click/settle animation — one last mini-spin
        const finalT = holdProgress / 0.1
        const extraIndex = Math.floor((1 - finalT) * 2) % FONT_ROULETTE.length
        currentFont = extraIndex === 0 ? FINAL_FONT : FONT_ROULETTE[extraIndex]
        scale = 1 + (1 - finalT) * 0.08
      } else {
        currentFont = FINAL_FONT
        scale = 1
      }
      opacity = 1
      labelOpacity = Math.min(1, (holdProgress - 0.15) / 0.2) * 0.25
    } else {
      // Exit: brief roulette then fade
      const spinFontIndex = Math.floor(exitProgress * 3 * FONT_ROULETTE.length) % FONT_ROULETTE.length
      currentFont = FONT_ROULETTE[spinFontIndex]
      opacity = 1 - easeInQuad(exitProgress)
      flickerOpacity = 0.5 + Math.random() * 0.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: opacity * flickerOpacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: currentFont.family,
            fontSize,
            fontWeight: currentFont.weight,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            letterSpacing: currentFont.weight >= 700 ? '-0.01em' : '0.04em',
          }}
        >
          {word}
        </div>
        {/* Font label */}
        <div
          style={{
            marginTop: fontSize * 0.3,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.14em',
            textTransform: 'lowercase',
          }}
        >
          {currentFont.label}
        </div>
      </div>
    )
  },
}

function FontRouletteComponent(props: MotionGraphicProps<FontRouletteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-font-roulette',
  title: 'Font Roulette',
  description:
    'The word spins through a rapid succession of font families like a slot machine — monospace, display, serif, grotesque, black — decelerating to land on a winner with a satisfying click. Font identity as game show drama.',
  tags: ['kinetic', 'typography', 'font-family', 'multi-font', 'roulette', 'spin', 'slot-machine', 'craft'],
  category: 'captions',
  component: FontRouletteComponent as any,
  defaultConfig: {
    words: ['CHOOSE', 'FONT', 'TYPE', 'PICK'],
    colors: ['#1a1a1a', '#333', '#1a1a1a', '#333'],
    bgColor: '#f0ede7',
    cycleDuration: 2.2,
    spinCount: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHOOSE', 'FONT', 'TYPE', 'PICK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#333', '#1a1a1a', '#333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f0ede7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.5, max: 5, group: 'Timing' },
    { key: 'spinCount', label: 'Spin Count', type: 'number', defaultValue: 6, min: 3, max: 12, group: 'Animation' },
  ],
})
