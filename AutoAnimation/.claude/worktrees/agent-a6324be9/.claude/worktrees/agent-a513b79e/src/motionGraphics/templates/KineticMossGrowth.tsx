import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MossGrowthConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, #0a1505 0%, ${bgColor} 100%)`,
      }}
    >
      {/* Organic moss texture: irregular dark spots */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(ellipse at 10% 20%, rgba(0,80,0,0.08) 0%, transparent 15%)',
            'radial-gradient(ellipse at 30% 70%, rgba(0,60,0,0.06) 0%, transparent 12%)',
            'radial-gradient(ellipse at 70% 30%, rgba(20,80,0,0.07) 0%, transparent 18%)',
            'radial-gradient(ellipse at 85% 80%, rgba(0,70,10,0.05) 0%, transparent 14%)',
            'radial-gradient(ellipse at 55% 50%, rgba(10,90,0,0.04) 0%, transparent 20%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 57 + 23

    let opacity = 0
    let scale = 1
    let blur = 0
    let translateY = 0

    if (phase === 'enter') {
      // Moss creeps in slowly: fuzzy blur that resolves into the word
      // Non-linear: slow start, faster finish (like biological growth rate)
      const growthCurve = enterProgress * enterProgress * (3 - 2 * enterProgress)  // smoothstep
      opacity = Math.min(1, growthCurve * 3)
      scale = 0.85 + growthCurve * 0.15
      blur = (1 - growthCurve) * 10
      translateY = (1 - growthCurve) * 8
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Breathing of living organism
      const breathe = Math.sin(holdProgress * Math.PI * 2.5 + seed) * 0.01
      scale = 1 + breathe
    } else {
      // Wither: decay outward from center
      opacity = (1 - exitProgress) * (1 - exitProgress)
      blur = exitProgress * 8
      scale = 1 - exitProgress * 0.05
      translateY = exitProgress * 10
    }

    // Mossy texture on text: soft multi-layer green glow + grainy shadow
    const mossGlow = phase === 'hold'
      ? 8 + Math.sin(holdProgress * Math.PI * 4 + seed) * 3
      : 6
    const grainyDepth = `1px 1px 0 ${color}88, -1px 1px 0 ${color}55, 1px -1px 0 ${color}44`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 5,
          color,
          textShadow: [
            grainyDepth,
            `0 0 ${mossGlow}px ${color}77`,
            `0 0 ${mossGlow * 3}px ${color}33`,
            `0 3px 10px rgba(0,40,0,0.5)`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MossGrowthComponent(props: MotionGraphicProps<MossGrowthConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-moss-growth',
  title: 'Kinetic Moss Growth',
  description: 'Text creeps in slowly like moss growing on stone — fuzzy organic blur resolves then withers away',
  tags: ['kinetic', 'typography', 'moss', 'growth', 'organic', 'nature', 'plant', 'slow'],
  category: 'captions',
  component: MossGrowthComponent as any,
  defaultConfig: {
    words: ['GROW', 'WILD', 'DEEP', 'ROOT'],
    colors: ['#2D6A2D', '#4A8A3A', '#3A7A2A', '#5A9A4A'],
    bgColor: '#1A2A10',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GROW', 'WILD', 'DEEP', 'ROOT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2D6A2D', '#4A8A3A', '#3A7A2A', '#5A9A4A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A2A10', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.4, max: 6, group: 'Timing' },
  ],
})
