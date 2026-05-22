import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GodRayBurstConfig extends KineticBaseConfig {
  rayCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const RAY_COUNT = 8

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Radial atmospheric haze */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,240,200,${0.04 + Math.sin(time * 1.5) * 0.01}) 0%, transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let scale = 1
    let rayLength = 0
    let rayOpacity = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      const pBack = easeOutBack(Math.min(1, enterProgress * 1.1))
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.5 + pBack * 0.5
      // Rays burst outward as text enters
      rayLength = p
      rayOpacity = p * 0.85
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      rayLength = 1
      // Rays pulse gently during hold
      rayOpacity = 0.75 + Math.sin(holdProgress * Math.PI * 4) * 0.15
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.1
      rayLength = 1 + p * 0.5 // rays extend further as text exits
      rayOpacity = (1 - exitProgress) * 0.7
    }

    const rays = Array.from({ length: RAY_COUNT }, (_, i) => {
      const angle = (i / RAY_COUNT) * 360
      const rad = (angle * Math.PI) / 180
      const rayW = 2 + (i % 3) * 1.5
      const rayH = 80 + (i % 2) * 60
      const extendedH = rayH + rayLength * 180
      const individualOpacity = rayOpacity * (0.5 + (i % 3) * 0.15)
      const sway = Math.sin(time * 0.8 + i * 1.1) * 4

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: rayW,
            height: extendedH,
            transformOrigin: '50% 0%',
            transform: `translate(-50%, 0) rotate(${angle + sway}deg)`,
            background: `linear-gradient(180deg, rgba(255,230,150,${individualOpacity * 0.8}) 0%, rgba(255,200,100,${individualOpacity * 0.5}) 30%, rgba(255,180,80,${individualOpacity * 0.2}) 60%, transparent 100%)`,
            filter: `blur(${2 + i % 2 * 2}px)`,
            opacity: opacity,
          }}
        />
      )
    })

    return (
      <>
        {/* Radial ray burst centered on text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 0,
            height: 0,
          }}
        >
          {rays}
        </div>
        {/* Central bloom */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 200,
            height: 200,
            transform: `translate(-50%, -50%) scale(${scale})`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,240,200,${rayOpacity * 0.15}) 0%, transparent 70%)`,
            filter: 'blur(20px)',
            opacity,
          }}
        />
        {/* Dark silhouette text — rays burst through letters */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'rgba(8,6,4,0.95)',
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Bright rim light on letter edges from burst */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'transparent',
            WebkitTextStroke: `2px rgba(255,220,130,${opacity * rayOpacity * 0.7})`,
            textShadow: `0 0 15px rgba(255,200,100,${opacity * rayOpacity * 0.4})`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function GodRayBurstComponent(props: MotionGraphicProps<GodRayBurstConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-god-ray-burst',
  title: 'Kinetic God Ray Burst',
  description: 'Radial god-ray columns burst outward from behind the text silhouette — rays sweep through the composition as the dark letterforms glow at their edges',
  tags: ['kinetic', 'typography', 'god-ray', 'burst', 'radial', 'backlit', 'silhouette', 'dramatic', 'light-shaft'],
  category: 'captions',
  component: GodRayBurstComponent as any,
  defaultConfig: {
    words: ['BURST', 'RADIATE', 'SHINE', 'RISE'],
    colors: ['#080604', '#060503', '#080604', '#060503'],
    bgColor: '#100e0a',
    cycleDuration: 1.5,
    rayCount: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BURST', 'RADIATE', 'SHINE', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#080604', '#060503', '#080604', '#060503'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100e0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'rayCount', label: 'Ray Count', type: 'number', defaultValue: 8, min: 4, max: 16, group: 'Animation' },
  ],
})
