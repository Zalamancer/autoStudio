import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UnravelThreadConfig extends KineticBaseConfig {
  threadWeight: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Loose thread strands drifting in background
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {Array.from({ length: 8 }, (_, i) => {
          const x1 = ((i * 0.14 + t * 0.04 * (i % 2 === 0 ? 0.8 : -0.6)) % 1) * width
          const y1 = (i * 0.13) * height
          const curve = Math.sin(t * 0.9 + i * 1.3) * 30
          return (
            <svg
              key={i}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 + (i % 3) * 0.02 }}
              viewBox={`0 0 ${width || 1080} ${height || 1920}`}
              preserveAspectRatio="none"
            >
              <path
                d={`M ${x1.toFixed(0)} ${y1.toFixed(0)} Q ${(x1 + 60).toFixed(0)} ${(y1 + curve).toFixed(0)} ${(x1 + 120).toFixed(0)} ${y1.toFixed(0)}`}
                stroke={i % 3 === 0 ? '#CC4466' : i % 3 === 1 ? '#6688CC' : '#CCAA44'}
                strokeWidth={0.8 + (i % 2) * 0.5}
                fill="none"
                strokeLinecap="round"
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
        // Thread winds/coils into letter shape from a spool — rotational entry
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.5) / 0.7))
        const ep = easeOutBack(Math.min(1, p))

        rotate = (1 - ep) * (ci % 2 === 0 ? -360 : 360)
        scaleX = 0.1 + ep * 0.9
        scaleY = 0.1 + ep * 0.9
        opacity = p < 0.15 ? p / 0.15 : 1
        // Thread-spring: slightly overshoots
        xOff = (1 - ep) * (ci % 2 === 0 ? -20 : 20)
        yOff = (1 - ep) * -15
        blur = (1 - Math.min(1, p * 3)) * 3

      } else if (phase === 'hold') {
        // Thread tension: letters vibrate with thread-plucking frequency
        const tension = Math.exp(-holdProgress * 3)
        const freq = 8 + ci * 0.5
        yOff = Math.sin(t * freq) * 2.5 * tension
        xOff = Math.cos(t * (freq * 0.7) + ci) * 1.5 * tension
        rotate = Math.sin(t * 4 + ci * 0.8) * 1.5 * tension
        // Slow steady sag as tension eases
        scaleX = 1 + Math.sin(t * 2 + ci * 0.4) * 0.015
        scaleY = 1 - Math.sin(t * 2 + ci * 0.4) * 0.01

      } else {
        // Unravel: thread pulls loose from the last character first
        const reverseDelay = (word.length - 1 - ci) / word.length * 0.5
        const p = Math.max(0, Math.min(1, (exitProgress - reverseDelay) / 0.6))
        const ep = easeInExpo(p)

        // Spin out as if wound back onto spool
        rotate = ep * (ci % 2 === 0 ? 720 : -540)
        scaleX = 1 - ep * 0.9
        scaleY = 1 - ep * 0.9
        opacity = 1 - ep
        // Thread tail whips away
        xOff = ep * (ci % 2 === 0 ? 30 : -30)
        yOff = ep * -25
        blur = ep * 3
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
            textShadow: `0 1px 4px rgba(0,0,0,0.4)`,
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
            fontFamily: "'Georgia', 'Times New Roman', serif",
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

function UnravelThreadComponent(props: MotionGraphicProps<UnravelThreadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-unravel-thread',
  title: 'Kinetic Unravel Thread',
  description: 'Letters formed by thread winding into shape from a spool — spinning entry, plucked-string vibration during hold, then unraveling back out. Loose thread strands drift in background.',
  tags: ['kinetic', 'typography', 'fabric', 'thread', 'unravel', 'textile', 'spool', 'wind', 'material-physics'],
  category: 'captions',
  component: UnravelThreadComponent as any,
  defaultConfig: {
    words: ['WEAVE', 'SPIN', 'THREAD', 'UNWIND'],
    colors: ['#CC4466', '#BB3355', '#DD5577', '#AA2244'],
    bgColor: '#100810',
    cycleDuration: 1.8,
    threadWeight: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WEAVE', 'SPIN', 'THREAD', 'UNWIND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC4466', '#BB3355', '#DD5577', '#AA2244'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'threadWeight', label: 'Thread Weight', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
