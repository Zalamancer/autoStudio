import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SignalCorruptConfig extends KineticBaseConfig {
  glitchIntensity: number
}

/* ---------- Easing ---------- */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}
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
    // Subtle horizontal noise bands — just atmosphere, not a terminal
    const bandCount = 5
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Faint RGB interference bands that drift slowly */}
        {Array.from({ length: bandCount }, (_, i) => {
          const y = ((time * 17 * (i % 2 === 0 ? 1 : -1) + i * (height / bandCount)) % height + height) % height
          const opacity = 0.018 + seededRand(i * 31 + 7) * 0.012
          return (
            <div
              key={`band-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y,
                height: 2 + seededRand(i * 13) * 3,
                background: i % 3 === 0
                  ? `rgba(255, 0, 80, ${opacity})`
                  : i % 3 === 1
                    ? `rgba(0, 200, 255, ${opacity})`
                    : `rgba(255, 255, 255, ${opacity * 0.6})`,
                mixBlendMode: 'screen',
              }}
            />
          )
        })}
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
    const fontSize = Math.min(width / (totalChars * 0.62), 140)

    // Hold: periodic micro-glitch bursts — deterministic per frame bucket
    const time = frame / fps
    const glitchCycle = Math.floor(time * 8) // 8 buckets/sec
    const isGlitchFrame = seededRand(glitchCycle * 37 + index * 13) > 0.82

    // RGB channel offsets — the signature chromatic aberration effect
    let rOffsetX = 0
    let bOffsetX = 0
    let masterOpacity = 1
    let masterScaleY = 1
    let clipSlice = ''

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      masterOpacity = eased
      masterScaleY = 0.85 + eased * 0.15
      // Channels split apart and slam together as text arrives
      const splitAmt = (1 - eased) * 18
      rOffsetX = -splitAmt
      bOffsetX = splitAmt
    } else if (phase === 'hold') {
      masterOpacity = 1
      if (isGlitchFrame) {
        // Random burst: channels briefly de-sync
        const burstSeed = glitchCycle * 19 + index
        rOffsetX = (seededRand(burstSeed) - 0.5) * 12
        bOffsetX = (seededRand(burstSeed + 1) - 0.5) * 12
        // Occasional horizontal slice displacement
        const sliceY = Math.floor(seededRand(burstSeed + 2) * 100)
        const sliceH = 5 + Math.floor(seededRand(burstSeed + 3) * 15)
        clipSlice = `polygon(0 0, 100% 0, 100% ${sliceY}%, 0 ${sliceY}%)`
      }
    } else {
      // Exit: channels blast apart, text disintegrates
      const eased = easeInExpo(exitProgress)
      rOffsetX = -eased * 30
      bOffsetX = eased * 30
      masterOpacity = 1 - eased
      masterScaleY = 1 + eased * 0.08
    }

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scaleY(${masterScaleY})`,
      display: 'flex',
      gap: 1,
      opacity: masterOpacity,
    }

    // Render the text three times: base + R ghost + B ghost
    const textStyle = (offsetX: number, tint: string, opacity: number): React.CSSProperties => ({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: `translate(calc(-50% + ${offsetX}px), -50%) scaleY(${masterScaleY})`,
      display: 'flex',
      gap: 1,
      opacity: masterOpacity * opacity,
      mixBlendMode: 'screen',
      color: tint,
      pointerEvents: 'none',
    })

    const charEl = (char: string, ci: number, col: string, extraStyle?: React.CSSProperties) => (
      <span
        key={ci}
        style={{
          display: 'inline-block',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
          fontWeight: 700,
          color: col,
          letterSpacing: '0.04em',
          ...extraStyle,
        }}
      >
        {char}
      </span>
    )

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Red channel ghost */}
        {(Math.abs(rOffsetX) > 0.5) && (
          <div style={textStyle(rOffsetX, '#FF2060', 0.55)}>
            {chars.map((c, ci) => charEl(c, ci, '#FF2060'))}
          </div>
        )}

        {/* Blue channel ghost */}
        {(Math.abs(bOffsetX) > 0.5) && (
          <div style={textStyle(bOffsetX, '#00D4FF', 0.55)}>
            {chars.map((c, ci) => charEl(c, ci, '#00D4FF'))}
          </div>
        )}

        {/* Main text layer */}
        <div style={baseStyle}>
          {chars.map((char, ci) => {
            // Per-char hold micro-jitter
            let charTranslateX = 0
            let charTranslateY = 0
            if (phase === 'hold' && isGlitchFrame) {
              const jSeed = glitchCycle * 7 + ci * 3 + index
              charTranslateX = (seededRand(jSeed) - 0.5) * 4
              charTranslateY = (seededRand(jSeed + 5) - 0.5) * 3
            }
            return charEl(char, ci, color, {
              transform: `translate(${charTranslateX}px, ${charTranslateY}px)`,
              textShadow: `0 0 20px ${color}40`,
            })
          })}
        </div>

        {/* Glitch slice — displaced strip of text on glitch frames */}
        {phase === 'hold' && isGlitchFrame && (() => {
          const burstSeed = glitchCycle * 19 + index
          const sliceY = Math.floor(seededRand(burstSeed + 2) * 80) + 10
          const sliceH = 4 + Math.floor(seededRand(burstSeed + 3) * 14)
          const sliceShiftX = (seededRand(burstSeed + 4) - 0.5) * 20
          return (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `polygon(0 ${sliceY}%, 100% ${sliceY}%, 100% ${sliceY + sliceH}%, 0 ${sliceY + sliceH}%)`,
                transform: `translateX(${sliceShiftX}px)`,
                pointerEvents: 'none',
              }}
            >
              <div style={{ ...baseStyle, color }}>
                {chars.map((c, ci) => charEl(c, ci, color))}
              </div>
            </div>
          )
        })()}
      </div>
    )
  },
}

function SignalCorruptComponent(props: MotionGraphicProps<SignalCorruptConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-signal-corrupt',
  title: 'Signal Corrupt',
  description:
    'RGB channels split apart on entry then slam back together. Hold phase fires periodic micro-glitches — chromatic aberration bursts and displaced text slices. Exit blasts the channels apart. Works for dramatic reveals, plot-twist moments, or any high-impact word drop.',
  tags: [
    'kinetic',
    'typography',
    'glitch',
    'rgb',
    'chromatic',
    'aberration',
    'digital',
    'corrupt',
    'drama',
    'impact',
    'tech',
  ],
  category: 'captions',
  component: SignalCorruptComponent as any,
  defaultConfig: {
    words: ['WAIT', 'PLOT', 'TWIST', 'NOW'],
    colors: ['#FFFFFF', '#FF2060', '#00D4FF', '#FFFFFF'],
    bgColor: '#080810',
    cycleDuration: 1.1,
    glitchIntensity: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WAIT', 'PLOT', 'TWIST', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FF2060', '#00D4FF', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080810', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.1,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'glitchIntensity',
      label: 'Glitch Intensity',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 3,
      group: 'Animation',
    },
  ],
})
