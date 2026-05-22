import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OutlineStrokeConfig extends KineticBaseConfig {
  strokeWidth: number
  strokeColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let strokeOpacity = 1
    let fillOpacity = 0
    let scale = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      strokeOpacity = eased
      // Fill fades in during second half of enter
      fillOpacity = enterProgress > 0.5 ? easeOutCubic((enterProgress - 0.5) * 2) : 0
      scale = 0.9 + eased * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      strokeOpacity = 1
      fillOpacity = 1
      scale = 1
      // Subtle stroke pulse
      strokeOpacity = 0.7 + Math.sin(holdProgress * Math.PI * 6) * 0.3
    } else {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased * 0.5
      // Fill drains away, leaving outline
      fillOpacity = 1 - easeOutCubic(exitProgress)
      strokeOpacity = 1 - eased
      scale = 1 - eased * 0.05
    }

    const baseTextStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize: 'clamp(48px, 14vw, 180px)',
      fontWeight: 800,
      whiteSpace: 'nowrap',
      letterSpacing: '-0.01em',
    }

    return (
      <div style={{ opacity }}>
        {/* Outline layer */}
        <div
          style={{
            ...baseTextStyle,
            transform: `translate(-50%, -50%) scale(${scale})`,
            color: 'transparent',
            WebkitTextStroke: `2px ${color}`,
            opacity: strokeOpacity,
          }}
        >
          {word}
        </div>
        {/* Fill layer */}
        <div
          style={{
            ...baseTextStyle,
            transform: `translate(-50%, -50%) scale(${scale})`,
            color,
            opacity: fillOpacity,
            textShadow: `0 0 20px ${color}44, 0 0 40px ${color}22`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function OutlineStrokeComponent(props: MotionGraphicProps<OutlineStrokeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-outline-stroke',
  title: 'Kinetic Outline Stroke',
  description: 'Text appears as outline stroke that fills in during enter, drains back to outline on exit with pulse effect',
  tags: ['kinetic', 'typography', 'outline', 'stroke', 'fill', 'elegant'],
  category: 'captions',
  component: OutlineStrokeComponent as any,
  defaultConfig: {
    words: ['THINK', 'BIG', 'ACT', 'BOLD'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#000000',
    cycleDuration: 1.1,
    strokeWidth: 2,
    strokeColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THINK', 'BIG', 'ACT', 'BOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'strokeWidth', label: 'Stroke Width', type: 'number', defaultValue: 2, min: 1, max: 6, group: 'Style' },
    { key: 'strokeColor', label: 'Stroke Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
