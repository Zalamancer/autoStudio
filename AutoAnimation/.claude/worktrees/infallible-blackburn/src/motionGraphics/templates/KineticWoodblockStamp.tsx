import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WoodblockStampConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Rice paper fiber texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.05,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = 0

    // Slight deterministic rotation per stamp
    const seed = index * 71 + 19
    const stampAngle = ((seed % 7) - 3) * 0.5

    if (phase === 'enter') {
      // Stamp down: scale from large, snap to 1
      if (enterProgress < 0.4) {
        opacity = enterProgress * 2.5
        scale = 1.3 - enterProgress * 0.75 // 1.3 -> 1.0
      } else {
        opacity = 1
        scale = 1
      }
      rotation = stampAngle * enterProgress
    } else if (phase === 'hold') {
      // Perfectly still, stamped
      opacity = 1
      scale = 1
      rotation = stampAngle
    } else {
      // Lift off: slight scale up with fade
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.1
      rotation = stampAngle
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 700,
          letterSpacing: 8,
          color,
          textShadow: `1px 1px 2px ${color}30, -1px -1px 1px ${color}20`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function WoodblockStampComponent(props: MotionGraphicProps<WoodblockStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-woodblock-stamp',
  title: 'Kinetic Woodblock Stamp',
  description: 'Japanese woodblock rubber stamp effect with quick stamp-down and ink bleed on rice paper',
  tags: ['kinetic', 'typography', 'stamp', 'woodblock', 'japanese', 'ink'],
  category: 'captions',
  component: WoodblockStampComponent as any,
  defaultConfig: {
    words: ['HONOR', 'SPIRIT', 'POWER', 'GRACE'],
    colors: ['#CC0000', '#1a1a1a', '#8B4513', '#003366'],
    bgColor: '#F5E6D3',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HONOR', 'SPIRIT', 'POWER', 'GRACE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC0000', '#1a1a1a', '#8B4513', '#003366'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5E6D3', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
