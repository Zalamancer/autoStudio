import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SolarizeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Solarization flash pulse — the accidental light exposure that causes the Sabattier effect
    const flashCycle = (time * 0.7) % 3
    const flashIntensity = flashCycle < 0.15 ? Math.sin((flashCycle / 0.15) * Math.PI) * 0.08 : 0
    // Mackie line glow — the halo artifact at tone boundaries
    const mackieGlow = 0.03 + Math.sin(time * 1.5) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Chemical paper base tone — mid-gray with slight warmth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(60,55,65,0.3), rgba(40,35,45,0.3))',
            pointerEvents: 'none',
          }}
        />
        {/* Solarization flash — brief light leak during development */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${flashIntensity})`,
            pointerEvents: 'none',
          }}
        />
        {/* Tone reversal gradient band — characteristic solarization artifact */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: 0,
            right: 0,
            height: '20%',
            background: `linear-gradient(0deg, transparent, rgba(255,255,255,${mackieGlow}), transparent)`,
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />
        {/* Film grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Darkroom paper edge curl vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 71 + 53

    let opacity = 0
    let isInverted = false
    let mackieLineOpacity = 0

    if (phase === 'enter') {
      // Normal development first — text appears as positive
      opacity = enterProgress
      isInverted = false
      mackieLineOpacity = 0
    } else if (phase === 'hold') {
      opacity = 1
      // The Sabattier effect: mid-hold, flash of light causes tone inversion
      // Cycle through: positive -> flash -> negative -> settle
      const solarCycle = holdProgress * 2
      if (solarCycle < 0.4) {
        // Normal positive image
        isInverted = false
        mackieLineOpacity = 0
      } else if (solarCycle < 0.5) {
        // Flash moment — bright flash
        isInverted = false
        mackieLineOpacity = (solarCycle - 0.4) / 0.1
      } else if (solarCycle < 0.7) {
        // Inversion happening — eerie reversal
        isInverted = true
        mackieLineOpacity = 1
      } else {
        // Partial re-development — unstable between positive and negative
        const flicker = Math.sin(f * 0.3 + seed)
        isInverted = flicker > 0
        mackieLineOpacity = 0.6 + flicker * 0.3
      }
    } else {
      opacity = 1 - exitProgress
      isInverted = true // Exits in inverted state
      mackieLineOpacity = 1 - exitProgress
    }

    // Colors for positive vs negative (inverted) states
    const positiveColor = color
    const negativeColor = '#1a1520' // Dark — inverted from light
    const activeBg = isInverted ? 'rgba(200,195,210,0.15)' : 'transparent'
    const activeColor = isInverted ? negativeColor : positiveColor

    return (
      <>
        {/* Inverted background flash for solarization */}
        {isInverted && (
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '15%',
              right: '15%',
              bottom: '35%',
              background: activeBg,
              borderRadius: 4,
              filter: 'blur(8px)',
              opacity: opacity * 0.8,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Mackie line — bright halo edge artifact at tone boundaries */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(220,215,230,0.25)',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: mackieLineOpacity * opacity,
            filter: 'blur(4px)',
            WebkitTextStroke: '2px rgba(220,215,230,0.15)',
          }}
        >
          {word}
        </div>
        {/* Main text — switches between positive and negative */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: activeColor,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity,
            textShadow: isInverted
              ? `0 0 8px rgba(200,195,210,0.3), 0 0 15px rgba(200,195,210,0.15)`
              : `0 0 6px rgba(200,195,210,0.15)`,
            transition: 'color 0.08s ease',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function SolarizeComponent(props: MotionGraphicProps<SolarizeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-solarize',
  title: 'Kinetic Solarize',
  description: 'Sabattier/solarization effect: text reverses from positive to negative mid-development with eerie tone inversion and Mackie line halos',
  tags: ['kinetic', 'typography', 'solarize', 'sabattier', 'darkroom', 'inversion', 'negative', 'experimental'],
  category: 'captions',
  component: SolarizeComponent as any,
  defaultConfig: {
    words: ['INVERT', 'FLASH', 'REVERSE', 'TONE'],
    colors: ['#d8d0e0', '#c8c0d4', '#e0d8e8', '#b8b0c8'],
    bgColor: '#18141e',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INVERT', 'FLASH', 'REVERSE', 'TONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#d8d0e0', '#c8c0d4', '#e0d8e8', '#b8b0c8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18141e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
