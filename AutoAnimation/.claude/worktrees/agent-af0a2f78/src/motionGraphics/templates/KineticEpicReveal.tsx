import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EpicRevealConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
  }: WordRenderProps) => {
    // Light sweep position: moves left to right during enter, right to left during exit
    let sweepPosition = -30 // percentage position of the light sweep
    let textOpacity = 0
    let shimmer = 0

    if (phase === 'enter') {
      // Lens flare sweeps left to right, revealing text behind it
      const eased = easeOutQuart(enterProgress)
      sweepPosition = -30 + eased * 130 // -30% to 100%
      // Text becomes visible as the sweep passes over it
      textOpacity = Math.min(1, Math.max(0, (enterProgress - 0.2) / 0.5))
    } else if (phase === 'hold') {
      sweepPosition = 110 // off screen right
      textOpacity = 1
      // Subtle shimmer during hold
      shimmer = Math.sin(holdProgress * Math.PI * 6) * 0.3 + 0.7
    } else {
      // Light sweeps back from right to left on exit
      const eased = easeOutQuart(exitProgress)
      sweepPosition = 110 - eased * 140
      textOpacity = 1 - Math.max(0, (exitProgress - 0.5) / 0.5)
    }

    // Flare glow intensity
    const flareOpacity = phase === 'hold' ? 0 : 0.7

    return (
      <>
        {/* Text rendered with clip effect using gradient mask */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: textOpacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color,
            textShadow:
              phase === 'hold' && shimmer > 0.5
                ? `0 0 ${10 + shimmer * 15}px rgba(255,215,0,${shimmer * 0.4}), 0 0 ${30 + shimmer * 20}px rgba(255,215,0,${shimmer * 0.15})`
                : '0 2px 10px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            zIndex: 2,
          }}
        >
          {word}
        </div>

        {/* Lens flare / light sweep */}
        {flareOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${sweepPosition}%`,
              width: '30%',
              height: '100%',
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), rgba(255,215,0,0.3), rgba(255,255,255,0.6), rgba(255,215,0,0.3), rgba(255,255,255,0.05), transparent)',
              opacity: flareOpacity,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        )}

        {/* Horizontal lens streak */}
        {flareOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '49%',
              left: `${sweepPosition - 5}%`,
              width: '40%',
              height: '2px',
              background:
                'linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)',
              opacity: flareOpacity * 0.8,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        )}
      </>
    )
  },
}

function EpicRevealComponent(props: MotionGraphicProps<EpicRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-epic-reveal',
  title: 'Kinetic Epic Reveal',
  description:
    'Epic title reveal with a bright lens flare sweeping across to unveil text, shimmer on hold, and reverse sweep on exit',
  tags: ['kinetic', 'typography', 'epic', 'reveal', 'flare', 'cinematic', 'gold', 'light'],
  category: 'captions',
  component: EpicRevealComponent as any,
  defaultConfig: {
    words: ['DESTINY', 'AWAITS', 'THE', 'CHOSEN'],
    colors: ['#FFD700', '#FFD700', '#FFFFFF', '#FFD700'],
    bgColor: '#080810',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DESTINY', 'AWAITS', 'THE', 'CHOSEN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FFD700', '#FFFFFF', '#FFD700'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#080810',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
