import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HologramFlickerConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    const scanY = (frame * 2) % 100
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,255,0.015) 3px, rgba(0,255,255,0.015) 6px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 1,
            background: 'rgba(0,255,255,0.12)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index }: WordRenderProps) => {
    let opacity = 0
    let clipInset = 100

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 1.5)
      clipInset = 100 - enterProgress * 100
    } else if (phase === 'hold') {
      const seed = index * 137 + Math.floor(holdProgress * 60)
      const glitch = ((seed * 73 + 37) % 100) / 100
      opacity = glitch < 0.08 ? 0.4 : 0.7 + Math.sin(holdProgress * Math.PI * 8) * 0.15
      clipInset = 0
    } else {
      opacity = (1 - exitProgress) * 0.8
      clipInset = 0
    }

    const translateY = phase === 'exit' ? -exitProgress * 30 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          clipPath: phase === 'enter' ? `inset(${clipInset}% 0 0 0)` : undefined,
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: 8,
          color,
          textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px rgba(0,255,255,0.3)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function HologramFlickerComponent(props: MotionGraphicProps<HologramFlickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hologram-flicker',
  title: 'Kinetic Hologram Flicker',
  description: 'Holographic projection effect with scan-line build-up, flicker, and cyan glow',
  tags: ['kinetic', 'typography', 'hologram', 'sci-fi', 'glow'],
  category: 'captions',
  component: HologramFlickerComponent as any,
  defaultConfig: {
    words: ['HELP', 'ME', 'OBIWAN', 'KENOBI'],
    colors: ['#00FFFF', '#00BFFF', '#40E0D0', '#7FFFD4'],
    bgColor: '#0a0a1a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HELP', 'ME', 'OBIWAN', 'KENOBI'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#00BFFF', '#40E0D0', '#7FFFD4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
