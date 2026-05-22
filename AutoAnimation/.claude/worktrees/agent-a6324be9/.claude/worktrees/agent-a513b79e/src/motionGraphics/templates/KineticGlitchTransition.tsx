import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GlitchTransitionConfig extends KineticBaseConfig {
  stripCount: number
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const strips = 5
    const stripHeight = 100 / strips

    const glitchIntensity =
      phase === 'enter' ? 1 - enterProgress :
      phase === 'exit' ? exitProgress :
      holdProgress > 0.3 && holdProgress < 0.35 ? 0.15 : 0

    const opacity =
      phase === 'enter' ? Math.min(1, enterProgress * 3) :
      phase === 'exit' ? 1 - exitProgress * exitProgress : 1

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: strips }, (_, i) => {
          const seed = index * 100 + i * 17 + (phase === 'exit' ? 500 : 0)
          const offsetX = pseudoRandom(seed + 1) * 60 - 30
          const offsetY = pseudoRandom(seed + 2) * 10 - 5
          const colorShift = pseudoRandom(seed + 3) > 0.5

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                clipPath: `inset(${i * stripHeight}% 0 ${100 - (i + 1) * stripHeight}% 0)`,
                transform: `translateX(${offsetX * glitchIntensity}px) translateY(${offsetY * glitchIntensity}px)`,
                opacity,
              }}
            >
              <span
                style={{
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: 900,
                  color: colorShift && glitchIntensity > 0.3 ? '#ff0040' : color,
                  textShadow: glitchIntensity > 0.2
                    ? `${glitchIntensity * 8}px 0 rgba(0,255,255,0.7), ${-glitchIntensity * 8}px 0 rgba(255,0,64,0.7)`
                    : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {word}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function GlitchTransitionComponent(props: MotionGraphicProps<GlitchTransitionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-glitch-transition',
  title: 'Kinetic Glitch Transition',
  description: 'Words enter and exit with intense horizontal glitch slicing — strips offset randomly then converge to clean text',
  tags: ['kinetic', 'typography', 'transition', 'glitch', 'cyberpunk'],
  category: 'captions',
  component: GlitchTransitionComponent as any,
  defaultConfig: {
    words: ['GLITCH', 'ERROR', 'BREAK', 'HACK'],
    colors: ['#00FFFF', '#00FFFF', '#00FFFF', '#00FFFF'],
    bgColor: '#0a0a0f',
    cycleDuration: 1.5,
    stripCount: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLITCH', 'ERROR', 'BREAK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#00FFFF', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'stripCount', label: 'Strip Count', type: 'number', defaultValue: 5, min: 3, max: 10, group: 'Animation' },
  ],
})
