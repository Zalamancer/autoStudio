import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CartoonSquashConfig extends KineticBaseConfig {}

// Exaggerated cartoon squash-and-stretch physics
// Text drops from above, squashes flat on impact, stretches tall on rebound
// Multiple bounces with decreasing amplitude — Looney Tunes energy

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Animated polka-dot background — cartoon classic
    const dotOffset = (time * 12) % 20
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Polka dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 6px, transparent 6px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: `${dotOffset}px ${dotOffset}px`,
          }}
        />
        {/* Secondary offset dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.06) 4px, transparent 4px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: `${15 + dotOffset * 0.5}px ${15 + dotOffset * 0.3}px`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, height }: WordRenderProps) => {
    const seed = index * 53 + 23

    let scaleX = 1
    let scaleY = 1
    let translateY = 0
    let opacity = 1
    let shadowScaleX = 1
    let shadowOpacity = 0.3

    const dropHeight = height * 0.55
    const groundLevel = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 6)

      // Phase 1: Free fall from top (0..0.35) — stretch tall
      // Phase 2: Squash on impact (0.35..0.5)
      // Phase 3: Rebound bounce 1 (0.5..0.72)
      // Phase 4: Small squash (0.72..0.82)
      // Phase 5: Settle (0.82..1)
      const t = enterProgress

      if (t < 0.35) {
        // Falling — stretched tall
        const fallT = t / 0.35
        translateY = -dropHeight * (1 - fallT * fallT)
        scaleY = 1.35
        scaleX = 0.75
        shadowScaleX = 0.3 + fallT * 0.7
      } else if (t < 0.5) {
        // SQUASH! on impact
        const squashT = (t - 0.35) / 0.15
        translateY = groundLevel
        scaleX = 1 + squashT * 0.8   // very wide
        scaleY = 1 - squashT * 0.55  // very flat
        shadowScaleX = 1.4 - squashT * 0.2
      } else if (t < 0.72) {
        // Rebound — bounce up, stretch tall again
        const reboundT = (t - 0.5) / 0.22
        const arc = Math.sin(reboundT * Math.PI)
        translateY = -arc * dropHeight * 0.45
        scaleX = 0.82 + reboundT * 0.05
        scaleY = 1.25 - reboundT * 0.15
        shadowScaleX = 0.85 - arc * 0.25
      } else if (t < 0.82) {
        // Small squash 2
        const sq2T = (t - 0.72) / 0.1
        translateY = groundLevel
        scaleX = 1.2 - sq2T * 0.15
        scaleY = 0.88 + sq2T * 0.1
        shadowScaleX = 1.1
      } else {
        // Settle with gentle oscillation
        const settleT = (t - 0.82) / 0.18
        translateY = groundLevel
        scaleX = 1.05 - settleT * 0.05
        scaleY = 0.98 + settleT * 0.02
        shadowScaleX = 1
      }
    } else if (phase === 'hold') {
      // Gentle idle bob
      const bob = Math.sin(holdProgress * Math.PI * 6 + seed * 0.5) * 0.03
      scaleX = 1 + bob * 0.5
      scaleY = 1 - bob * 0.5
      translateY = groundLevel + Math.sin(holdProgress * Math.PI * 3) * 4
      shadowScaleX = 1 - bob * 0.3
    } else {
      // Exit: big stretch upward then vanish
      const launchT = exitProgress
      translateY = -launchT * dropHeight * 1.6
      scaleX = 0.7 - launchT * 0.2
      scaleY = 1.5 + launchT * 0.5
      opacity = 1 - exitProgress * 1.5
      shadowScaleX = 0.3 * (1 - exitProgress)
    }

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '50%',
          transform: `translateX(-50%) translateY(${-translateY}px)`,
          transformOrigin: 'center bottom',
          opacity: Math.max(0, opacity),
        }}
      >
        {/* Main text with squash/stretch */}
        <div
          style={{
            transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center bottom',
            fontFamily: "'Impact', 'Arial Black', 'Comic Sans MS', sans-serif",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: color,
            WebkitTextStroke: '3px #000000',
            textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {word}
        </div>

        {/* Ground shadow — squashes and stretches inversely */}
        <div
          style={{
            position: 'absolute',
            bottom: '-12px',
            left: '50%',
            transform: `translateX(-50%) scaleX(${shadowScaleX})`,
            width: '90%',
            height: '10px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.28)',
            filter: 'blur(4px)',
            opacity: phase === 'exit' ? 0 : 1,
          }}
        />
      </div>
    )
  },
}

function CartoonSquashComponent(props: MotionGraphicProps<CartoonSquashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cartoon-squash',
  title: 'Kinetic Cartoon Squash',
  description: 'Looney Tunes-style exaggerated squash-and-stretch: text free-falls, squashes flat on impact, rebounds with stretch, then gently bobs during hold',
  tags: ['kinetic', 'typography', 'comic', 'cartoon', 'squash', 'stretch', 'bounce', 'physics', 'looney-tunes'],
  category: 'captions',
  component: CartoonSquashComponent as any,
  defaultConfig: {
    words: ['SPLAT!', 'BOING!', 'THUD!', 'POP!'],
    colors: ['#FF3300', '#FF9900', '#FF0066', '#0066FF'],
    bgColor: '#FF6600',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPLAT!', 'BOING!', 'THUD!', 'POP!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF3300', '#FF9900', '#FF0066', '#0066FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FF6600', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
