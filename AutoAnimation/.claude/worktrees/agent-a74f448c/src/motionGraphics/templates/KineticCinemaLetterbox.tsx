import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CinemaLetterboxConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Letterbox bars slide in from off-screen during first 0.8s then stay
    const barIntro = Math.min(1, time / 0.8)
    const barEased = easeOutCubic(barIntro)
    const barHeight = barEased * 13 // percentage of total height

    // Subtle film grain
    const grainOpacity = 0.025 + Math.sin(frame * 47.3) * 0.008

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top letterbox bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${barHeight}%`,
            background: '#000000',
            zIndex: 10,
          }}
        />
        {/* Bottom letterbox bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${barHeight}%`,
            background: '#000000',
            zIndex: 10,
          }}
        />
        {/* Subtle horizontal lines for cinematic texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* Film grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: grainOpacity,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let blur = 0

    if (phase === 'enter') {
      // Text fades through black — slow deliberate reveal
      opacity = easeOutCubic(enterProgress)
      blur = (1 - enterProgress) * 3
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      // Fade to black
      opacity = 1 - easeOutCubic(exitProgress)
      blur = exitProgress * 4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 400,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color,
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function CinemaLetterboxComponent(props: MotionGraphicProps<CinemaLetterboxConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cinema-letterbox',
  title: 'Kinetic Cinema Letterbox',
  description:
    'Cinematic 2.35:1 letterbox bars slide in while text fades through black for an epic widescreen feel',
  tags: ['kinetic', 'typography', 'cinematic', 'letterbox', 'film', 'widescreen'],
  category: 'captions',
  component: CinemaLetterboxComponent as any,
  defaultConfig: {
    words: ['THE', 'JOURNEY', 'BEGINS', 'NOW'],
    colors: ['#E8E8E8', '#E8E8E8', '#E8E8E8', '#E8E8E8'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['THE', 'JOURNEY', 'BEGINS', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8E8E8', '#E8E8E8', '#E8E8E8'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#0a0a0a',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
