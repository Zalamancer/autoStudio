import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EvaporateConfig extends KineticBaseConfig {
  heatLevel: number
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Rising vapor wisps */}
        {Array.from({ length: 10 }, (_, i) => {
          const x = ((i * 0.1 + 0.05) * width) + Math.sin(t * 0.6 + i * 1.2) * 15
          const baseY = height * 0.8
          const riseY = ((t * (0.08 + (i % 3) * 0.03) + i * 0.1) % 1) * height
          const y = baseY - riseY
          if (y < -20 || y > height + 20) return null
          const opacity = Math.sin((riseY / (height * 0.8)) * Math.PI) * 0.06
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - 8,
                top: y,
                width: 16 + (i % 3) * 8,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(255,255,255,1)',
                opacity,
                filter: 'blur(8px)',
                transform: `skewX(${Math.sin(t * 1.2 + i) * 10}deg)`,
              }}
            />
          )
        })}
        {/* Heat shimmer gradient at base */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: `linear-gradient(to top, rgba(255,120,0,0.04), transparent)`,
          }}
        />
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
      let brightness = 1

      if (phase === 'enter') {
        // Condense from vapor: vapor coalesces into solid letters from top down
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.4) / 0.7))
        const ep = easeOutExpo(p)

        yOff = (1 - ep) * -height * 0.3
        blur = (1 - ep) * 8
        scaleX = 0.6 + ep * 0.4 + (1 - ep) * Math.abs(Math.sin(t * 4 + ci)) * 0.15
        scaleY = 0.4 + ep * 0.6
        opacity = p < 0.1 ? p * 10 : Math.min(1, ep * 1.2)
        brightness = 1.4 - ep * 0.4

      } else if (phase === 'hold') {
        // Heat shimmer on solid surface: convective distortion
        const heat = Math.sin(t * 4 + ci * 0.8)
        xOff = heat * 1.5
        yOff = Math.abs(heat) * -1 + Math.sin(t * 5.5 + ci * 0.6) * 1
        // Surface sublimation: occasional wisp of vapor visible in blur
        blur = Math.max(0, Math.sin(t * 2 + ci * 1.1) * 0.3)
        brightness = 1 + Math.abs(Math.sin(t * 2.5 + ci * 0.5)) * 0.06
        scaleX = 1 + Math.sin(t * 2 + ci * 0.4) * 0.01
        scaleY = 1 + Math.sin(t * 1.8 + ci * 0.6) * 0.01

      } else {
        // Sublimation / evaporation: letters dissolve upward into vapor
        const reverseDelay = (word.length - 1 - ci) / word.length * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - reverseDelay) / 0.7))
        const ep = easeInOutCubic(p)

        yOff = -ep * 80
        xOff = Math.sin(ep * Math.PI * 3 + ci) * 10 * ep
        blur = ep * 12
        scaleX = 1 + ep * 0.5
        scaleY = 1 - ep * 0.3
        opacity = 1 - ep
        brightness = 1 + ep * 0.8
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: [
              blur > 0 ? `blur(${blur}px)` : '',
              brightness !== 1 ? `brightness(${brightness})` : '',
            ].filter(Boolean).join(' ') || undefined,
            textShadow: `0 0 20px rgba(255,160,80,0.25), 0 2px 8px rgba(0,0,0,0.4)`,
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
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 800,
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

function EvaporateComponent(props: MotionGraphicProps<EvaporateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-evaporate',
  title: 'Kinetic Evaporate',
  description: 'Text undergoes solid-to-gas sublimation: condenses from vapor on enter, heat-shimmers during hold, then sublimes upward into vapor wisps on exit. Rising vapor particles animate in background.',
  tags: ['kinetic', 'typography', 'evaporate', 'sublimate', 'vapor', 'heat', 'phase-change', 'state', 'material-physics'],
  category: 'captions',
  component: EvaporateComponent as any,
  defaultConfig: {
    words: ['FADE', 'VAPOR', 'DRIFT', 'GONE'],
    colors: ['#E8C8A0', '#D4B488', '#F0D8B8', '#C4A478'],
    bgColor: '#0C0804',
    cycleDuration: 1.8,
    heatLevel: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FADE', 'VAPOR', 'DRIFT', 'GONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8C8A0', '#D4B488', '#F0D8B8', '#C4A478'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0804', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'heatLevel', label: 'Heat Level', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
