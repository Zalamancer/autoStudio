import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroPixelConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      opacity = enterProgress > 0.3 ? 1 : enterProgress / 0.3
      scale = 0.2 + enterProgress * 0.8
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      translateY = Math.sin(Date.now() * 0.006) * 4
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          imageRendering: 'pixelated' as any,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          fontVariant: 'small-caps',
          color,
          textShadow: `0 0 8px ${color}, 0 0 20px ${color}`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function RetroPixelComponent(props: MotionGraphicProps<RetroPixelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-retro-pixel',
  title: 'Kinetic Retro Pixel',
  description: 'Retro 8-bit pixel game style with scanlines, pixelated scaling, and neon glow',
  tags: ['kinetic', 'typography', 'retro', 'pixel', '8-bit', 'game'],
  category: 'captions',
  component: RetroPixelComponent as any,
  defaultConfig: {
    words: ['PLAYER', 'ONE', 'READY', 'GO'],
    colors: ['#00FF00', '#FF0000', '#FFFF00', '#00FFFF'],
    bgColor: '#1a1a3a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PLAYER', 'ONE', 'READY', 'GO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF00', '#FF0000', '#FFFF00', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a3a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
