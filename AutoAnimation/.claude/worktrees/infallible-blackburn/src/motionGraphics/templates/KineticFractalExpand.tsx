import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FractalExpandConfig extends KineticBaseConfig {
  iterations: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Generate fractal ring of copies at scale
function getFractalRing(level: number, count: number, baseRadius: number) {
  const scale = Math.pow(0.38, level)
  const radius = baseRadius * (1 + level * 0.5)
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.7,
      scale,
      opacity: Math.pow(0.6, level),
    }
  })
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Fractal spiral hint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // The fractal effect: word expands outward in concentric rings of smaller copies
    // then collapses back to full-size center word

    let expandProgress = 0
    let centerOpacity = 0
    let centerScale = 1
    let breathe = 0

    if (phase === 'enter') {
      // Rings expand outward first (0-50%), then collapse/form center word (40-100%)
      expandProgress = easeOutExpo(Math.min(1, enterProgress * 2))
      centerOpacity = Math.min(1, Math.max(0, (enterProgress - 0.4) / 0.6) * 2)
      centerScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))
      centerScale = Math.max(0.1, centerScale)
    } else if (phase === 'hold') {
      expandProgress = 1
      centerOpacity = 1
      centerScale = 1
      breathe = Math.sin(holdProgress * Math.PI * 2) * 0.03
    } else {
      const p = easeInCubic(exitProgress)
      expandProgress = 1 - p
      centerOpacity = 1 - p * p
      centerScale = 1 - p * 0.4
    }

    const level1 = getFractalRing(1, Math.min(totalChars, 6), 80)
    const level2 = getFractalRing(2, Math.min(totalChars * 2, 12), 130)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Level 2 fractal ring — smaller, outer */}
        {level2.map((item, i) => {
          const charToShow = chars[i % chars.length]
          const delay = i / level2.length * 0.4
          const itemP = Math.max(0, Math.min(1, (expandProgress - delay) / (1 - delay)))
          return (
            <div
              key={`l2-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translate(${item.x * itemP}px, ${item.y * itemP}px) scale(${item.scale * (1 + breathe)})`,
                opacity: item.opacity * itemP * expandProgress,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {charToShow}
              </span>
            </div>
          )
        })}

        {/* Level 1 fractal ring — medium, inner */}
        {level1.map((item, i) => {
          const charToShow = chars[i % chars.length]
          const delay = i / level1.length * 0.25
          const itemP = Math.max(0, Math.min(1, (expandProgress - delay) / (1 - delay)))
          return (
            <div
              key={`l1-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translate(${item.x * itemP}px, ${item.y * itemP}px) scale(${item.scale * (1 + breathe)})`,
                opacity: item.opacity * itemP * expandProgress,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {charToShow}
              </span>
            </div>
          )
        })}

        {/* Center — main word, full size */}
        <div
          style={{
            position: 'relative',
            transform: `scale(${centerScale * (1 + breathe * 0.5)})`,
            transformOrigin: 'center center',
            opacity: centerOpacity,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color,
              lineHeight: 1,
              display: 'block',
              textShadow: `0 0 30px ${color}60, 2px 2px 0 rgba(0,0,0,0.5)`,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function FractalExpandComponent(props: MotionGraphicProps<FractalExpandConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fractal-expand',
  title: 'Kinetic Fractal Expand',
  description: 'Miniature copies of the word expand outward in fractal rings — like a self-similar pattern branching into infinity — before collapsing back to reveal the full-size center word.',
  tags: ['kinetic', 'typography', 'fractal', 'expand', 'self-similar', 'rings', 'recursive', 'grow', 'organic'],
  category: 'captions',
  component: FractalExpandComponent as any,
  defaultConfig: {
    words: ['SCALE', 'GROW', 'EXPAND', 'INFINITE'],
    colors: ['#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E'],
    bgColor: '#0D0D1A',
    cycleDuration: 2.0,
    iterations: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCALE', 'GROW', 'EXPAND', 'INFINITE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D1A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'iterations', label: 'Iterations', type: 'number', defaultValue: 2, min: 1, max: 3, group: 'Animation' },
  ],
})
