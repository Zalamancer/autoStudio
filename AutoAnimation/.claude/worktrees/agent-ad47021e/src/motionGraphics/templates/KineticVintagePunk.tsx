import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VintagePunkConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Speckle noise texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.08,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Deterministic values from index
    const seed = index * 137 + 42
    const tiltAngle = ((seed % 11) - 5) * 1.5 // -7.5 to 7.5 degrees

    let opacity = 0
    let scale = 1
    let rotation = tiltAngle

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 4)
      // Stamp in from large
      scale = 2 - enterProgress * 1
      rotation = tiltAngle + (1 - enterProgress) * ((seed % 2 === 0) ? 10 : -10)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      rotation = tiltAngle
    } else {
      opacity = 1 - exitProgress
      // Crumple: scale down with rotation increase
      scale = 1 - exitProgress * 0.3
      rotation = tiltAngle + exitProgress * 15
    }

    // Highlight background patch colors
    const highlightColors = ['rgba(255,0,68,0.25)', 'rgba(255,221,0,0.3)', 'rgba(0,102,255,0.2)', 'rgba(0,0,0,0.08)']
    const highlightColor = highlightColors[index % highlightColors.length]

    // Alternate bold/italic styles
    const isEven = index % 2 === 0
    const fontStyle = isEven ? 'normal' : 'italic'
    const fontWeight = isEven ? 900 : 700
    const fontSize = isEven ? 'clamp(48px, 14vw, 180px)' : 'clamp(40px, 11vw, 150px)'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        {/* Highlight patch behind text */}
        <div
          style={{
            position: 'absolute',
            inset: '-10px -15px',
            background: highlightColor,
            borderRadius: 2,
            transform: `rotate(${-tiltAngle * 0.3}deg)`,
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize,
            fontWeight,
            fontStyle,
            textTransform: 'uppercase',
            color,
            letterSpacing: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function VintagePunkComponent(props: MotionGraphicProps<VintagePunkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vintage-punk',
  title: 'Kinetic Vintage Punk',
  description: 'Punk zine ransom note style with stamped-in words, highlight patches, and mixed typography',
  tags: ['kinetic', 'typography', 'punk', 'zine', 'vintage'],
  category: 'captions',
  component: VintagePunkComponent as any,
  defaultConfig: {
    words: ['PUNK', 'NOT', 'DEAD', 'YET'],
    colors: ['#FF0044', '#000000', '#FFDD00', '#0066FF'],
    bgColor: '#F5E6D3',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PUNK', 'NOT', 'DEAD', 'YET'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF0044', '#000000', '#FFDD00', '#0066FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5E6D3', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
