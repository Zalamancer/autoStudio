import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmGrainConfig extends KineticBaseConfig {
  grainIntensity: number
}

// Film grain noise: text emerges through dense photographic grain that slowly settles.
// Grain is simulated with layered SVG feTurbulence + CSS mix-blend-mode overlay.
// Each frame uses a deterministic turbulence seed so it looks animated frame-by-frame.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Deterministic grain seed — changes every frame for animated grain feel
    const seed1 = (frame * 7 + 3) % 999
    const seed2 = (frame * 13 + 71) % 999

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Film grain overlay — animated frame-by-frame via seed */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            mixBlendMode: 'overlay',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        >
          <filter id="film-grain-bg">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              seed={seed1}
              result="noise"
            />
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
              result="grey"
            />
            <feComposite in="grey" in2="SourceGraphic" operator="in" />
          </filter>
          <rect width="100%" height="100%" filter="url(#film-grain-bg)" />
        </svg>

        {/* Silver halide vignette — heavier at corners, typical of film */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Warm sepia tone cast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(120,90,40,0.06) 0%, rgba(60,40,10,0.12) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Fine scan-line texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 3px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 61 + 29
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 2)

    // Grain seed shifts every frame for the text-level grain too
    const grainSeed = (f * 11 + seed) % 999

    let grainOpacity: number  // how dense is the grain covering the text
    let textOpacity: number
    let blur: number

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      grainOpacity = (1 - ep) * 0.85  // grain fades as text emerges
      textOpacity = 0.2 + ep * 0.8
      blur = (1 - ep) * 3
    } else if (phase === 'hold') {
      grainOpacity = 0.08  // residual grain, always present on film
      textOpacity = 1
      blur = 0
    } else {
      const ep = easeOut(exitProgress)
      grainOpacity = ep * 0.7
      textOpacity = 1 - ep * 0.85
      blur = ep * 2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Text layer */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            filter: blur > 0.1 ? `blur(${blur}px)` : 'none',
            textShadow: grainOpacity < 0.3 ? `0 1px 12px rgba(180,140,60,0.3)` : 'none',
          }}
        >
          {word}
        </div>

        {/* Grain overlay on top of text — obscures it during enter */}
        {grainOpacity > 0.02 && (
          <svg
            style={{
              position: 'absolute',
              inset: '-20%',
              width: '140%',
              height: '140%',
              mixBlendMode: 'overlay',
              opacity: grainOpacity,
              pointerEvents: 'none',
            }}
          >
            <filter id={`text-grain-${index}`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="4"
                seed={grainSeed}
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#text-grain-${index})`} />
          </svg>
        )}
      </div>
    )
  },
}

function FilmGrainComponent(props: MotionGraphicProps<FilmGrainConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-grain',
  title: 'Kinetic Film Grain',
  description: 'Text appears through dense photographic film grain that settles — silver halide noise, warm sepia tone, scan-line texture',
  tags: ['kinetic', 'typography', 'film', 'camera', 'grain', 'noise', 'cinematic', 'analog', 'sepia'],
  category: 'captions',
  component: FilmGrainComponent as any,
  defaultConfig: {
    words: ['GRAIN', 'SILVER', 'FILM', 'NOIR'],
    colors: ['#E8D8B0', '#D4C090', '#F0E8C8', '#C8B878'],
    bgColor: '#0E0C08',
    cycleDuration: 1.4,
    grainIntensity: 85,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GRAIN', 'SILVER', 'FILM', 'NOIR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D8B0', '#D4C090', '#F0E8C8', '#C8B878'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E0C08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'grainIntensity', label: 'Grain Intensity', type: 'number', defaultValue: 85, min: 20, max: 150, group: 'Animation' },
  ],
})
