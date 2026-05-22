import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SmokeCurlConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Ambient smoke wisps drifting across background
    const wisps = Array.from({ length: 5 }, (_, i) => {
      const baseX = width * ((i * 0.23 + t * 0.03 + 0.1) % 1.2 - 0.1)
      const baseY = height * (0.3 + 0.4 * rand(i * 41))
      const sizeW = 100 + rand(i * 19) * 150
      const sizeH = 40 + rand(i * 37) * 60
      const curl = Math.sin(t * 0.8 + i * 1.5) * 30
      const rise = -t * 10 * (0.5 + rand(i * 23) * 0.5)
      const alpha = 0.04 + Math.sin(t * 0.5 + i) * 0.02

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: baseX + curl,
            top: baseY + (rise % height),
            width: sizeW,
            height: sizeH,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(180, 180, 195, ${alpha}), transparent 70%)`,
            filter: 'blur(25px)',
            transform: `rotate(${Math.sin(t * 0.4 + i * 0.7) * 15}deg)`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {wisps}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Smoke particle wisps around text
    const smokeParticles: React.ReactNode[] = []
    const numParticles = 12

    if (phase === 'exit') {
      // More particles during dissolve
      for (let p = 0; p < numParticles; p++) {
        const pProgress = Math.max(0, Math.min(1, (exitProgress - p / numParticles * 0.3) / 0.7))
        if (pProgress <= 0) continue
        const ep = easeOutQuart(pProgress)
        const angle = (p / numParticles) * Math.PI * 2 + Math.sin(t * 2 + p) * 0.5
        const radius = ep * 80 + Math.sin(t * 3 + p * 0.7) * 15
        const px = Math.cos(angle) * radius
        const py = Math.sin(angle) * radius - ep * 40
        const size = 15 + rand(p * 31 + index) * 25
        smokeParticles.push(
          <div
            key={`s${p}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size,
              height: size * 0.6,
              transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${angle * 30}deg)`,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${color}30, transparent 70%)`,
              opacity: (1 - ep) * 0.6,
              filter: 'blur(6px)',
            }}
          />,
        )
      }
    }

    // Text with smoke curl effect
    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let blur = 0
      let charScale = 1

      if (phase === 'enter') {
        // Reform from smoke: blurry wisps coalesce into sharp text
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutQuart(p)

        charOpacity = ep
        blur = (1 - ep) * 8
        // Curl in from above like smoke
        yOff = -(1 - ep) * 50
        xOff = Math.sin(ci * 1.3 + index) * (1 - ep) * 30
        charScale = 0.6 + ep * 0.4
      } else if (phase === 'hold') {
        // Gentle smoke-like drift
        const wt = t * 1.5 + ci * 0.6
        yOff = Math.sin(wt) * 4
        xOff = Math.cos(wt * 0.7) * 2
        // Very subtle blur pulse like heat shimmer
        blur = Math.sin(t * 3 + ci * 0.4) * 0.5 + 0.5
      } else {
        // Dissolve into curling smoke wisps
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep
        blur = ep * 12
        // Curl upward and sideways like rising smoke
        yOff = -ep * 60
        xOff = Math.sin(ci * 2.1 + t * 3) * ep * 40
        charScale = 1 + ep * 0.5
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scale(${charScale})`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 ${10 + blur * 2}px ${color}50, 0 -2px 8px rgba(180,180,200,0.2)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {smokeParticles}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Garamond', 'Palatino', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 400,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function SmokeCurlComponent(props: MotionGraphicProps<SmokeCurlConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-smoke-curl',
  title: 'Kinetic Smoke Curl',
  description: 'Text dissolves into curling smoke wisps and reforms from smoke. Letters coalesce from blurry vapor on enter, drift gently during hold, and dissipate into rising curls on exit.',
  tags: ['kinetic', 'typography', 'liquid', 'smoke', 'curl', 'wisp', 'vapor', 'ethereal'],
  category: 'captions',
  component: SmokeCurlComponent as any,
  defaultConfig: {
    words: ['SMOKE', 'WISP', 'DRIFT', 'FADE'],
    colors: ['#B8C4D0', '#9CA8B4', '#C8D4E0', '#A4B0BC'],
    bgColor: '#0d0d14',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SMOKE', 'WISP', 'DRIFT', 'FADE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B8C4D0', '#9CA8B4', '#C8D4E0', '#A4B0BC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
