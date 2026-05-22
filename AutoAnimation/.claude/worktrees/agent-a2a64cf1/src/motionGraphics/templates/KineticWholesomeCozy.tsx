import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Subculture: Wholesome/Cozy Streaming — warm pixels, gentle bob, comfort content aesthetic
// Mechanic: text rises softly from below like a cozy thought bubble, settles with gentle breathing

interface WholesomeCozyConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Warm cozy scene: soft amber light, floating dust motes
    const motes = Array.from({ length: 18 }, (_, i) => {
      const seed = i * 83.7
      const x = ((seed * 13) % 90) + 5
      const baseY = ((seed * 7) % 80) + 10
      const y = baseY + Math.sin(time * 0.4 + seed) * 8
      const size = 1 + (seed % 3)
      const opacity = 0.06 + (seed % 4) * 0.02
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(255,200,100,${opacity})`,
          }}
        />
      )
    })

    // Gentle candle-light flicker on right side
    const flicker = 0.6 + Math.sin(time * 3.7) * 0.1 + Math.sin(time * 7.1) * 0.05

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, #2a1f10 0%, #1e1508 40%, #2d2010 100%)',
        }}
      >
        {motes}
        {/* Warm window light from right */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '35%',
            background: `radial-gradient(ellipse at 100% 40%, rgba(255,180,60,${flicker * 0.12}) 0%, transparent 70%)`,
          }}
        />
        {/* Cozy bottom warmth — fireplace glow */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '30%',
            background: `linear-gradient(0deg, rgba(255,100,30,${flicker * 0.08}) 0%, transparent 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / (fps ?? 30)

    // Cozy rise: text floats up softly, no snap — just gentle warmth
    const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2)

    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      const e = easeOutSine(enterProgress)
      opacity = e * 0.95
      translateY = (1 - e) * 25
      scale = 0.92 + e * 0.08
    } else if (phase === 'hold') {
      opacity = 0.95
      // Gentle breathing bob
      translateY = Math.sin(time * 1.2) * 3
      scale = 1 + Math.sin(time * 0.8) * 0.01
    } else {
      opacity = 0.95 * (1 - easeOutSine(exitProgress))
      translateY = -exitProgress * 15
      scale = 1 - exitProgress * 0.03
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(28px, 7.5vw, 100px)',
          fontWeight: 400,
          fontStyle: 'italic',
          textTransform: 'lowercase',
          letterSpacing: 5,
          color,
          whiteSpace: 'nowrap',
          textShadow: `0 2px 12px rgba(255,150,50,0.3), 0 0 40px rgba(255,120,30,0.1)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function WholesomeCozyComponent(props: MotionGraphicProps<WholesomeCozyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wholesome-cozy',
  title: 'Kinetic Wholesome Cozy',
  description: 'Wholesome cozy aesthetic: warm italic serif floats up gently with breathing bob, fireplace glow, floating dust motes',
  tags: ['kinetic', 'typography', 'cozy', 'wholesome', 'warm', 'streaming', 'comfort', 'subculture', 'soft'],
  category: 'captions',
  component: WholesomeCozyComponent as any,
  defaultConfig: {
    words: ['cozy', 'warm', 'home', 'safe'],
    colors: ['#f5c876', '#e8b04a', '#f0ca6e', '#d4965c'],
    bgColor: '#2a1f10',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['cozy', 'warm', 'home', 'safe'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f5c876', '#e8b04a', '#f0ca6e', '#d4965c'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a1f10', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 6, group: 'Timing' },
  ],
})
