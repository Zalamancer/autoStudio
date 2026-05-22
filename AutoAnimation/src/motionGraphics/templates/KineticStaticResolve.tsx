import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StaticResolveConfig extends KineticBaseConfig {
  staticDensity: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

// Fast pseudo-random for per-frame static
function frameRand(c: number, r: number, f: number): number {
  return rand(c * 1033 + r * 2917 + f * 7919)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // BG: low-level static always present
    const cellW = 5
    const cellH = 5
    const cols = Math.ceil(width / cellW)
    const rows = Math.ceil(height / cellH)
    const staticCells: React.ReactNode[] = []

    for (let r = 0; r < rows; r += 3) {
      for (let c = 0; c < cols; c += 3) {
        const rv = frameRand(c, r, frame)
        if (rv > 0.97) {
          staticCells.push(
            <div
              key={`bg-${r}_${c}`}
              style={{
                position: 'absolute',
                left: c * cellW,
                top: r * cellH,
                width: cellW,
                height: cellH,
                background: `rgba(200,205,220,${0.03 + rv * 0.04})`,
              }}
            />,
          )
        }
      }
    }

    return <div style={{ position: 'absolute', inset: 0, background: bgColor }}>{staticCells}</div>
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
    width,
    height,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__staticResolveConfig ?? { staticDensity: 80 }
    const staticDensity = cfg.staticDensity ?? 80

    // Static resolve: the word appears through decreasing static interference
    // At start: dense random static covers everything
    // As static clears: text resolves from beneath, character by character via signal zones

    let staticIntensity = 0 // 0 = no static, 1 = full static
    let textOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      staticIntensity = 1 - ep
      textOpacity = ep
    } else if (phase === 'hold') {
      // Residual occasional static bursts
      const burstTime = t % 2.5
      staticIntensity = burstTime > 2.3 ? (burstTime - 2.3) * 5 * 0.3 : 0
      textOpacity = 1 - staticIntensity * 0.2
    } else {
      const ep = easeInQuad(exitProgress)
      staticIntensity = ep
      textOpacity = 1 - ep
    }

    // Static cell grid
    const cellW = 4
    const cellH = 4
    const cols = Math.ceil(width / cellW)
    const rows = Math.ceil(height / cellH)
    const staticCells: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rv = frameRand(c, r, (frame ?? 0) + index * 100)

        // Probability of showing a static cell scales with staticIntensity
        const showThreshold = (staticDensity / 100) * staticIntensity
        if (rv > showThreshold) continue

        // Static pixel: random gray shade
        const brightness = Math.floor(frameRand(c * 17, r * 13, (frame ?? 0) + 1 + index) * 200)
        const alpha = 0.6 + rv * 0.4

        staticCells.push(
          <div
            key={`wd-${r}_${c}`}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW,
              height: cellH,
              background: `rgba(${brightness},${brightness},${brightness + 10},${alpha})`,
            }}
          />,
        )
      }
    }

    // Horizontal interference bars (scanning static bands)
    const bands: React.ReactNode[] = []
    if (staticIntensity > 0.1) {
      for (let b = 0; b < 4; b++) {
        const bandY = ((t * (2 + b * 0.7) + b * 0.25) % 1) * height
        const bandH = 2 + rand(b * 41 + index) * 8
        const bandAlpha = staticIntensity * (0.15 + rand(b * 67 + index) * 0.2)
        const bandBrightness = 40 + Math.floor(rand(b * 53 + index + (frame ?? 0)) * 160)

        bands.push(
          <div
            key={`band${b}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: bandY,
              height: bandH,
              background: `rgba(${bandBrightness},${bandBrightness},${bandBrightness + 15},${bandAlpha})`,
            }}
          />,
        )
      }
    }

    // Signal-to-noise wave front during enter: a horizontal sweep zone
    // where signal (text) wins over noise
    let signalFrontY = 0
    const sweepVisible = phase === 'enter' && enterProgress > 0.05 && enterProgress < 0.9

    if (sweepVisible) {
      signalFrontY = enterProgress * height
    }

    // Per-character resolution: characters closer to the sweep front appear clearer
    const chars = word.split('').map((ch, ci) => {
      const charNorm = word.length > 1 ? ci / (word.length - 1) : 0.5
      // Characters in better signal zones (already swept) show clearly
      const baseOpacity = textOpacity
      const charBlur =
        staticIntensity > 0.3 ? Math.max(0, (staticIntensity - 0.3) / 0.7) * 3 * (0.5 + rand(ci * 41 + index) * 0.5) : 0

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: baseOpacity,
            filter: charBlur > 0.1 ? `blur(${charBlur}px)` : 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>

        {/* Static overlay */}
        {staticCells}

        {/* Interference bands */}
        {bands}

        {/* Signal sweep front */}
        {sweepVisible && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: signalFrontY - 8,
              height: 16,
              background: `linear-gradient(180deg, transparent, rgba(180,200,240,0.12) 40%, rgba(200,215,255,0.2) 50%, rgba(180,200,240,0.12) 60%, transparent)`,
              filter: 'blur(3px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function StaticResolveComponent(props: MotionGraphicProps<StaticResolveConfig>) {
  ;(globalThis as any).__staticResolveConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-static-resolve',
  title: 'Kinetic Static Resolve',
  description:
    'Dense TV static interference clears from top to bottom with a signal sweep front, revealing text as the noise resolves per-character',
  tags: ['kinetic', 'typography', 'static', 'noise', 'interference', 'TV', 'resolve', 'signal', 'reveal'],
  category: 'captions',
  component: StaticResolveComponent as any,
  defaultConfig: {
    words: ['SIGNAL', 'TUNED', 'CLEAR', 'LOCK'],
    colors: ['#E0F0FF', '#C8E0FF', '#F0F8FF', '#B0D4FF'],
    bgColor: '#060810',
    cycleDuration: 1.5,
    staticDensity: 80,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SIGNAL', 'TUNED', 'CLEAR', 'LOCK'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0F0FF', '#C8E0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'staticDensity',
      label: 'Static Density (%)',
      type: 'number',
      defaultValue: 80,
      min: 20,
      max: 100,
      group: 'Animation',
    },
  ],
})
