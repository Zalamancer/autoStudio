import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScreenCompositeConfig extends KineticBaseConfig {
  chromaStrength: number
  fringe: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
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
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Scanline CRT texture on dark backgrounds */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let compositeP = 0
    let decompP = 0

    if (phase === 'enter') {
      compositeP = easeOutQuart(enterProgress)
    } else if (phase === 'hold') {
      compositeP = 1
    } else {
      compositeP = 1
      decompP = easeInCubic(exitProgress)
    }

    // Chromatic aberration layers — RGB split that converges
    const fringeMax = 24
    const fringe = fringeMax * (1 - compositeP) + fringeMax * decompP * 0.8

    // Each channel enters at different speeds
    const rP = Math.min(1, compositeP * 1.3)
    const gP = Math.min(1, Math.max(0, (compositeP - 0.1) * 1.3))
    const bP = Math.min(1, Math.max(0, (compositeP - 0.2) * 1.3))

    const rEased = easeOutBack(Math.min(1, rP))
    const gEased = easeOutBack(Math.min(1, gP))
    const bEased = easeOutBack(Math.min(1, bP))

    // Scale: starts oversized and shrinks to final
    const rScale = 1.2 - rEased * 0.2
    const gScale = 1.15 - gEased * 0.15
    const bScale = 1.1 - bEased * 0.1

    const globalOpacity = 1 - decompP

    const sharedStyle = {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      whiteSpace: 'nowrap' as const,
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize: 'clamp(52px, 13vw, 168px)',
      fontWeight: 900,
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
      lineHeight: 1,
    }

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: globalOpacity }}>
        {/* Red channel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${fringe}px), -50%) scale(${rScale})`,
            mixBlendMode: 'screen',
            opacity: rP * 0.7,
          }}
        >
          <span style={{ ...sharedStyle, position: 'relative', top: 0, left: 0, color: '#FF0000' }}>{word}</span>
        </div>

        {/* Green channel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${-fringe * 0.3}px)) scale(${gScale})`,
            mixBlendMode: 'screen',
            opacity: gP * 0.7,
          }}
        >
          <span style={{ ...sharedStyle, position: 'relative', top: 0, left: 0, color: '#00FF00' }}>{word}</span>
        </div>

        {/* Blue channel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${-fringe}px), -50%) scale(${bScale})`,
            mixBlendMode: 'screen',
            opacity: bP * 0.7,
          }}
        >
          <span style={{ ...sharedStyle, position: 'relative', top: 0, left: 0, color: '#0000FF' }}>{word}</span>
        </div>

        {/* Final composited layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, (compositeP - 0.6) / 0.4) * (1 - decompP),
          }}
        >
          <span
            style={{
              ...sharedStyle,
              position: 'relative',
              top: 0,
              left: 0,
              color,
              textShadow: `0 0 30px ${color}40`,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function ScreenCompositeComponent(props: MotionGraphicProps<ScreenCompositeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-screen-composite',
  title: 'Kinetic Screen Composite',
  description:
    'RGB color channels separate with chromatic aberration, each channel at a different scale — they converge with screen blend mode to composite into the final sharp text.',
  tags: ['kinetic', 'typography', 'screen', 'composite', 'rgb', 'chromatic', 'aberration', 'blend', 'layer', 'build'],
  category: 'captions',
  component: ScreenCompositeComponent as any,
  defaultConfig: {
    words: ['RGB', 'FUSE', 'COMPOSITE', 'SYNC'],
    colors: ['#FFFFFF', '#F0F0F0', '#FFEEEE', '#EEEEFF'],
    bgColor: '#050505',
    cycleDuration: 1.8,
    chromaStrength: 24,
    fringe: 24,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RGB', 'FUSE', 'COMPOSITE', 'SYNC'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#F0F0F0', '#FFEEEE', '#EEEEFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'chromaStrength',
      label: 'Chroma Strength (px)',
      type: 'number',
      defaultValue: 24,
      min: 5,
      max: 60,
      group: 'Animation',
    },
    {
      key: 'fringe',
      label: 'Fringe Amount (px)',
      type: 'number',
      defaultValue: 24,
      min: 5,
      max: 60,
      group: 'Animation',
    },
  ],
})
