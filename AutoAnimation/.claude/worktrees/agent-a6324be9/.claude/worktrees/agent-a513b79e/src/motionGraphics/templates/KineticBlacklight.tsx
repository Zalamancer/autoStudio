import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlacklightConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // UV tube light bar at the top
    const uvPulse = 0.7 + Math.sin(time * 4) * 0.3
    const uvFlicker = rand(frame * 3) < 0.03 ? 0.4 : 1

    // Fluorescent splatters / reactive paint spots on the background
    const splatters = Array.from({ length: 20 }, (_, i) => {
      const seed = i * 67 + 31
      const x = rand(seed) * 90 + 5
      const y = rand(seed + 1) * 80 + 10
      const size = 8 + rand(seed + 2) * 25
      const hue = rand(seed + 3) < 0.33 ? 300 : rand(seed + 3) < 0.66 ? 120 : 180 // magenta, green, cyan
      const splatOpacity = (0.03 + rand(seed + 4) * 0.06) * uvPulse * uvFlicker

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: rand(seed + 5) < 0.5 ? '50%' : '30%',
            background: `hsla(${hue}, 100%, 60%, ${splatOpacity})`,
            filter: `blur(${3 + rand(seed + 6) * 5}px)`,
            transform: `rotate(${rand(seed + 7) * 360}deg)`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* UV tube glow at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: 4,
            background: `rgba(120,0,255,${0.5 * uvPulse * uvFlicker})`,
            boxShadow: `0 0 20px rgba(120,0,255,${0.3 * uvPulse * uvFlicker}), 0 0 60px rgba(120,0,255,${0.15 * uvPulse * uvFlicker}), 0 5px 40px rgba(120,0,255,${0.08 * uvPulse * uvFlicker})`,
            borderRadius: 2,
          }}
        />
        {/* UV ambient wash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(60,0,120,${0.06 * uvPulse * uvFlicker}) 0%, transparent 40%)`,
          }}
        />
        {/* Fluorescent paint splatters */}
        {splatters}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // UV pulse affects glow intensity
    const uvPulse = 0.7 + Math.sin(time * 4) * 0.3
    const uvFlicker = rand(f * 3) < 0.03 ? 0.5 : 1

    let opacity = 0
    let scale = 1
    let glowMultiplier = 1

    if (phase === 'enter') {
      // UV light sweeps on, text fluorescence grows
      opacity = Math.pow(enterProgress, 0.4)
      glowMultiplier = enterProgress
      scale = 0.95 + enterProgress * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      // Pulsing fluorescent glow synced to UV tube
      glowMultiplier = uvPulse * uvFlicker
      scale = 1 + Math.sin(time * 3) * 0.008
    } else {
      // UV fades, fluorescence dies
      opacity = 1 - Math.pow(exitProgress, 0.6)
      glowMultiplier = (1 - exitProgress) * uvPulse
      scale = 1 - exitProgress * 0.05
    }

    const fluorGlow = glowMultiplier * opacity

    // Parse color to create the fluorescent version
    const neonGlowLayers = [
      `0 0 10px ${color}`,
      `0 0 20px ${color}`,
      `0 0 40px ${color}`,
      `0 0 80px ${color}`,
      `0 0 120px rgba(120,0,255,${fluorGlow * 0.2})`,
    ].join(', ')

    return (
      <>
        {/* Fluorescent reactive glow halo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale * 1.3})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            filter: `blur(${15 + (1 - glowMultiplier) * 5}px)`,
            opacity: fluorGlow * 0.4,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* UV reactive highlight layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale * 1.08})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: 'rgba(200,150,255,0.2)',
            filter: 'blur(6px)',
            opacity: fluorGlow * 0.6,
            whiteSpace: 'nowrap',
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Main fluorescent text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: '#ffffff',
            textShadow: neonGlowLayers,
            opacity: opacity * Math.max(0.3, glowMultiplier),
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function BlacklightComponent(props: MotionGraphicProps<BlacklightConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blacklight',
  title: 'Kinetic Blacklight',
  description: 'Blacklight UV reactive text glowing on dark background with fluorescent paint splatters, pulsing UV tube, and neon glow',
  tags: ['kinetic', 'typography', 'blacklight', 'uv', 'fluorescent', 'glow', 'neon', 'party', 'dark', 'light'],
  category: 'captions',
  component: BlacklightComponent as any,
  defaultConfig: {
    words: ['GLOW', 'RAVE', 'NEON', 'VIBE'],
    colors: ['#FF00FF', '#00FF80', '#00FFFF', '#FFFF00'],
    bgColor: '#05000a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLOW', 'RAVE', 'NEON', 'VIBE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF00FF', '#00FF80', '#00FFFF', '#FFFF00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#05000a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
