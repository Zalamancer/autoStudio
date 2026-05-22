import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AuroraWaveConfig extends KineticBaseConfig {}

const AURORA_COLORS = ['rgba(0,255,128,0.15)', 'rgba(0,191,255,0.12)', 'rgba(139,92,246,0.1)']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    const gradientPos = ((time * 15) % width)
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${AURORA_COLORS[0]} 0%, ${AURORA_COLORS[1]} ${30 + Math.sin(time * 0.5) * 10}%, ${AURORA_COLORS[2]} 70%, transparent 100%)`,
            opacity: 0.6 + Math.sin(time * 0.8) * 0.2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: gradientPos,
            width: 200,
            height: '40%',
            background: 'radial-gradient(ellipse, rgba(0,255,128,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      translateY = Math.sin(enterProgress * Math.PI * 0.5) * -15 + 15
      blur = (1 - enterProgress) * 4
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 3

      const t = holdProgress
      const green = Math.max(0, Math.sin(t * Math.PI * 2) * 0.4 + 0.3)
      const blue = Math.max(0, Math.sin(t * Math.PI * 2 + 2) * 0.4 + 0.3)
      const purple = Math.max(0, Math.sin(t * Math.PI * 2 + 4) * 0.4 + 0.3)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px))`,
            opacity,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 200,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color,
            textShadow: `0 0 ${15 + green * 20}px rgba(0,255,128,${green}), 0 0 ${15 + blue * 20}px rgba(0,191,255,${blue}), 0 0 ${15 + purple * 20}px rgba(139,92,246,${purple})`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 25
      blur = exitProgress * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 200,
          textTransform: 'uppercase',
          letterSpacing: 10,
          color,
          textShadow: `0 0 15px rgba(0,255,128,0.3), 0 0 30px rgba(0,191,255,0.2)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function AuroraWaveComponent(props: MotionGraphicProps<AuroraWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-aurora-wave',
  title: 'Kinetic Aurora Wave',
  description: 'Northern lights aurora borealis effect with shimmering color-shifting text',
  tags: ['kinetic', 'typography', 'aurora', 'northern-lights', 'ethereal'],
  category: 'captions',
  component: AuroraWaveComponent as any,
  defaultConfig: {
    words: ['AURORA', 'LIGHT', 'GLOW', 'NORTH'],
    colors: ['#00FF80', '#00BFFF', '#8B5CF6', '#06B6D4'],
    bgColor: '#0a0f1f',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AURORA', 'LIGHT', 'GLOW', 'NORTH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF80', '#00BFFF', '#8B5CF6', '#06B6D4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f1f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
