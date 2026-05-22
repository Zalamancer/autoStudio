import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PrismSplitConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    // Three RGB channels converge from different directions
    const channels = [
      { color: '#FF0033', blendMode: 'screen' as const, angle: 120 },  // Red from top-left
      { color: '#00FF66', blendMode: 'screen' as const, angle: 240 },  // Green from top-right
      { color: '#0066FF', blendMode: 'screen' as const, angle: 0 },    // Blue from bottom
    ]

    let separation = 0
    let mainOpacity = 0
    let channelOpacity = 0

    if (phase === 'enter') {
      const eased = easeOutQuint(enterProgress)
      separation = (1 - eased) * 60 // channels start 60px apart, converge to 0
      mainOpacity = Math.pow(enterProgress, 2)
      channelOpacity = 1 - enterProgress * 0.5
    } else if (phase === 'hold') {
      separation = 0
      mainOpacity = 1
      // Subtle chromatic breathing
      channelOpacity = 0.15 + Math.sin(holdProgress * Math.PI * 3) * 0.1
      separation = Math.sin(holdProgress * Math.PI * 2) * 3
    } else {
      const eased = easeInQuad(exitProgress)
      separation = eased * 80 // split apart on exit
      mainOpacity = 1 - exitProgress
      channelOpacity = exitProgress * 0.8
    }

    const channelElements = channels.map((ch, i) => {
      const angleRad = (ch.angle * Math.PI) / 180
      const offsetX = Math.cos(angleRad) * separation
      const offsetY = Math.sin(angleRad) * separation

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            color: ch.color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            mixBlendMode: ch.blendMode,
            opacity: channelOpacity,
          }}
        >
          {word}
        </div>
      )
    })

    return (
      <>
        {channelElements}
        {/* Main converged text on top */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: mainOpacity,
            textShadow: separation < 5 ? '0 0 15px rgba(255,255,255,0.15)' : 'none',
          }}
        >
          {word}
        </div>
        {/* Prism light refraction line */}
        {phase === 'enter' && enterProgress > 0.1 && enterProgress < 0.8 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-15deg)',
              width: width * 0.6,
              height: 2,
              background: `linear-gradient(90deg, transparent, #FF003320, #00FF6620, #0066FF20, transparent)`,
              opacity: 1 - enterProgress,
              pointerEvents: 'none',
            }}
          />
        )}
      </>
    )
  },
}

function PrismSplitComponent(props: MotionGraphicProps<PrismSplitConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-prism-split',
  title: 'Kinetic Prism Split',
  description: 'Text splits into RGB color channels that converge from three directions with screen blending',
  tags: ['kinetic', 'typography', 'prism', 'rgb', 'chromatic', 'split', 'geometric'],
  category: 'captions',
  component: PrismSplitComponent as any,
  defaultConfig: {
    words: ['PRISM', 'LIGHT', 'SPLIT', 'COLOR'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#080808',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRISM', 'LIGHT', 'SPLIT', 'COLOR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
