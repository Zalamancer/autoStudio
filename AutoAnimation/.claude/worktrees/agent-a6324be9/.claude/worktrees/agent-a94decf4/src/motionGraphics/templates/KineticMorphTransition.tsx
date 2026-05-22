import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MorphTransitionConfig extends KineticBaseConfig {
  blobColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function morphRadius(base: number, offset: number, progress: number): string {
  const a = base + Math.sin(progress * Math.PI * 2 + offset) * 15
  const b = base + Math.cos(progress * Math.PI * 2 + offset * 1.3) * 15
  const c = base + Math.sin(progress * Math.PI * 2 + offset * 0.7) * 15
  const d = base + Math.cos(progress * Math.PI * 2 + offset * 1.6) * 15
  return `${a}% ${100 - b}% ${c}% ${100 - d}% / ${b}% ${a}% ${100 - c}% ${d}%`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let blobScale = 0
    let textOpacity = 0
    let morphProgress = 0

    if (phase === 'enter') {
      blobScale = easeOutBack(enterProgress)
      textOpacity = Math.max(0, (enterProgress - 0.4) / 0.6)
      morphProgress = enterProgress * 2
    } else if (phase === 'hold') {
      blobScale = 1
      textOpacity = 1
      morphProgress = holdProgress * 4
    } else {
      blobScale = 1 - easeInCubic(exitProgress)
      textOpacity = 1 - exitProgress * 1.5
      morphProgress = exitProgress * 2
    }

    const borderRadius = morphRadius(40, index * 1.5, morphProgress)

    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Morphing blob */}
        <div
          style={{
            position: 'absolute',
            width: 'clamp(200px, 50vw, 500px)',
            height: 'clamp(200px, 50vw, 500px)',
            borderRadius,
            background: '#8B5CF6',
            transform: `scale(${blobScale})`,
            boxShadow: '0 0 60px rgba(139,92,246,0.4)',
            transition: 'border-radius 0.1s',
          }}
        />
        {/* Word */}
        <div
          style={{
            position: 'relative',
            opacity: Math.max(0, textOpacity),
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MorphTransitionComponent(props: MotionGraphicProps<MorphTransitionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-morph-transition',
  title: 'Kinetic Morph Blob',
  description: 'Organic blob expands and morphs behind each word — liquid shape-shifting background with text fade',
  tags: ['kinetic', 'typography', 'transition', 'morph', 'blob', 'organic'],
  category: 'captions',
  component: MorphTransitionComponent as any,
  defaultConfig: {
    words: ['MORPH', 'FLOW', 'SHIFT', 'FORM'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#0f0f1a',
    cycleDuration: 1.5,
    blobColor: '#8B5CF6',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MORPH', 'FLOW', 'SHIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'blobColor', label: 'Blob Color', type: 'color', defaultValue: '#8B5CF6', group: 'Animation' },
  ],
})
