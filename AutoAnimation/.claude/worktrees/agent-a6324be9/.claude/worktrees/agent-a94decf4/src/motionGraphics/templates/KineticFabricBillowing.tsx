import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FabricBillowingConfig extends KineticBaseConfig {
  windSpeed: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/** Fabric wave displacement — sine-wave cloth billowing */
function clothWave(ci: number, wordLen: number, t: number, amplitude: number): { dy: number; scaleY: number; skewX: number } {
  const norm = ci / Math.max(1, wordLen - 1) // 0..1 along word
  const waveFreq = 2.5
  const phase = norm * Math.PI * 2 - t * waveFreq
  const wave = Math.sin(phase)
  return {
    dy: wave * amplitude,
    scaleY: 1 + Math.abs(wave) * 0.08,
    skewX: Math.cos(phase) * 4,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Wind streaks */}
        {Array.from({ length: 6 }, (_, i) => {
          const yFrac = 0.2 + i * 0.12
          const speed = 0.3 + (i % 3) * 0.15
          const xOff = ((t * speed * 80 + i * 120) % (width + 200)) - 100
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: xOff,
                top: `${yFrac * 100}%`,
                width: 60 + (i % 3) * 40,
                height: 1,
                background: `linear-gradient(to right, transparent, rgba(255,255,255,${0.04 + (i % 2) * 0.02}), transparent)`,
                transform: `skewX(${-8 + (i % 3) * 2}deg)`,
              }}
            />
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
      let skewX = 0
      let blur = 0

      if (phase === 'enter') {
        // Fabric unfurls from left to right in the wind
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.6) / 0.6))
        const ep = easeOutExpo(p)

        // Each letter billows in from the left trailing edge
        xOff = (1 - ep) * -40 - (1 - ep) * ci * 8
        const wave = clothWave(ci, word.length, t, 18 * (1 - ep))
        yOff = wave.dy
        scaleY = 0.5 + ep * 0.5 + (1 - ep) * Math.abs(Math.sin(t * 3 + ci)) * 0.2
        scaleX = 0.7 + ep * 0.3
        skewX = (1 - ep) * -15 + wave.skewX * (1 - ep)
        opacity = p < 0.1 ? p * 10 : 1
        blur = (1 - ep) * 2

      } else if (phase === 'hold') {
        // Cloth billows continuously in the wind
        const wave = clothWave(ci, word.length, t, 12)
        yOff = wave.dy
        scaleY = wave.scaleY
        skewX = wave.skewX * 0.6
        // Tension variation — fabric tightens and slackens
        scaleX = 1 + Math.sin(t * 1.8 + ci * 0.4) * 0.03

      } else {
        // Fabric whisked away by strong gust — flies off screen
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.8))
        const ep = easeInOutSine(p)
        xOff = ep * 120 + ep * ci * 10
        yOff = ep * -50 + Math.sin(p * Math.PI * 3 + ci) * 20 * ep
        scaleX = 1 + ep * 0.3
        scaleY = 1 - ep * 0.5
        skewX = ep * 20
        opacity = 1 - ep
        blur = ep * 4
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: `0 3px 10px rgba(0,0,0,0.4), 2px 0 6px rgba(0,0,0,0.2)`,
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

function FabricBillowingComponent(props: MotionGraphicProps<FabricBillowingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fabric-billowing',
  title: 'Kinetic Fabric Billowing',
  description: 'Text behaves as fabric cloth in the wind: letters propagate sine-wave billowing, skewing and scaling like a banner flapping. Unfurls on enter, whisked away on exit.',
  tags: ['kinetic', 'typography', 'fabric', 'cloth', 'billowing', 'wind', 'textile', 'wave', 'material-physics'],
  category: 'captions',
  component: FabricBillowingComponent as any,
  defaultConfig: {
    words: ['FLOW', 'DRIFT', 'BILLOW', 'WAVE'],
    colors: ['#E8D8C4', '#D4C4B0', '#F0E0CC', '#C8B8A4'],
    bgColor: '#1A1410',
    cycleDuration: 1.8,
    windSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLOW', 'DRIFT', 'BILLOW', 'WAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D8C4', '#D4C4B0', '#F0E0CC', '#C8B8A4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1410', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'windSpeed', label: 'Wind Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
