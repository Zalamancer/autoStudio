import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Music Genre: K-pop — lightstick glow, concert fanchant energy, pastel glimmer, idol aesthetic
// Mechanic: text blooms up like lightsticks being raised at a concert, glows in sync

interface KpopLightstickConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Concert darkness with lightstick glow columns rising
    const sticks = Array.from({ length: 24 }, (_, i) => {
      const x = (i / 23) * 100
      const phase = i * 0.4
      const glow = 0.3 + Math.sin(time * 2.5 + phase) * 0.25
      const height = 15 + Math.sin(time * 2 + phase) * 8   // sticks raise and lower
      const hue = (i * 15 + time * 20) % 360
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            bottom: 0,
            width: 3,
            height: `${height}%`,
            background: `hsla(${hue}, 90%, 70%, ${glow})`,
            boxShadow: `0 0 8px 3px hsla(${hue}, 90%, 70%, ${glow * 0.5})`,
            borderRadius: 2,
            transform: 'translateX(-50%)',
          }}
        />
      )
    })

    // Concert spotlight rays from above
    const rays = Array.from({ length: 4 }, (_, i) => {
      const x = 20 + i * 20
      const opacity = 0.04 + Math.sin(time * 0.8 + i * 0.9) * 0.02
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: `${x}%`,
            width: 60,
            height: '60%',
            background: `linear-gradient(180deg, rgba(255,255,255,${opacity}), transparent)`,
            transform: 'translateX(-50%)',
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#050510' }}>
        {rays}
        {sticks}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame, fps }: WordRenderProps) => {
    // K-pop idol reveal: bloom up from below like a stage rising
    const f = frame ?? 0
    const time = f / (fps ?? 30)
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    let opacity = 0
    let translateY = 0
    let scale = 1
    let glowOpacity = 0

    if (phase === 'enter') {
      const e = easeOutCubic(enterProgress)
      opacity = e
      translateY = (1 - e) * 40
      scale = 0.85 + e * 0.15
      glowOpacity = e * 0.8
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(time * 3) * 3    // breathing shimmer
      scale = 1 + Math.sin(time * 2.5) * 0.01
      glowOpacity = 0.6 + Math.sin(time * 3) * 0.2
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 20
      glowOpacity = (1 - exitProgress) * 0.6
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
        }}
      >
        {/* Glow halo behind text */}
        <div
          style={{
            position: 'absolute',
            inset: '-20px -40px',
            background: `radial-gradient(ellipse, ${color}33 0%, transparent 70%)`,
            opacity: glowOpacity,
            filter: 'blur(10px)',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            whiteSpace: 'nowrap',
            textShadow: `
              0 0 20px ${color},
              0 0 40px ${color}88,
              0 0 80px ${color}44
            `,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function KpopLightstickComponent(props: MotionGraphicProps<KpopLightstickConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-kpop-lightstick',
  title: 'Kinetic K-pop Lightstick',
  description: 'K-pop concert aesthetic: text blooms with lightstick glow, waving fan sticks below, concert spotlight rays',
  tags: ['kinetic', 'typography', 'kpop', 'k-pop', 'concert', 'lightstick', 'glow', 'music', 'idol'],
  category: 'captions',
  component: KpopLightstickComponent as any,
  defaultConfig: {
    words: ['IDOL', 'STAN', 'FAVE', 'GLOW'],
    colors: ['#ff85c8', '#a78bfa', '#60d8fa', '#ffd700'],
    bgColor: '#050510',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['IDOL', 'STAN', 'FAVE', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff85c8', '#a78bfa', '#60d8fa', '#ffd700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
