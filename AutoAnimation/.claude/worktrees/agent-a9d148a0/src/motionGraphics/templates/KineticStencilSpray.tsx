import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        backgroundImage: [
          'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)',
          'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)',
        ].join(', '),
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0
    let scaleY = 1

    if (phase === 'enter') {
      // Spray on: expand from center with increasing opacity
      opacity = Math.min(1, enterProgress * 1.8)
      scale = 0.3 + enterProgress * 0.7
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      // Drip down: translateY positive with stretch
      opacity = 1 - exitProgress * 0.8
      translateY = exitProgress * 60
      scaleY = 1 + exitProgress * 0.4
    }

    return (
      <>
        {/* Overspray glow layer */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 12vw, 170px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 6,
              color: 'transparent',
              textShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
              whiteSpace: 'nowrap',
              opacity: 0.3,
            }}
          >
            {word}
          </div>
        )}
        {/* Main stencil text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) scaleY(${scaleY})`,
            opacity,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function StencilSprayComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stencil-spray',
  title: 'Kinetic Stencil Spray',
  description: 'Stencil spray paint on concrete with expanding spray-on entrance and dripping exit',
  tags: ['kinetic', 'typography', 'stencil', 'spray', 'graffiti', 'urban'],
  category: 'captions',
  component: StencilSprayComponent as any,
  defaultConfig: {
    words: ['REBEL', 'RESIST', 'REVOLT', 'RISE'],
    colors: ['#FF0000', '#FFFFFF', '#000000', '#FFDD00'],
    bgColor: '#808080',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REBEL', 'RESIST', 'REVOLT', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF0000', '#FFFFFF', '#000000', '#FFDD00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#808080', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
