import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ClayMorphConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Soft felt/clay texture via subtle grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.4' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.05,
          mixBlendMode: 'soft-light',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 67 + 31

    let opacity = 0
    let scaleX = 1
    let scaleY = 1
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      // Clay being squished into shape: starts as flat blob, rises and forms
      opacity = Math.min(1, enterProgress * 2.5)
      // Start very wide and flat (squished blob), morph to normal
      const blob = 1 - enterProgress
      scaleX = 1 + blob * 0.6      // wide squat blob
      scaleY = 0.3 + enterProgress * 0.7  // rises as it forms
      translateY = blob * 20        // starts lower
      blur = blob * 3
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle clay wobble — soft material micro-deform
      const jiggle = Math.sin(holdProgress * Math.PI * 5 + seed) * 0.015
      scaleX = 1 + jiggle
      scaleY = 1 - jiggle * 0.5
      translateY = Math.sin(holdProgress * Math.PI * 3 + seed) * 2
    } else {
      // Clay squishes back: text flattens downward
      opacity = 1 - exitProgress
      scaleX = 1 + exitProgress * 0.4
      scaleY = 1 - exitProgress * 0.5
      translateY = exitProgress * 25
      blur = exitProgress * 4
    }

    // Clay body appearance: 3D rounded look via thick drop shadow + highlight
    const shadowBlur = 12
    const highlightY = -3

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Fredoka One', 'Nunito', 'Segoe UI', sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color,
          textShadow: [
            // 3D clay depth
            `3px 4px 0 ${color}cc`,
            `6px 8px 0 ${color}88`,
            `9px 12px 0 ${color}44`,
            // Ground shadow
            `0 14px ${shadowBlur}px rgba(0,0,0,0.25)`,
            // Top highlight (bright)
            `0 ${highlightY}px 0 rgba(255,255,255,0.25)`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function ClayMorphComponent(props: MotionGraphicProps<ClayMorphConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-clay-morph',
  title: 'Kinetic Clay Morph',
  description: 'Letters morph from a squished clay blob into 3D rounded text with soft highlight and shadow depth',
  tags: ['kinetic', 'typography', 'clay', 'morph', '3d', 'dough', 'squish', 'organic', 'playful'],
  category: 'captions',
  component: ClayMorphComponent as any,
  defaultConfig: {
    words: ['SQUISH', 'MOLD', 'SHAPE', 'PLAY'],
    colors: ['#E74C3C', '#3498DB', '#27AE60', '#F39C12'],
    bgColor: '#FDF3E7',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SQUISH', 'MOLD', 'SHAPE', 'PLAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E74C3C', '#3498DB', '#27AE60', '#F39C12'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FDF3E7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
