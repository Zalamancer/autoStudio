import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TornPaperConfig extends KineticBaseConfig {}

/** Generate an irregular torn-edge clip-path polygon string */
function tornEdgeClipPath(seed: number): string {
  // Top edge (torn)
  const topPoints: string[] = []
  for (let i = 0; i <= 20; i++) {
    const x = (i / 20) * 100
    const y = 2 + Math.sin(seed * 3 + i * 2.1) * 2.5 + Math.cos(seed * 7 + i * 3.7) * 1.5
    topPoints.push(`${x}% ${y}%`)
  }
  // Bottom edge (torn)
  const bottomPoints: string[] = []
  for (let i = 20; i >= 0; i--) {
    const x = (i / 20) * 100
    const y = 98 - Math.sin(seed * 5 + i * 1.9) * 2.5 - Math.cos(seed * 11 + i * 2.7) * 1.5
    bottomPoints.push(`${x}% ${y}%`)
  }
  return `polygon(${[...topPoints, ...bottomPoints].join(', ')})`
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
      {/* Subtle texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle at 25% 25%, rgba(0,0,0,0.015) 0%, transparent 6%)',
            'radial-gradient(circle at 75% 75%, rgba(0,0,0,0.01) 0%, transparent 8%)',
          ].join(', '),
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 67 + 41
    const clipPath = tornEdgeClipPath(seed)
    const paperBg = '#FFF8F0'

    // Paper strip component
    const paperStrip = (extraStyle: React.CSSProperties) => (
      <div
        style={{
          position: 'relative',
          background: paperBg,
          clipPath,
          padding: 'clamp(20px, 5vw, 50px) clamp(30px, 7vw, 70px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
          ...extraStyle,
        }}
      >
        {/* Paper fiber texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'linear-gradient(90deg, rgba(0,0,0,0.008) 1px, transparent 1px)',
              'linear-gradient(rgba(0,0,0,0.005) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '8px 12px',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(36px, 9vw, 110px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {word}
        </div>
      </div>
    )

    if (phase === 'enter') {
      // Paper strip slides in from left
      const easeOut = 1 - Math.pow(1 - enterProgress, 3)
      const xOffset = (1 - easeOut) * -500
      const rotation = (1 - easeOut) * -5

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${xOffset}px), -50%) rotate(${rotation}deg)`,
            opacity: Math.min(1, enterProgress * 2.5),
          }}
        >
          {paperStrip({})}
        </div>
      )
    }

    if (phase === 'hold') {
      // Subtle paper flutter
      const flutterY = Math.sin(holdProgress * Math.PI * 3 + seed) * 3
      const flutterRotation = Math.sin(holdProgress * Math.PI * 2 + seed * 2) * 0.8

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${flutterY}px)) rotate(${flutterRotation}deg)`,
          }}
        >
          {paperStrip({})}
        </div>
      )
    }

    // Exit: blows away with rotation
    const blowX = exitProgress * 400
    const blowY = exitProgress * exitProgress * -200
    const blowRotation = exitProgress * 35
    const opacity = 1 - exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${blowX}px), calc(-50% + ${blowY}px)) rotate(${blowRotation}deg)`,
          opacity,
        }}
      >
        {paperStrip({})}
      </div>
    )
  },
}

function TornPaperComponent(props: MotionGraphicProps<TornPaperConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-torn-paper',
  title: 'Kinetic Torn Paper',
  description: 'Text on a torn paper strip with irregular edges, paper texture, slide-in entry, and blow-away exit',
  tags: ['kinetic', 'typography', 'paper', 'torn', 'collage', 'organic', 'craft', 'texture'],
  category: 'captions',
  component: TornPaperComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'TRUTH', 'HIDDEN', 'FOUND'],
    colors: ['#2C3E50', '#8B4513', '#1B4F72', '#6C3483'],
    bgColor: '#E8DCC8',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'TRUTH', 'HIDDEN', 'FOUND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C3E50', '#8B4513', '#1B4F72', '#6C3483'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8DCC8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
