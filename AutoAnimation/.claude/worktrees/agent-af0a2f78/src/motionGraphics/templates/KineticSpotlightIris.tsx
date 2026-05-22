import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpotlightIrisConfig extends KineticBaseConfig {
  warmth: number // 0=cool white, 1=warm amber
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Stage floor hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, rgba(80,60,30,0.18) 0%, transparent 100%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__spotlightIrisConfig ?? { warmth: 0.6 }
    const warmth = config.warmth ?? 0.6

    // Iris opens: circle clip-path from 0% to covering full frame
    let openProgress = 0
    if (phase === 'enter') {
      openProgress = easeOutQuart(enterProgress)
    } else if (phase === 'hold') {
      openProgress = 1
    } else {
      openProgress = 1 - easeInOutSine(exitProgress)
    }

    // Circle clip-path: starts at 0, expands to large enough to cover frame
    const minDim = Math.min(width, height)
    const maxR = Math.sqrt(width * width + height * height) / 2
    const r = openProgress * maxR
    const clipPath = openProgress < 0.001
      ? 'circle(0px at 50% 50%)'
      : `circle(${r.toFixed(1)}px at 50% 50%)`

    // Spotlight color blends cool<->warm
    const coolR = 220; const coolG = 235; const coolB = 255
    const warmR = 255; const warmG = 220; const warmB = 140
    const lr = Math.round(coolR + (warmR - coolR) * warmth)
    const lg = Math.round(coolG + (warmG - coolG) * warmth)
    const lb = Math.round(coolB + (warmB - coolB) * warmth)
    const lightColor = `rgb(${lr},${lg},${lb})`

    // Glow halo around the opening circle edge
    const haloOpacity = openProgress > 0.02 && openProgress < 0.95 ? 0.35 * Math.sin(openProgress * Math.PI) : 0

    return (
      <>
        {/* Spotlight beam fill — lit area */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle ${r.toFixed(0)}px at 50% 50%, ${lightColor}22 0%, ${lightColor}06 60%, transparent 100%)`,
            clipPath,
          }}
        />
        {/* Text in spotlight */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            clipPath,
            textShadow: openProgress > 0.3
              ? `0 0 ${Math.round(openProgress * 40)}px ${lightColor}88`
              : 'none',
          }}
        >
          {word}
        </div>
        {/* Iris edge glow */}
        {haloOpacity > 0 && (
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            width={width}
            height={height}
          >
            <circle
              cx={width / 2}
              cy={height / 2}
              r={r}
              fill="none"
              stroke={lightColor}
              strokeWidth={6}
              opacity={haloOpacity}
            />
          </svg>
        )}
      </>
    )
  },
}

function SpotlightIrisComponent(props: MotionGraphicProps<SpotlightIrisConfig>) {
  ;(globalThis as any).__spotlightIrisConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spotlight-iris',
  title: 'Kinetic Spotlight Iris',
  description: 'Theater spotlight iris opens from blackout — circular light beam expands to illuminate the text',
  tags: ['kinetic', 'typography', 'spotlight', 'iris', 'theater', 'stage', 'reveal', 'mechanical', 'aperture'],
  category: 'captions',
  component: SpotlightIrisComponent as any,
  defaultConfig: {
    words: ['LIGHTS', 'ACTION', 'SCENE', 'STAGE'],
    colors: ['#FFFDE8', '#FFE4A0', '#FFFDE8', '#FFD080'],
    bgColor: '#060606',
    cycleDuration: 1.5,
    warmth: 0.65,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LIGHTS', 'ACTION', 'SCENE', 'STAGE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FFFDE8', '#FFE4A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060606', group: 'Style' },
    {
      key: 'warmth',
      label: 'Light Warmth',
      type: 'number',
      defaultValue: 0.65,
      min: 0,
      max: 1,
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
