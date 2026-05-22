import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LiquidFillConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let fillPercent = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
      // Fill from bottom: 0% to 100%
      fillPercent = enterProgress * 100
    } else if (phase === 'hold') {
      opacity = 1
      fillPercent = 100
    } else {
      opacity = 1 - exitProgress * 0.5
      // Drain: fill level drops
      fillPercent = (1 - exitProgress) * 100
    }

    // Wave offset on the clip boundary
    const phaseProgress = phase === 'hold' ? holdProgress : phase === 'enter' ? enterProgress : exitProgress
    const waveY = phase === 'hold'
      ? Math.sin(holdProgress * Math.PI * 4) * 2
      : Math.sin(phaseProgress * Math.PI * 6) * 1.5

    // Clip from bottom: inset(top 0 0 0) — top = 100% - fillPercent
    const clipTop = 100 - fillPercent + waveY

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Outline text (always visible) */}
        <div
          style={{
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'transparent',
            WebkitTextStroke: `2px ${color}`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
        {/* Filled text (clipped) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            clipPath: `inset(${Math.max(0, clipTop)}% 0 0 0)`,
            textShadow: `0 0 20px ${color}`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LiquidFillComponent(props: MotionGraphicProps<LiquidFillConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-liquid-fill',
  title: 'Kinetic Liquid Fill',
  description: 'Text appears as outline then fills with color from bottom with a wave clip effect',
  tags: ['kinetic', 'typography', 'liquid', 'fill', 'wave'],
  category: 'captions',
  component: LiquidFillComponent as any,
  defaultConfig: {
    words: ['FLOW', 'FILL', 'SURGE', 'WAVE'],
    colors: ['#00BFFF', '#FF6B35', '#00FFAA', '#FF3366'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLOW', 'FILL', 'SURGE', 'WAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00BFFF', '#FF6B35', '#00FFAA', '#FF3366'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
