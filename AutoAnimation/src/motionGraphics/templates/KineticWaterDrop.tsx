import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaterDropConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Gentle water surface caustic pattern
    const caustics = Array.from({ length: 8 }, (_, i) => {
      const cx = width * (0.1 + 0.8 * ((i * 0.137 + 0.5) % 1))
      const cy = height * (0.1 + 0.8 * ((i * 0.293 + 0.3) % 1))
      const drift = Math.sin(t * 0.5 + i * 0.9) * 25
      const driftY = Math.cos(t * 0.4 + i * 1.1) * 20
      const size = 80 + (i % 3) * 60
      const alpha = 0.04 + Math.sin(t * 0.8 + i * 0.6) * 0.02
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx + drift - size / 2,
            top: cy + driftY - size / 2,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(100, 180, 255, ${alpha}), transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {caustics}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Concentric ripple rings emanating from center on enter
    const ripples: React.ReactNode[] = []
    if (phase === 'enter' || phase === 'hold') {
      const numRings = 5
      const rippleBase = phase === 'enter' ? enterProgress : 1
      for (let r = 0; r < numRings; r++) {
        const delay = r * 0.15
        const rProgress = phase === 'enter'
          ? Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
          : Math.max(0, Math.min(1, (holdProgress * 0.3 + 1 - delay) / 1))
        if (rProgress <= 0) continue
        const ringSize = easeOutCubic(rProgress) * Math.min(width, height) * 0.8
        const ringOpacity = (1 - rProgress) * 0.35
        const holdFade = phase === 'hold' ? Math.max(0, 1 - holdProgress * 1.5) : 1
        ripples.push(
          <div
            key={r}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: ringSize,
              height: ringSize,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `2px solid ${color}`,
              opacity: ringOpacity * holdFade,
              pointerEvents: 'none',
            }}
          />,
        )
      }
    }

    // Text rendering with ripple-distortion effect
    const chars = word.split('').map((ch, ci) => {
      const charCenter = ci - (word.length - 1) / 2
      const distFromCenter = Math.abs(charCenter) / Math.max(1, word.length / 2)

      let charOpacity = 1
      let charScale = 1
      let yOff = 0

      if (phase === 'enter') {
        // Ripple outward from center: center chars appear first
        const rippleDelay = distFromCenter * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - rippleDelay) / 0.5))
        const ep = easeOutCubic(p)
        charOpacity = ep
        charScale = 0.4 + ep * 0.6
        // Vertical displacement simulating water surface tension
        yOff = (1 - ep) * 30 * (1 + distFromCenter)
      } else if (phase === 'hold') {
        // Gentle water surface bobbing
        yOff = Math.sin(t * 2.5 + ci * 0.7) * 4
        charScale = 1 + Math.sin(t * 1.8 + ci * 0.5) * 0.02
      } else {
        // Ripple collapse inward: outer chars vanish first
        const rippleDelay = (1 - distFromCenter) * 0.4
        const p = Math.max(0, Math.min(1, (exitProgress - rippleDelay) / 0.6))
        const ep = easeInQuad(p)
        charOpacity = 1 - ep
        charScale = 1 - ep * 0.4
        yOff = ep * 25
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scale(${charScale})`,
            textShadow: `0 0 12px ${color}60, 0 4px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Central splash on enter
    let splash: React.ReactNode = null
    if (phase === 'enter' && enterProgress < 0.4) {
      const splashP = enterProgress / 0.4
      const splashSize = easeOutCubic(splashP) * 60
      splash = (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: splashSize,
            height: splashSize,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}40, transparent 70%)`,
            opacity: 1 - splashP,
            pointerEvents: 'none',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {ripples}
        {splash}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(42px, 12vw, 150px)',
            fontWeight: 400,
            letterSpacing: 5,
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function WaterDropComponent(props: MotionGraphicProps<WaterDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-water-drop',
  title: 'Kinetic Water Drop',
  description: 'Text ripples outward from center like a water drop impact with concentric rings. Characters emerge in a wave pattern from the splash point.',
  tags: ['kinetic', 'typography', 'liquid', 'water', 'ripple', 'drop', 'splash', 'wave'],
  category: 'captions',
  component: WaterDropComponent as any,
  defaultConfig: {
    words: ['SPLASH', 'RIPPLE', 'WAVE', 'FLOW'],
    colors: ['#60A5FA', '#34D399', '#93C5FD', '#6EE7B7'],
    bgColor: '#0c1222',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPLASH', 'RIPPLE', 'WAVE', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#60A5FA', '#34D399', '#93C5FD', '#6EE7B7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1222', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
