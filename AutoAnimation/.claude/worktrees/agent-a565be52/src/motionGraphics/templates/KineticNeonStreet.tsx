import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonStreetConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Brick wall texture via CSS repeating gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(80,60,40,0.15) 48px, rgba(80,60,40,0.15) 50px)',
            'repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(80,60,40,0.12) 22px, rgba(80,60,40,0.12) 24px)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
      {/* Offset every other row */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 24px, rgba(60,40,30,0.08) 24px, rgba(60,40,30,0.08) 48px)',
          backgroundSize: '100px 48px',
          backgroundPosition: '25px 0',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0

    if (phase === 'enter') {
      // Flicker effect: rapid on/off during first 30%
      if (enterProgress < 0.3) {
        const flickerPhase = enterProgress / 0.3
        // Multiple flicker steps
        const flickerSteps = [0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9]
        let isOn = false
        for (const step of flickerSteps) {
          if (flickerPhase > step) isOn = !isOn
        }
        opacity = isOn ? 1 : 0.05
      } else {
        opacity = 1
      }
    } else if (phase === 'hold') {
      // Steady glow with subtle pulsing
      opacity = 0.9 + Math.sin(Date.now() * 0.003 + index) * 0.1
    } else {
      // Flicker off (reverse)
      if (exitProgress > 0.7) {
        const flickerPhase = (exitProgress - 0.7) / 0.3
        const flickerSteps = [0.15, 0.3, 0.5, 0.7, 0.85]
        let isOn = true
        for (const step of flickerSteps) {
          if (flickerPhase > step) isOn = !isOn
        }
        opacity = isOn ? 0.8 : 0.02
      } else {
        opacity = 1 - exitProgress * 0.3
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Dancing Script', 'Brush Script MT', cursive, sans-serif",
          fontSize: 'clamp(40px, 12vw, 150px)',
          fontWeight: 700,
          color,
          textShadow: [
            `0 0 7px ${color}`,
            `0 0 20px ${color}`,
            `0 0 42px ${color}`,
            `0 0 80px ${color}`,
          ].join(', '),
          whiteSpace: 'nowrap',
          letterSpacing: 4,
        }}
      >
        {word}
      </div>
    )
  },
}

function NeonStreetComponent(props: MotionGraphicProps<NeonStreetConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-street',
  title: 'Kinetic Neon Street',
  description: 'Neon sign on a dark brick wall with flicker-on/off effect and multi-layered glow',
  tags: ['kinetic', 'typography', 'neon', 'sign', 'nightlife'],
  category: 'captions',
  component: NeonStreetComponent as any,
  defaultConfig: {
    words: ['OPEN', 'LATE', 'NIGHT', 'VIBES'],
    colors: ['#FF6EC7', '#00FFFF', '#FFFF00', '#FF4500'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OPEN', 'LATE', 'NIGHT', 'VIBES'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6EC7', '#00FFFF', '#FFFF00', '#FF4500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
