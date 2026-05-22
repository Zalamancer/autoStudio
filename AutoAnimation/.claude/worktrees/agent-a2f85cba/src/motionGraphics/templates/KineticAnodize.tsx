import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnodizeConfig extends KineticBaseConfig {
  colorShift: number
  iridescence: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Aluminum substrate texture — brushed metal lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(180,180,200,0.04) 2px, rgba(180,180,200,0.04) 3px)',
          }}
        />
        {/* Acid bath indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            opacity: 0.25,
            fontFamily: 'monospace',
            fontSize: 8,
            color: '#88FFCC',
            letterSpacing: 2,
          }}
        >
          H₂SO₄ BATH ◆ {Math.round(20 + Math.sin(t * 0.5) * 2)}°C
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let oxideP = 0
    let colorP = 0
    let sealP = 0
    let stripP = 0

    if (phase === 'enter') {
      oxideP = Math.min(1, enterProgress / 0.35)
      colorP = Math.min(1, Math.max(0, (enterProgress - 0.35) / 0.4))
      sealP = Math.min(1, Math.max(0, (enterProgress - 0.75) / 0.25))
    } else if (phase === 'hold') {
      oxideP = 1
      colorP = 1
      sealP = 1
    } else {
      oxideP = 1
      colorP = 1
      sealP = 1
      stripP = easeInCubic(exitProgress)
    }

    // Stage 1: Oxide layer builds up — text appears in silver/gray
    const oxideOpacity = easeOutExpo(oxideP) * (1 - stripP)

    // Stage 2: Anodic dye colors seep in — iridescent hue shift across word
    const hueBase = 180 // start cyan
    const hueEnd = 280 // shift to purple
    const hueShift = holdProgress * 20 // slow hue rotation on hold

    // Stage 3: Sealing — hot water seals the pores, crystalline finish
    const sealGlow = easeOutBack(sealP) * (1 - stripP)

    const chars = word.split('')
    const totalChars = chars.length

    return (
      <>
        {/* Oxide layer: silver-gray base */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, oxideOpacity * Math.max(0, 1 - colorP)),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color: '#B0B8C0',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>

        {/* Anodic dye — each character gets a different hue (iridescent spread) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            whiteSpace: 'nowrap',
            opacity: Math.max(0, easeOutExpo(colorP) * (1 - stripP)),
          }}
        >
          {chars.map((ch, ci) => {
            const hue = hueBase + (ci / Math.max(1, totalChars - 1)) * (hueEnd - hueBase) + hueShift
            const charDelay = (ci / totalChars) * 0.5
            const charColorP = Math.max(0, Math.min(1, (colorP - charDelay) / (1 - charDelay + 0.01)))
            const easedChar = easeOutExpo(charColorP)

            return (
              <span
                key={ci}
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color: `hsl(${hue}, 90%, 60%)`,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  opacity: easedChar,
                  textShadow: `0 0 ${20 * sealGlow}px hsl(${hue}, 90%, 70%)`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>

        {/* Sealing crystalline flash */}
        {sealP > 0 && sealP < 0.6 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              whiteSpace: 'nowrap',
              opacity: Math.max(0, sealP < 0.3 ? sealP / 0.3 : (0.6 - sealP) / 0.3) * 0.6,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(52px, 13vw, 168px)',
                fontWeight: 900,
                color,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                filter: 'blur(4px)',
              }}
            >
              {word}
            </span>
          </div>
        )}
      </>
    )
  },
}

function AnodizeComponent(props: MotionGraphicProps<AnodizeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-anodize',
  title: 'Kinetic Anodize',
  description:
    'Aluminum anodizing process: oxide layer builds up in silver-gray, then anodic dye seeps character-by-character in an iridescent color gradient, sealed with a crystalline flash.',
  tags: [
    'kinetic',
    'typography',
    'anodize',
    'aluminum',
    'iridescent',
    'chemistry',
    'process',
    'metal',
    'color',
    'build',
  ],
  category: 'captions',
  component: AnodizeComponent as any,
  defaultConfig: {
    words: ['ANODIZE', 'OXIDE', 'COLOR', 'SEAL'],
    colors: ['#88FFEE', '#77EEDD', '#99FFCC', '#AAFFEE'],
    bgColor: '#0A0F14',
    cycleDuration: 2.2,
    colorShift: 100,
    iridescence: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ANODIZE', 'OXIDE', 'COLOR', 'SEAL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#88FFEE', '#77EEDD', '#99FFCC', '#AAFFEE'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0F14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'colorShift',
      label: 'Color Shift (deg)',
      type: 'number',
      defaultValue: 100,
      min: 0,
      max: 360,
      group: 'Animation',
    },
    { key: 'iridescence', label: 'Iridescence', type: 'number', defaultValue: 1, min: 0, max: 3, group: 'Animation' },
  ],
})
