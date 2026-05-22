import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShadowCast3DConfig extends KineticBaseConfig {
  shadowSkew: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Floor perspective plane */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '45%',
            background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.5) 100%)`,
          }}
        />
        {/* Horizon line */}
        <div
          style={{
            position: 'absolute',
            top: '56%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        {/* Light source pulse in upper-left corner */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '12%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,240,200,${0.3 + Math.sin(time * 2.5) * 0.06}) 0%, transparent 70%)`,
            filter: 'blur(12px)',
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
    let shadowScaleY = 0
    let shadowSkewX = 0
    let groundOpacity = 0

    if (phase === 'enter') {
      const p = easeOutBack(Math.min(1, enterProgress * 1.1))
      const q = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.5 + p * 0.5
      shadowScaleY = q * 0.45
      shadowSkewX = (1 - q) * -15 // skewed flat, snaps to angle on entry
      groundOpacity = q * 0.65
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Light source sway: shadow angle shifts slightly
      shadowSkewX = Math.sin(holdProgress * Math.PI * 2.5) * 4
      shadowScaleY = 0.45 + Math.sin(holdProgress * Math.PI * 3) * 0.03
      groundOpacity = 0.65
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.08
      shadowScaleY = 0.45 + p * 0.6 // shadow stretches as light "sets"
      groundOpacity = 0.65 * (1 - exitProgress)
      shadowSkewX = -p * 20
    }

    return (
      <>
        {/* Floor shadow: perspective-projected text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, 48%) scaleY(${shadowScaleY}) skewX(${shadowSkewX}deg) scaleX(${scale})`,
            transformOrigin: 'bottom center',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(0,0,0,0.85)',
            opacity: groundOpacity,
            filter: 'blur(2px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Shadow gradient fade — diffuses toward toe */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, 48%) scaleY(${shadowScaleY * 1.1}) skewX(${shadowSkewX}deg) scaleX(${scale})`,
            transformOrigin: 'bottom center',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(0,0,0,0.4)',
            opacity: groundOpacity * 0.5,
            filter: 'blur(10px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Main text — upright, lit */}
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
            letterSpacing: 6,
            color,
            opacity,
            whiteSpace: 'nowrap',
            textShadow: `0 -2px 12px rgba(255,240,200,0.15), 0 4px 0 rgba(0,0,0,0.4)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ShadowCast3DComponent(props: MotionGraphicProps<ShadowCast3DConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shadow-cast-3d',
  title: 'Kinetic Shadow Cast 3D',
  description: 'Text casts a perspective-projected shadow onto a floor plane below, with light-source sway causing the shadow to shift angle during hold',
  tags: ['kinetic', 'typography', 'shadow', '3d', 'perspective', 'floor', 'light', 'cast', 'depth'],
  category: 'captions',
  component: ShadowCast3DComponent as any,
  defaultConfig: {
    words: ['STAND', 'TALL', 'CAST', 'SHADE'],
    colors: ['#FFFFFF', '#FFE066', '#FF6B6B', '#66D9E8'],
    bgColor: '#12111a',
    cycleDuration: 1.5,
    shadowSkew: 30,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STAND', 'TALL', 'CAST', 'SHADE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFE066', '#FF6B6B', '#66D9E8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12111a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'shadowSkew', label: 'Shadow Skew', type: 'number', defaultValue: 30, min: 0, max: 60, group: 'Animation' },
  ],
})
