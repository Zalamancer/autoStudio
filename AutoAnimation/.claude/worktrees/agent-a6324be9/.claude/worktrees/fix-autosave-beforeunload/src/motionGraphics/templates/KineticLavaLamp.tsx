import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LavaLampConfig extends KineticBaseConfig {}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Lava lamp blobs: organic morphing shapes that rise and fall
    const blobs = Array.from({ length: 7 }, (_, i) => {
      const baseX = width * (0.1 + 0.8 * rand(i * 31 + 3))
      const speed = 0.3 + rand(i * 17) * 0.5
      const yPhase = (t * speed + rand(i * 43) * 10) % 3
      // Blob rises slowly, pauses at top, sinks back
      let yPos: number
      if (yPhase < 1.5) {
        yPos = height * (0.8 - 0.6 * easeInOut(yPhase / 1.5))
      } else {
        yPos = height * (0.2 + 0.6 * easeInOut((yPhase - 1.5) / 1.5))
      }

      const sizeBase = 60 + rand(i * 29) * 100
      const sizeW = sizeBase * (1 + Math.sin(t * 1.2 + i) * 0.3)
      const sizeH = sizeBase * (1 + Math.cos(t * 0.9 + i * 0.7) * 0.25)
      const hue = (i * 50 + t * 15) % 360
      const drift = Math.sin(t * 0.6 + i * 1.3) * 30

      // Organic border radius
      const br1 = 40 + Math.sin(t * 1.5 + i) * 15
      const br2 = 40 - Math.sin(t * 1.8 + i * 0.6) * 15
      const br3 = 40 + Math.cos(t * 1.3 + i * 1.2) * 15
      const br4 = 40 - Math.cos(t * 2.0 + i * 0.4) * 15

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: baseX + drift - sizeW / 2,
            top: yPos - sizeH / 2,
            width: sizeW,
            height: sizeH,
            borderRadius: `${br1}% ${br2}% ${br3}% ${br4}%`,
            background: `radial-gradient(ellipse at 40% 35%, hsla(${hue}, 80%, 55%, 0.45), hsla(${(hue + 40) % 360}, 70%, 40%, 0.3) 60%, transparent)`,
            filter: 'blur(18px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Warm ambient glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 70%, rgba(120, 40, 20, 0.15), transparent 60%)`,
          }}
        />
        {blobs}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let scaleX = 1
      let scaleY = 1

      if (phase === 'enter') {
        // Letters rise from below like lava blobs
        const delay = ci / (word.length + 1) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const ep = easeInOut(p)
        charOpacity = ep
        yOff = (1 - ep) * 80
        // Blob stretch while rising
        scaleX = 0.7 + ep * 0.3
        scaleY = 1.3 - ep * 0.3
      } else if (phase === 'hold') {
        // Organic lava lamp wobble
        const wt = t * 1.8 + ci * 0.5
        yOff = Math.sin(wt) * 6
        scaleX = 1 + Math.sin(wt * 1.3) * 0.05
        scaleY = 1 - Math.sin(wt * 1.3) * 0.04

        // Organic border radius effect via slight position jitter
        yOff += Math.cos(t * 2.2 + ci * 0.8) * 3
      } else {
        // Melt downward like dripping lava
        const delay = (word.length - 1 - ci) / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))
        const ep = easeInOut(p)
        charOpacity = 1 - ep
        yOff = ep * 70
        scaleX = 1.2 + ep * 0.4
        scaleY = 0.6 - ep * 0.3
      }

      // Warm color shift per character
      const hueShift = Math.sin(t * 2 + ci * 0.6) * 20
      const charHue = hueShift

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center bottom',
            filter: `hue-rotate(${charHue}deg)`,
            textShadow: `0 0 15px ${color}80, 0 4px 12px rgba(200, 80, 30, 0.4)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Lava glow beneath text
    let lavaGlow: React.ReactNode = null
    if (phase !== 'exit') {
      const glowOpacity = phase === 'enter' ? enterProgress * 0.3 : 0.3 - holdProgress * 0.05
      lavaGlow = (
        <div
          style={{
            position: 'absolute',
            top: '58%',
            left: '50%',
            width: '70%',
            height: 30,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${color}50, rgba(200, 60, 20, 0.2), transparent 70%)`,
            opacity: glowOpacity,
            filter: 'blur(10px)',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {lavaGlow}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function LavaLampComponent(props: MotionGraphicProps<LavaLampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lava-lamp',
  title: 'Kinetic Lava Lamp',
  description: 'Text with lava lamp blob motion and organic morphing shapes. Letters rise like heated wax blobs, wobble with surface tension, and melt downward on exit.',
  tags: ['kinetic', 'typography', 'liquid', 'lava', 'lamp', 'retro', 'organic', 'morph'],
  category: 'captions',
  component: LavaLampComponent as any,
  defaultConfig: {
    words: ['GROOVY', 'MELT', 'FLOW', 'BLOB'],
    colors: ['#FF6B35', '#F7C948', '#FF4E50', '#FC913A'],
    bgColor: '#1a0a1e',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GROOVY', 'MELT', 'FLOW', 'BLOB'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#F7C948', '#FF4E50', '#FC913A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
