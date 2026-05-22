import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MangaSFXConfig extends KineticBaseConfig {}

// Manga SFX: onomatopoeia rendered in jagged, distorted, action-word style
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Expanding ring shockwave from center
    const ringProgress = (time * 2) % 1
    const ringScale = 0.1 + ringProgress * 2
    const ringOpacity = 1 - ringProgress
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Diagonal speed lines - manga action panel style */}
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent 0px,
              transparent 12px,
              rgba(0,0,0,0.05) 12px,
              rgba(0,0,0,0.05) 13px
            )`,
          }}
        />
        {/* Shockwave ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '3px solid rgba(0,0,0,0.2)',
            transform: `translate(-50%, -50%) scale(${ringScale})`,
            opacity: ringOpacity,
          }}
        />
        {/* Screentone dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1.5px, transparent 1.5px)',
            backgroundSize: '10px 10px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = 0
    const seed = index * 67 + 13
    // Each SFX word gets a unique jaunty angle — manga sfx are never straight
    const baseRotation = ((seed % 5) - 2) * 8

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 5)
      // Explosive scale from 0.1 to 1 with hard snap
      scale = 0.1 + enterProgress * 0.9 + Math.sin(enterProgress * Math.PI) * 0.3
      rotation = baseRotation * (1 - enterProgress)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(Date.now() * 0.02 + seed) * 0.025
      rotation = baseRotation
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.5
      rotation = baseRotation + exitProgress * 20
    }

    // Jagged outline mimicking manga SFX lettering
    const outline = `
      2px 2px 0 #000,
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      4px 4px 0 #000,
      -4px -4px 0 #000,
      4px -4px 0 #000,
      -4px 4px 0 #000
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(44px, 13vw, 180px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          fontStyle: 'italic',
          color,
          WebkitTextStroke: '3px #000000',
          textShadow: outline,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          filter: phase === 'enter' ? `contrast(2) saturate(2)` : undefined,
        }}
      >
        {word}
      </div>
    )
  },
}

function MangaSFXComponent(props: MotionGraphicProps<MangaSFXConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-manga-sfx',
  title: 'Kinetic Manga SFX',
  description: 'Japanese manga sound effect onomatopoeia with explosive scale-in, jagged outlines, shockwave rings, and screentone background',
  tags: ['kinetic', 'typography', 'manga', 'sfx', 'onomatopoeia', 'japanese', 'action', 'screentone'],
  category: 'captions',
  component: MangaSFXComponent as any,
  defaultConfig: {
    words: ['BAKI', 'DON', 'ZUBAN', 'GYAA'],
    colors: ['#FF3300', '#FF9900', '#FFFF00', '#FF0066'],
    bgColor: '#F5F0E8',
    cycleDuration: 0.75,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BAKI', 'DON', 'ZUBAN', 'GYAA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3300', '#FF9900', '#FFFF00', '#FF0066'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.75, min: 0.3, max: 5, group: 'Timing' },
  ],
})
