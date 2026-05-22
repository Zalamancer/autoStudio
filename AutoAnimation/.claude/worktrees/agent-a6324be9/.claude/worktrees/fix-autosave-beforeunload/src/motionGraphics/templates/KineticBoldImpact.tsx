import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BoldImpactConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateX = 0
    let rotation = 0
    let rgbOffsetR = 0
    let rgbOffsetB = 0

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      scale = 3 - 2 * eased
      opacity = Math.min(1, enterProgress * 4)
      // Chromatic aberration settles as word lands
      const aberration = (1 - eased) * 6
      rgbOffsetR = -aberration
      rgbOffsetB = aberration
      // Screen shake for first 30% after word lands
      if (enterProgress > 0.6 && enterProgress < 0.85) {
        const shakeT = (enterProgress - 0.6) / 0.25
        const shakeAmount = (1 - shakeT) * 4
        translateX = Math.sin(shakeT * Math.PI * 8) * shakeAmount
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.01
    } else {
      const eased = easeInBack(exitProgress)
      scale = 1 - eased
      rotation = eased * 15
      opacity = 1 - exitProgress
    }

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
      fontSize: 'clamp(52px, 16vw, 200px)',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }

    return (
      <>
        {/* Red channel offset */}
        {rgbOffsetR !== 0 && (
          <div
            style={{
              ...baseStyle,
              transform: `translate(calc(-50% + ${translateX + rgbOffsetR}px), -50%) scale(${scale})`,
              color: 'rgba(255,0,0,0.4)',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Blue channel offset */}
        {rgbOffsetB !== 0 && (
          <div
            style={{
              ...baseStyle,
              transform: `translate(calc(-50% + ${translateX + rgbOffsetB}px), -50%) scale(${scale})`,
              color: 'rgba(0,60,255,0.4)',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Main word */}
        <div
          style={{
            ...baseStyle,
            transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale}) rotate(${rotation}deg)`,
            opacity,
            color,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function BoldImpactComponent(props: MotionGraphicProps<BoldImpactConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bold-impact',
  title: 'Kinetic Bold Impact',
  description: 'Bold impact slam with chromatic aberration, screen shake, and dramatic scale-down exit',
  tags: ['kinetic', 'typography', 'impact', 'bold', 'slam', 'dramatic'],
  category: 'captions',
  component: BoldImpactComponent as any,
  defaultConfig: {
    words: ['SMASH', 'THE', 'LIKE', 'NOW'],
    colors: ['#FF4136', '#FF851B', '#FF4136', '#FF851B'],
    bgColor: '#0A0A0A',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SMASH', 'THE', 'LIKE', 'NOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4136', '#FF851B', '#FF4136'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
