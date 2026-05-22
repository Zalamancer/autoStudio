import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DollyVertigoEffectConfig extends KineticBaseConfig {
  vertigoIntensity: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Dolly zoom: environment zooms in opposite direction to focal length
    // Perspective distortion — environment expands while subject stays fixed
    const envScale = 1 + Math.sin(time * 0.6) * 0.08

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Expanding grid — environment rush */}
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((frac, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${frac * 100}%`,
              height: 1,
              background: `rgba(255,255,255,${0.04 + Math.sin(time * 0.3 + i) * 0.01})`,
              transform: `scaleY(${envScale})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {[0.15, 0.3, 0.5, 0.7, 0.85].map((frac, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${frac * 100}%`,
              width: 1,
              background: `rgba(255,255,255,${0.04 + Math.sin(time * 0.25 + i * 0.8) * 0.01})`,
              transform: `scaleX(${envScale})`,
              transformOrigin: '50% 50%',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Vertiginous radial burst from center — environment rushing outward */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)`,
            transform: `scale(${envScale})`,
            pointerEvents: 'none',
          }}
        />
        {/* Edge darkening — compression artifact */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // The word STAYS fixed in the frame while environment moves —
    // simulating subject-locked dolly zoom
    let scale = 1
    let opacity = 1
    let perspectiveShift = 0

    if (phase === 'enter') {
      // Rush in — fast zoom approach
      const ease = 1 - Math.pow(1 - enterProgress, 4)
      scale = 0.3 + ease * 0.7
      opacity = Math.min(1, enterProgress * 3)
      perspectiveShift = (1 - ease) * 30
    } else if (phase === 'hold') {
      // Subject lock — very slight counter-zoom breathing
      scale = 1 + Math.sin(t * 1.2 + index) * 0.012
      opacity = 1
      perspectiveShift = Math.sin(t * 0.7) * 1
    } else {
      // Zoom out — subject shrinks as camera dollies back
      const ease = Math.pow(exitProgress, 3)
      scale = 1 - ease * 0.5
      opacity = 1 - exitProgress * 0.8
      perspectiveShift = -ease * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${perspectiveShift}px), -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(52px, 14vw, 180px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: -2,
          textShadow: `0 0 40px ${color}22, 0 2px 8px rgba(0,0,0,0.8)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function DollyVertigoEffectComponent(props: MotionGraphicProps<DollyVertigoEffectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dolly-vertigo-effect',
  title: 'Kinetic Dolly Vertigo',
  description: 'Hitchcock/Spielberg dolly zoom — background rushes outward while subject text stays locked, creating vertiginous spatial tension',
  tags: ['kinetic', 'typography', 'dolly', 'zoom', 'vertigo', 'hitchcock', 'cinematic', 'perspective'],
  category: 'captions',
  component: DollyVertigoEffectComponent as any,
  defaultConfig: {
    words: ['TERROR', 'FALLING', 'VERTIGO', 'ABYSS'],
    colors: ['#FF4444', '#FF6B35', '#FF4444', '#FFD700'],
    bgColor: '#080808',
    cycleDuration: 1.5,
    vertigoIntensity: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TERROR', 'FALLING', 'VERTIGO', 'ABYSS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#FF6B35', '#FF4444', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'vertigoIntensity', label: 'Vertigo Intensity', type: 'number', defaultValue: 80, min: 20, max: 200, group: 'Animation' },
  ],
})
