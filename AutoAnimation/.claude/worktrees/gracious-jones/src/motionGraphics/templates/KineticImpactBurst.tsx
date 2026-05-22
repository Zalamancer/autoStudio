import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ImpactBurstConfig extends KineticBaseConfig {
  shakeIntensity: number
  minFontSize: number
  maxFontSize: number
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let scale = 0
    let opacity = 0
    let rotation = 0

    if (phase === 'enter') {
      scale = elasticOut(enterProgress) * 1
      opacity = Math.min(1, enterProgress * 3)
      rotation = (1 - enterProgress) * (Math.random() > 0.5 ? 15 : -15)
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
      rotation = 0
    } else {
      scale = 1 + exitProgress * 0.5
      opacity = 1 - exitProgress
      rotation = exitProgress * 10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: `clamp(40px, 12vw, 180px)`,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 2,
          color,
          textShadow: `0 0 20px ${color}, 0 0 60px ${color}, 2px 2px 0 rgba(0,0,0,0.5)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function ImpactBurstComponent(props: MotionGraphicProps<ImpactBurstConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-impact-burst',
  title: 'Kinetic Impact Burst',
  description: 'Words slam in from random directions with screen shake, sparks, and elastic easing',
  tags: ['kinetic', 'typography', 'impact', 'motion'],
  category: 'captions',
  component: ImpactBurstComponent as any,
  defaultConfig: {
    words: ['NEVER', 'GIVE', 'UP', 'ON', 'YOUR', 'DREAMS'],
    colors: ['#FF3366', '#00FFAA', '#FFD700', '#FF6B35', '#00BFFF', '#FF1493'],
    bgColor: 'rgba(0,0,0,0.85)',
    cycleDuration: 1,
    shakeIntensity: 15,
    minFontSize: 60,
    maxFontSize: 180,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEVER', 'GIVE', 'UP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00FFAA', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: 'rgba(0,0,0,0.85)', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
    { key: 'shakeIntensity', label: 'Shake Intensity', type: 'number', defaultValue: 15, min: 0, max: 50, group: 'Animation' },
  ],
})
