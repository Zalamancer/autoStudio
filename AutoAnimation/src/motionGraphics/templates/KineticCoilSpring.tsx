import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CoilSpringConfig extends KineticBaseConfig {
  coilTurns: number
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeInQuart(t: number): number { return t * t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal coil reference lines */}
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: `${30 + i * 6}%`,
            height: 1,
            background: `rgba(255,255,255,${0.02 + Math.sin(time * 3 + i) * 0.01})`,
          }} />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, height }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        {chars.map((ch, ci) => {
          // Each character uncoils from a flat disk to full height with stagger
          const stagger = ci * 0.06
          let scaleY = 1
          let scaleX = 1
          let opacity = 1
          let skewX = 0
          let blur = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.7)))
            const uncoil = easeOutBack(p)

            // Start as flat disk (scaleY near 0, scaleX bloated)
            scaleY = Math.max(0.02, uncoil)
            scaleX = 1 + (1 - uncoil) * 0.8  // Wider when compressed = spring compressed
            // Slight skew during rapid extension
            skewX = (1 - uncoil) * 8 * (ci % 2 === 0 ? 1 : -1)
            blur = (1 - p) * 4
            opacity = Math.min(1, p * 5)
          } else if (phase === 'hold') {
            // Spring resonance: gentle vertical oscillation
            const oscillate = Math.sin(holdProgress * Math.PI * 5 + ci * 0.7) * (1 - holdProgress * 0.6) * 0.06
            scaleY = 1 + oscillate
            scaleX = 1 - oscillate * 0.3
          } else {
            // Compress back to disk and collapse
            const ep = easeInQuart(exitProgress)
            scaleY = 1 - ep * 0.95
            scaleX = 1 + ep * 0.7
            blur = ep * 5
            opacity = exitProgress > 0.6 ? 1 - (exitProgress - 0.6) / 0.4 : 1
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
              transformOrigin: 'center bottom',
              opacity,
              filter: blur > 0.5 ? `blur(${blur}px)` : 'none',
              whiteSpace: 'pre',
              textShadow: `0 ${scaleY * 8}px ${scaleY * 16}px rgba(0,0,0,0.5)`,
              lineHeight: 1,
            }}>
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function CoilSpringComponent(props: MotionGraphicProps<CoilSpringConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-coil-spring',
  title: 'Kinetic Coil Spring',
  description: 'Each character uncoils from a flat compressed disk to full height like a coil spring extending, with elastic overshoot and residual spring oscillation',
  tags: ['kinetic', 'typography', 'coil', 'spring', 'elastic', 'compress', 'extend', 'physics', 'deform'],
  category: 'captions',
  component: CoilSpringComponent as any,
  defaultConfig: {
    words: ['COIL', 'SPRING', 'LOAD', 'POP'],
    colors: ['#06D6A0', '#118AB2', '#073B4C', '#FFD166'],
    bgColor: '#023E8A',
    cycleDuration: 1.5,
    coilTurns: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COIL', 'SPRING', 'LOAD', 'POP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#06D6A0', '#118AB2', '#073B4C', '#FFD166'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#023E8A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'coilTurns', label: 'Spring Coil Turns', type: 'number', defaultValue: 5, min: 2, max: 10, group: 'Animation' },
  ],
})
