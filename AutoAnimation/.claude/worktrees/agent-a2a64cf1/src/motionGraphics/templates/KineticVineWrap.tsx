import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VineWrapConfig extends KineticBaseConfig {
  vineDensity: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Background vine tendrils */}
        {Array.from({ length: 5 }, (_, i) => {
          const x = (i * 0.2 + 0.1) * (width || 1080)
          const wavyY = (height || 1920) * 0.5 + Math.sin(t * 0.6 + i * 1.2) * 60
          return (
            <svg
              key={i}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 + (i % 3) * 0.02 }}
              viewBox={`0 0 ${width || 1080} ${height || 1920}`}
              preserveAspectRatio="none"
            >
              <path
                d={`M ${x.toFixed(0)} 0 C ${(x + 30).toFixed(0)} ${(wavyY * 0.5).toFixed(0)}, ${(x - 30).toFixed(0)} ${(wavyY * 0.8).toFixed(0)}, ${x.toFixed(0)} ${(height || 1920)}`}
                stroke="#4A8040"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Leaf */}
              <ellipse
                cx={x + Math.sin(t * 0.8 + i) * 15}
                cy={wavyY}
                rx="12"
                ry="6"
                fill="rgba(60,120,50,0.15)"
                transform={`rotate(${30 + Math.sin(t * 0.5 + i) * 20} ${x} ${wavyY})`}
              />
            </svg>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      const charDelay = ci / (word.length + 1)
      let opacity = 1
      let xOff = 0
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let rotate = 0
      let blur = 0

      if (phase === 'enter') {
        // Vine tendril spirals in around each letter
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.5) / 0.7))
        const ep = easeOutBack(Math.min(1, p))

        // Spiral growth motion: rotate in from 0 scale
        rotate = (1 - ep) * (ci % 2 === 0 ? -270 : 270) * 0.5
        scaleX = 0.1 + ep * 0.9
        scaleY = 0.1 + ep * 0.9
        // Tendril curl approach: come in from below/side
        xOff = Math.sin(ci * 2.1 + index) * (1 - ep) * 25
        yOff = (1 - ep) * 20
        opacity = p < 0.1 ? p * 10 : 1
        blur = (1 - ep) * 3

      } else if (phase === 'hold') {
        // Vine sway: gentle phototropic swaying
        const sway = Math.sin(t * 1.5 + ci * 0.4)
        rotate = sway * 2
        yOff = Math.sin(t * 2 + ci * 0.6) * 2
        xOff = Math.cos(t * 1.3 + ci * 0.3) * 1.5
        // Leaf-like scale breathing (transpiration)
        scaleX = 1 + Math.sin(t * 2.5 + ci * 0.5) * 0.015
        scaleY = 1 + Math.sin(t * 2 + ci * 0.8) * 0.02

      } else {
        // Vine withers and retracts
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.9))
        const ep = easeInOutSine(p)

        scaleX = 1 - ep * 0.8
        scaleY = 1 - ep * 0.8
        rotate = ep * (ci % 2 === 0 ? 180 : -180)
        opacity = 1 - ep
        blur = ep * 4
        yOff = ep * 15
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 15px rgba(60,180,60,0.3), 0 2px 8px rgba(0,0,0,0.5)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function VineWrapComponent(props: MotionGraphicProps<VineWrapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vine-wrap',
  title: 'Kinetic Vine Wrap',
  description: 'Vine tendrils spiral in to wrap around letter forms: rotational entry with easeOutBack overshoot, phototropic sway during hold, and withering retraction on exit. Background shows climbing vine silhouettes with leaves.',
  tags: ['kinetic', 'typography', 'vine', 'plant', 'organic', 'growth', 'tendril', 'botanical', 'material-physics'],
  category: 'captions',
  component: VineWrapComponent as any,
  defaultConfig: {
    words: ['GROW', 'WILD', 'VINE', 'BLOOM'],
    colors: ['#5AAA40', '#48903A', '#6ABA50', '#409830'],
    bgColor: '#060C04',
    cycleDuration: 1.8,
    vineDensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GROW', 'WILD', 'VINE', 'BLOOM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5AAA40', '#48903A', '#6ABA50', '#409830'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060C04', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'vineDensity', label: 'Vine Density', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
