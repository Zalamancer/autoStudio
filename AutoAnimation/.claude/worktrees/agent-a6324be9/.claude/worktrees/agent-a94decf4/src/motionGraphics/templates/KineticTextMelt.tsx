import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TextMeltConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #2a0a00 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 47 + 11

    let opacity = 0
    let scaleY = 1
    let scaleX = 1
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      // Solidify from a molten pool: text forms from bottom up
      opacity = Math.min(1, enterProgress * 2.5)
      scaleY = 0.3 + enterProgress * 0.7
      scaleX = 1 + (1 - enterProgress) * 0.25  // wider when still molten
      blur = (1 - enterProgress) * 5
    } else if (phase === 'hold') {
      opacity = 1
      scaleY = 1
      scaleX = 1
      // Subtle sag — solid but barely holding
      const sag = Math.sin(holdProgress * Math.PI * 2 + seed) * 0.008
      scaleY = 1 - sag
      scaleX = 1 + sag * 0.5
    } else {
      // Melt: letters stretch downward and dissolve
      opacity = 1 - exitProgress * exitProgress
      scaleY = 1 + exitProgress * 1.8    // dramatic downward stretch
      scaleX = 1 - exitProgress * 0.35   // pinch inward as it droops
      translateY = exitProgress * 30     // drip downward
      blur = exitProgress * 8
    }

    // Drip shadow: elongated downward during melt
    const dripLen = phase === 'exit' ? exitProgress * 40 : 0
    const dripOpacity = phase === 'exit' ? exitProgress * 0.5 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        {/* Drip shadow layer */}
        {dripOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 5,
              color: `${color}88`,
              filter: `blur(8px)`,
              transform: `scaleY(${1 + dripLen / 20}) translateY(${dripLen * 0.5}px)`,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {word}
          </div>
        )}
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 5,
            color,
            textShadow: [
              `0 ${4 + dripLen * 0.5}px ${8 + dripLen}px ${color}88`,
              `0 0 20px ${color}44`,
            ].join(', '),
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function TextMeltComponent(props: MotionGraphicProps<TextMeltConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-text-melt',
  title: 'Kinetic Text Melt',
  description: 'Letters solidify from molten form on enter, then dramatically melt and drip downward on exit',
  tags: ['kinetic', 'typography', 'melt', 'molten', 'lava', 'drip', 'horror', 'organic'],
  category: 'captions',
  component: TextMeltComponent as any,
  defaultConfig: {
    words: ['MELT', 'DRIP', 'BURN', 'POUR'],
    colors: ['#FF4500', '#FF6B00', '#FFD700', '#FF3300'],
    bgColor: '#1a0500',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MELT', 'DRIP', 'BURN', 'POUR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4500', '#FF6B00', '#FFD700', '#FF3300'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0500', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 6, group: 'Timing' },
  ],
})
