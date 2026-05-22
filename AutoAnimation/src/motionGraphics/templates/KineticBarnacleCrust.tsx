import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BarnaclecrustConfig extends KineticBaseConfig {
  growthDensity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Underwater light caustics
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {Array.from({ length: 6 }, (_, i) => {
          const cx = (0.15 + i * 0.14) * width
          const cy = (0.1 + (i % 3) * 0.25) * height
          const r = (40 + (i % 3) * 30)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cx - r + Math.sin(t * 0.5 + i * 1.3) * 10,
                top: cy - r * 0.4 + Math.cos(t * 0.4 + i) * 8,
                width: r * 2,
                height: r * 0.8,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(80,160,200,0.06), transparent 70%)',
              }}
            />
          )
        })}
        {/* Rocky surface texture stripes */}
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={`rock${i}`}
            style={{
              position: 'absolute',
              left: `${i * 7}%`,
              top: `${70 + (i % 4) * 5}%`,
              width: '6%',
              height: `${15 + (i % 3) * 10}%`,
              background: `rgba(80,70,60,${0.03 + (i % 3) * 0.01})`,
              borderRadius: '2px',
              transform: `skewX(${(i % 5 - 2) * 3}deg)`,
            }}
          />
        ))}
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
      let blur = 0
      let crustProgress = 0

      if (phase === 'enter') {
        // Barnacles grow from rough rock surface upward
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.5) / 0.7))
        const ep = easeOutExpo(p)

        yOff = (1 - ep) * 40  // grow up from below
        scaleY = ep * (1 + Math.sin(ep * Math.PI) * 0.1)
        scaleX = 0.7 + ep * 0.3 + Math.sin(ep * Math.PI * 4) * (1 - ep) * 0.05
        opacity = p < 0.1 ? p * 10 : 1
        blur = (1 - ep) * 2
        crustProgress = ep

      } else if (phase === 'hold') {
        // Barnacles filter-feed: tiny opening/closing oscillation
        crustProgress = 1
        const feed = Math.sin(t * 2.5 + ci * 0.7) * 0.5 + 0.5
        scaleX = 1 + feed * 0.03
        scaleY = 1 + feed * 0.04
        yOff = Math.sin(t * 1.5 + ci * 0.5) * 1.5
        opacity = 0.95 + feed * 0.05

      } else {
        // Barnacles peel/scrape off the rock
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.9))
        const ep = easeInCubic(p)

        yOff = ep * 30
        xOff = Math.sin(ci * 1.7) * ep * 15
        scaleX = 1 + ep * 0.3
        scaleY = 1 - ep * 0.7
        opacity = 1 - ep
        blur = ep * 4
        crustProgress = 1 - ep
      }

      // Barnacle texture: rough encrusted look via text shadow layering
      const crustAlpha = crustProgress * 0.5
      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: crustProgress > 0.1
              ? [
                  `1px 1px 0 rgba(90,80,60,${crustAlpha})`,
                  `-1px -1px 0 rgba(60,70,80,${crustAlpha * 0.7})`,
                  `0 2px 0 rgba(100,90,70,${crustAlpha})`,
                  `2px 0 0 rgba(80,70,55,${crustAlpha * 0.8})`,
                  `0 0 12px rgba(80,160,120,${crustProgress * 0.2})`,
                ].join(', ')
              : `0 2px 8px rgba(0,0,0,0.5)`,
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

function BarnacleCrustComponent(props: MotionGraphicProps<BarnaclecrustConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-barnacle-crust',
  title: 'Kinetic Barnacle Crust',
  description: 'Letters encrusted with barnacle/coral growth: text grows up from rock surface, layered with crusty texture via stacked text-shadows. Hold phase shows filter-feeding oscillation. Underwater caustics in background.',
  tags: ['kinetic', 'typography', 'barnacle', 'coral', 'organic', 'ocean', 'growth', 'biology', 'material-physics'],
  category: 'captions',
  component: BarnacleCrustComponent as any,
  defaultConfig: {
    words: ['REEF', 'CRUST', 'GROW', 'TIDE'],
    colors: ['#C8B870', '#B8A860', '#D4C480', '#A89850'],
    bgColor: '#060810',
    cycleDuration: 1.8,
    growthDensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REEF', 'CRUST', 'GROW', 'TIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B870', '#B8A860', '#D4C480', '#A89850'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'growthDensity', label: 'Growth Density', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
