import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TemperatureMeltConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// LLM Temperature parameter: controls randomness of output
// Low temp (0.1): deterministic, stiff, precise
// High temp (2.0): chaotic, melting, words flow into each other
// Text morphs between rigid and fluid states as temperature changes

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Temperature gauge — animated from cold (blue) to hot (red/chaos)
    const temperature = 0.5 + Math.sin(time * 0.4) * 1.5 // 0 to 2
    const clampedTemp = Math.max(0.1, Math.min(2.0, temperature))
    const tempPct = (clampedTemp - 0.1) / 1.9

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Temperature bar */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            right: 10,
            height: 3,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${tempPct * 100}%`,
              background: `hsl(${240 - tempPct * 240}, 80%, 60%)`,
              borderRadius: 2,
            }}
          />
        </div>
        {/* Temp readout */}
        <div
          style={{
            position: 'absolute',
            top: 15,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `hsla(${240 - tempPct * 240}, 80%, 70%, 0.4)`,
            letterSpacing: 1,
          }}
        >
          temperature: {clampedTemp.toFixed(2)}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 25,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color:
              tempPct > 0.8
                ? 'rgba(255,80,80,0.25)'
                : tempPct < 0.2
                  ? 'rgba(100,150,255,0.2)'
                  : 'rgba(200,200,200,0.15)',
          }}
        >
          {tempPct > 0.8 ? 'CHAOTIC OUTPUT' : tempPct < 0.2 ? 'DETERMINISTIC' : 'sampling...'}
        </div>
        {/* Heat shimmer lines at high temperature */}
        {tempPct > 0.7 &&
          Array.from({ length: 4 }, (_, i) => {
            const waveAmt = (tempPct - 0.7) * 20
            const x = ((time * 30 + i * 40) % 120) - 10
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: `rgba(255,100,40,${(tempPct - 0.7) * 0.08})`,
                  transform: `skewX(${Math.sin(time * 4 + i) * waveAmt}deg)`,
                }}
              />
            )
          })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 167 + 73
    const chars = word.split('')

    // Temperature affects character displacement and fluidity
    // Low temp: crisp sharp entry
    // High temp: chars melt/flow, unpredictable positions

    const getTemperature = (p: number) => {
      // Phase-specific temperature arc
      if (phase === 'enter') return 2.0 - p * 1.5 // starts hot, cools to 0.5
      if (phase === 'hold') return 0.5 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.5
      return 0.5 + p * 1.5 // heats back up on exit
    }

    const temp = getTemperature(phase === 'enter' ? enterProgress : phase === 'hold' ? holdProgress : exitProgress)
    const chaos = Math.max(0, (temp - 0.8) / 1.2) // 0 at temp=0.8, 1 at temp=2.0
    const stiff = Math.max(0, 1 - temp / 0.8) // 1 at temp=0, 0 at temp=0.8

    let opacity = 1
    if (phase === 'enter') opacity = enterProgress
    if (phase === 'exit') opacity = 1 - exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          fontFamily:
            chaos > 0.5
              ? "'Georgia', serif" // high temp: serif melts
              : "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: stiff > 0.3 ? `${3 + stiff * 4}px` : '2px', // stiff = wide kerning
          display: 'flex',
          opacity,
        }}
      >
        {chars.map((ch, ci) => {
          // Melt displacement — each char gets a random heat-wave displacement
          const heatX = chaos * (rand(seed + ci * 19 + Math.floor(f / 2)) - 0.5) * 30
          const heatY = chaos * (rand(seed + ci * 31 + Math.floor(f / 3)) - 0.5) * 20
          const heatRot = chaos * (rand(seed + ci * 41) - 0.5) * 20
          const heatScale = 1 + chaos * (rand(seed + ci * 53) - 0.3) * 0.4

          // Color temperature: cool blue → warm red
          const hue = 220 - chaos * 180
          const charColor = chaos > 0.3 ? `hsl(${hue}, 90%, ${60 + chaos * 20}%)` : color

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color: charColor,
                transform: `translate(${heatX}px, ${heatY}px) rotate(${heatRot}deg) scale(${heatScale})`,
                filter: chaos > 0.5 ? `blur(${chaos * 1.5}px)` : 'none',
                textShadow: chaos > 0.4 ? `0 0 ${chaos * 20}px ${charColor}` : `0 0 8px ${color}40`,
                // Low temp: letter-spacing snap
                transition: 'none',
              }}
            >
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function TemperatureMeltComponent(props: MotionGraphicProps<TemperatureMeltConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-temperature-melt',
  title: 'Kinetic Temperature Melt',
  description:
    'LLM temperature parameter as visual effect — low temp = rigid crisp text, high temp = characters melt and flow with heat shimmer, color shifts blue→red',
  tags: ['kinetic', 'typography', 'ai', 'temperature', 'llm', 'melt', 'chaos', 'digital', 'ml', 'generative'],
  category: 'captions',
  component: TemperatureMeltComponent as any,
  defaultConfig: {
    words: ['RANDOM', 'CHAOS', 'PRECISE', 'MELT'],
    colors: ['#FF6633', '#FF4411', '#FF7744', '#FF5522'],
    bgColor: '#0e0400',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RANDOM', 'CHAOS', 'PRECISE', 'MELT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6633', '#FF4411', '#FF7744', '#FF5522'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e0400', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
