import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FiberChaseConfig extends KineticBaseConfig {
  dotCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const CHASE_COUNT = 5

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark velvet background — fiber optic display aesthetic */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(20,10,40,0.5) 0%, transparent 70%)',
          }}
        />
        {/* Distant fiber optic pin points scattered in background */}
        {Array.from({ length: 25 }, (_, i) => {
          const rx = rand(i * 61) * 100
          const ry = rand(i * 79) * 100
          const twinkle = Math.sin(time * (2 + rand(i * 31) * 4) + i * 1.7) * 0.5 + 0.5
          const c = ['#FF6BCB', '#00E5FF', '#FFD93D', '#6BCB77', '#C77DFF'][i % 5]
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${rx}%`,
                top: `${ry}%`,
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: c,
                opacity: twinkle * 0.5,
                filter: 'blur(0.5px)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const chars = word.split('')

    let globalOpacity = 0
    let chasePos = 0 // 0..1 position of the leading dot across the word
    let persistOpacity = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      globalOpacity = 1
      chasePos = enterProgress
      persistOpacity = p
    } else if (phase === 'hold') {
      globalOpacity = 1
      chasePos = 1
      // Secondary chase loop in hold phase
      persistOpacity = 1
    } else {
      globalOpacity = 1 - exitProgress
      chasePos = 1
      persistOpacity = 1 - exitProgress
    }

    const leadX = (chasePos - 0.5) * 80 // vw units offset
    const dotSize = 12

    return (
      <>
        {/* Revealed text — lights up progressively as chase passes */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            opacity: globalOpacity * persistOpacity,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - chasePos * 100}% 0 0)`,
            textShadow: `0 0 10px ${color}80, 0 0 20px ${color}40`,
          }}
        >
          {word}
        </div>
        {/* Fiber optic chase dots — staggered trail */}
        {Array.from({ length: CHASE_COUNT }, (_, i) => {
          if (chasePos < 0.01) return null
          const trailOffset = i * 0.05 // each dot trails slightly behind
          const trailPos = Math.max(0, chasePos - trailOffset)
          const dotX = (trailPos - 0.5) * 80
          const brightness = (1 - i / CHASE_COUNT)
          const dotOpacity = brightness * globalOpacity * (chasePos < 0.99 ? 1 : 0)
          const size = dotSize * (1 - i * 0.12)

          const colors = ['#FFFFFF', color, `${color}CC`, `${color}99`, `${color}66`]
          const dc = colors[i] || `${color}40`

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: `calc(50% + ${dotX}vw)`,
                transform: 'translate(-50%, -50%)',
                width: size,
                height: size,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${dc} 0%, transparent 70%)`,
                opacity: dotOpacity,
                filter: `blur(${i * 0.8}px)`,
              }}
            />
          )
        })}
        {/* Leading bloom flare */}
        {chasePos > 0.01 && chasePos < 0.99 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(50% + ${leadX}vw)`,
              transform: 'translate(-50%, -50%)',
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, ${color} 40%, transparent 70%)`,
              filter: 'blur(4px)',
              opacity: globalOpacity,
            }}
          />
        )}
        {/* Hold phase: secondary looping chase across already-lit text */}
        {phase === 'hold' && (
          Array.from({ length: 3 }, (_, i) => {
            const loopPos = (holdProgress + i / 3) % 1
            const lx = (loopPos - 0.5) * 80
            const lo = (1 - i / 3) * 0.3

            return (
              <div
                key={`loop-${i}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `calc(50% + ${lx}vw)`,
                  transform: 'translate(-50%, -50%)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: `rgba(255,255,255,${lo})`,
                  filter: 'blur(2px)',
                  opacity: globalOpacity,
                }}
              />
            )
          })
        )}
      </>
    )
  },
}

function FiberChaseComponent(props: MotionGraphicProps<FiberChaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fiber-chase',
  title: 'Kinetic Fiber Chase',
  description: 'A fiber optic light dot chases across letters, illuminating each letterform as it passes — staggered trailing dots create a glowing pursuit effect',
  tags: ['kinetic', 'typography', 'fiber-optic', 'chase', 'light', 'dot', 'reveal', 'glow', 'trail'],
  category: 'captions',
  component: FiberChaseComponent as any,
  defaultConfig: {
    words: ['CHASE', 'FIBER', 'OPTIC', 'GLOW'],
    colors: ['#FF6BCB', '#00E5FF', '#FFD93D', '#C77DFF'],
    bgColor: '#04020c',
    cycleDuration: 1.6,
    dotCount: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHASE', 'FIBER', 'OPTIC', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6BCB', '#00E5FF', '#FFD93D', '#C77DFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#04020c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'dotCount', label: 'Dot Count', type: 'number', defaultValue: 5, min: 2, max: 8, group: 'Animation' },
  ],
})
