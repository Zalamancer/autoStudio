import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PinholeWidenConfig extends KineticBaseConfig {
  filmGrain: number // 0-1
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Pinhole camera aesthetic: text appears through tiny point of light widening
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Very dark background simulating unexposed film
    const config = (globalThis as any).__pinholeConfig ?? { filmGrain: 0.4 }
    const filmGrain = config.filmGrain ?? 0.4

    // Subtle vignette always present
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Film grain layer — deterministic by frame */}
        {filmGrain > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='${frame % 30}'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")`,
              opacity: filmGrain * 0.5,
              mixBlendMode: 'screen',
            }}
          />
        )}
        {/* Heavy vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Pinhole effect: starts as tiny bright dot, widens to reveal full text
    let openProgress = 0
    if (phase === 'enter') {
      openProgress = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      openProgress = 1
    } else {
      openProgress = 1 - easeInCubic(exitProgress)
    }

    // The "pinhole" circle clip: 0px → large enough to cover frame
    const maxR = Math.sqrt(width * width + height * height) / 2
    // Start from a truly tiny point (2px) then expand
    const minR = 2
    const r = minR + (maxR - minR) * openProgress
    const clipPath = `circle(${r.toFixed(2)}px at 50% 50%)`

    // Light exposure brightens as it opens — sepia/warm film tone
    const exposureOpacity = Math.min(1, openProgress * 1.2)

    // Central bright spot at very small sizes (pinhole glow)
    const pinholeGlow = openProgress < 0.15 ? (0.15 - openProgress) / 0.15 : 0

    return (
      <>
        {/* Warm exposure overlay inside the opening */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255,245,200,0.12) 0%, transparent 70%)',
            opacity: exposureOpacity,
            clipPath,
          }}
        />
        {/* Text exposed through pinhole */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            clipPath,
            filter: openProgress < 0.8 ? `blur(${((1 - openProgress / 0.8) * 3).toFixed(1)}px)` : 'none',
          }}
        >
          {word}
        </div>
        {/* Pinhole bright center dot at start */}
        {pinholeGlow > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#fff9e0',
              boxShadow: `0 0 ${Math.round(pinholeGlow * 20)}px ${Math.round(pinholeGlow * 12)}px rgba(255,249,200,0.8)`,
              opacity: pinholeGlow,
            }}
          />
        )}
      </>
    )
  },
}

function PinholeWidenComponent(props: MotionGraphicProps<PinholeWidenConfig>) {
  ;(globalThis as any).__pinholeConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pinhole-widen',
  title: 'Kinetic Pinhole Widen',
  description: 'Pinhole camera exposure: tiny point of light widens from the center to reveal text like developing film',
  tags: ['kinetic', 'typography', 'pinhole', 'camera', 'film', 'exposure', 'reveal', 'aperture', 'mechanical'],
  category: 'captions',
  component: PinholeWidenComponent as any,
  defaultConfig: {
    words: ['EXPOSE', 'DEVELOP', 'LIGHT', 'FILM'],
    colors: ['#F5E6C8', '#E8D4A0', '#F5E6C8', '#DDCB8E'],
    bgColor: '#050400',
    cycleDuration: 1.8,
    filmGrain: 0.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['EXPOSE', 'DEVELOP', 'LIGHT', 'FILM'],
      group: 'Content',
    },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#F5E6C8', '#E8D4A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050400', group: 'Style' },
    {
      key: 'filmGrain',
      label: 'Film Grain',
      type: 'number',
      defaultValue: 0.4,
      min: 0,
      max: 1,
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
