import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg, ${bgColor} 0%, #0d2540 50%, #061525 100%)`,
      }}
    >
      {/* Frost shimmer overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 30%, rgba(173,216,230,0.05) 0%, transparent 50%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let scaleX = 1
    let rotation = 0

    const seed = index * 61 + 43

    if (phase === 'enter') {
      // Freeze in: scale from 1.2 to 1 with blue glow intensifying
      opacity = Math.min(1, enterProgress * 2)
      scale = 1.2 - enterProgress * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      // Shatter: scaleX breaks apart, opacity fades, slight rotation
      opacity = 1 - exitProgress
      scaleX = 1 + exitProgress * 0.6
      rotation = exitProgress * ((seed % 2 === 0) ? 5 : -5)
      scale = 1 - exitProgress * 0.15
    }

    // Crystalline shimmer during hold
    const shimmer = phase === 'hold'
      ? 0.8 + Math.sin(Date.now() * 0.005 + seed * 3) * 0.2
      : 1
    const glowSize = phase === 'enter'
      ? Math.round(enterProgress * 25)
      : phase === 'hold' ? Math.round(20 + Math.sin(Date.now() * 0.007 + seed) * 5) : Math.round(20 * (1 - exitProgress))

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) scaleX(${scaleX}) rotate(${rotation}deg)`,
          opacity: opacity * shimmer,
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 11vw, 150px)',
          fontWeight: 300,
          letterSpacing: 6,
          color,
          textShadow: [
            `0 0 ${glowSize}px rgba(0,191,255,0.7)`,
            `0 0 ${glowSize * 2}px rgba(135,206,235,0.4)`,
            `0 0 ${glowSize * 3}px rgba(173,216,230,0.2)`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function IceShatterComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ice-shatter',
  title: 'Kinetic Ice Shatter',
  description: 'Ice crystal typography with freeze-in entrance, crystalline shimmer, and shattering exit',
  tags: ['kinetic', 'typography', 'ice', 'crystal', 'shatter', 'cold', 'frozen'],
  category: 'captions',
  component: IceShatterComponent as any,
  defaultConfig: {
    words: ['FREEZE', 'CRYSTAL', 'SHATTER', 'FROST'],
    colors: ['#ADD8E6', '#00BFFF', '#E0FFFF', '#87CEEB'],
    bgColor: '#0a1a2a',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FREEZE', 'CRYSTAL', 'SHATTER', 'FROST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ADD8E6', '#00BFFF', '#E0FFFF', '#87CEEB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1a2a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
