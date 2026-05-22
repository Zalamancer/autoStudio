import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BarkTextureConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Deterministic pseudo-random from seed
function pseudoRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Bark-like horizontal striations across the background
    const stripes = Array.from({ length: 18 }, (_, i) => {
      const y = (i / 17) * 100
      const warp = Math.sin(time * 0.2 + i * 0.7) * 1.5
      const thickness = 1 + pseudoRand(i * 3) * 2
      const opacity = 0.04 + pseudoRand(i * 7 + 1) * 0.06
      return { y: y + warp, thickness, opacity }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {stripes.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${s.y}%`,
              height: s.thickness,
              background: `rgba(139,90,43,${s.opacity})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Bark peeling: text is revealed through a series of horizontal crack-strips
    // Each strip has its own staggered reveal timing
    const numStrips = 8
    const eased = phase === 'enter'
      ? easeOutQuart(enterProgress)
      : phase === 'exit'
      ? 1 - easeInCubic(exitProgress)
      : 1

    // Overall opacity
    const opacity = Math.min(1, eased * 1.2)

    // Each strip clips at a different threshold based on a bark-crack pattern
    // The strips peel back from center outward
    const strips = Array.from({ length: numStrips }, (_, i) => {
      const center = (numStrips - 1) / 2
      const distFromCenter = Math.abs(i - center) / center
      // Center strips reveal first (like bark cracking outward)
      const stripThreshold = distFromCenter * 0.45
      const stripProgress = Math.max(0, Math.min(1, (eased - stripThreshold) / (1 - stripThreshold)))
      // clipPath reveals from left with slight diagonal warp per strip
      const skew = (pseudoRand(index * 11 + i) - 0.5) * 6
      return { stripProgress, skew }
    })

    const stripHeight = 100 / numStrips

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Render text numStrips times, each clipped to one horizontal band */}
        {strips.map((strip, i) => {
          const yTop = i * stripHeight
          const yBottom = yTop + stripHeight
          // Each strip reveals left-to-right with a slight angle
          const revealPct = strip.stripProgress * 100
          const clipPath = `polygon(0% ${yTop + strip.skew * 0.1}%, ${revealPct}% ${yTop - strip.skew * 0.1}%, ${revealPct}% ${yBottom + strip.skew * 0.1}%, 0% ${yBottom - strip.skew * 0.1}%)`

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                clipPath,
                // Slight vertical offset per strip for bark-crack texture
                transform: `translateY(${(pseudoRand(i * 13 + index) - 0.5) * 3 * (1 - strip.stripProgress)}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(40px, 9vw, 130px)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  textShadow: `2px 3px 8px rgba(0,0,0,0.4), 0 1px 0 rgba(139,90,43,0.3)`,
                }}
              >
                {word}
              </div>
            </div>
          )
        })}
      </div>
    )
  },
}

function BarkTextureComponent(props: MotionGraphicProps<BarkTextureConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bark-texture',
  title: 'Bark Texture Peel',
  description: 'Text is revealed in horizontal strips like bark cracking and peeling back, center-out with natural warp offsets.',
  tags: ['kinetic', 'typography', 'botanical', 'nature', 'bark', 'peel', 'reveal', 'organic'],
  category: 'captions',
  component: BarkTextureComponent as any,
  defaultConfig: {
    words: ['ROOTED', 'ANCIENT', 'WILD', 'GROWN'],
    colors: ['#D4A56A', '#C8885A', '#E0C090', '#B87040'],
    bgColor: '#1a0f08',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ROOTED', 'ANCIENT', 'WILD', 'GROWN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A56A', '#C8885A', '#E0C090', '#B87040'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0f08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
