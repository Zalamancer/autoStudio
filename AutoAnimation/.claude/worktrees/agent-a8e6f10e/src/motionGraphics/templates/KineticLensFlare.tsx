import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LensFlareConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Lens flare light source position — drifts slowly across
    const lightX = 30 + Math.sin(frame * 0.015) * 25
    const lightY = 25 + Math.cos(frame * 0.012) * 15

    // Secondary ghost flares (reflections from light through lens elements)
    const ghosts = [
      { offset: 0.3, size: 60, opacity: 0.12, hue: 40 },
      { offset: 0.5, size: 35, opacity: 0.08, hue: 200 },
      { offset: 0.7, size: 80, opacity: 0.06, hue: 300 },
      { offset: 1.2, size: 45, opacity: 0.1, hue: 120 },
    ]

    // Opposite point through center
    const cx = 50
    const cy = 50

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Subtle light gradient from source */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,220,150,0.08) 0%, transparent 60%)`,
          }}
        />
        {/* Main flare bloom */}
        <div
          style={{
            position: 'absolute',
            left: `${lightX}%`,
            top: `${lightY}%`,
            width: 'clamp(80px, 15vw, 200px)',
            height: 'clamp(80px, 15vw, 200px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,240,200,0.25) 0%, rgba(255,200,100,0.1) 40%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Anamorphic streak (horizontal light line) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${lightY}%`,
            height: 2,
            background: `linear-gradient(to right, transparent 0%, rgba(255,220,180,${0.05 + Math.sin(frame * 0.05) * 0.03}) 30%, rgba(255,220,180,0.12) ${lightX}%, rgba(200,180,255,${0.05 + Math.sin(frame * 0.05) * 0.03}) 70%, transparent 100%)`,
            transform: 'translateY(-50%)',
          }}
        />
        {/* Ghost flares along the line through center and light source */}
        {ghosts.map((ghost, i) => {
          const gx = lightX + (cx - lightX) * ghost.offset * 2
          const gy = lightY + (cy - lightY) * ghost.offset * 2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${gx}%`,
                top: `${gy}%`,
                width: ghost.size,
                height: ghost.size,
                borderRadius: '50%',
                background: `radial-gradient(circle, hsla(${ghost.hue}, 80%, 70%, ${ghost.opacity}) 0%, transparent 70%)`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1
    let flareIntensity = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 1.15 - eased * 0.15
      // Bright flare burst at start
      flareIntensity = Math.max(0, 1 - enterProgress * 2.5) * 0.8
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Subtle pulsing glow
      flareIntensity = 0.1 + Math.sin(holdProgress * Math.PI * 4) * 0.08
    } else {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      scale = 1 + eased * 0.1
      flareIntensity = eased * 0.5
    }

    // Light leak color tint
    const leakHue = (index * 50 + f * 0.3) % 360
    const leakColor = `hsla(${leakHue}, 80%, 70%, ${flareIntensity * 0.4})`

    return (
      <>
        {/* Light flare behind text */}
        {flareIntensity > 0.02 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${200 + flareIntensity * 300}px`,
              height: `${200 + flareIntensity * 300}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,240,200,${flareIntensity * 0.5}) 0%, ${leakColor} 40%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
        {/* Text with glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            color,
            letterSpacing: 4,
            textShadow: `0 0 ${10 + flareIntensity * 40}px ${color}${Math.round(flareIntensity * 99).toString().padStart(2, '0')}, 0 0 ${40 + flareIntensity * 80}px rgba(255,220,150,${flareIntensity * 0.5})`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Horizontal lens streak across text */}
        {flareIntensity > 0.1 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              right: '10%',
              height: 1,
              background: `linear-gradient(to right, transparent, rgba(255,240,200,${flareIntensity * 0.6}) 40%, rgba(255,240,200,${flareIntensity * 0.8}) 50%, rgba(255,240,200,${flareIntensity * 0.6}) 60%, transparent)`,
              transform: 'translateY(-50%)',
            }}
          />
        )}
      </>
    )
  },
}

function LensFlareComponent(props: MotionGraphicProps<LensFlareConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lens-flare',
  title: 'Kinetic Lens Flare',
  description: 'Text with cinematic lens flare light leaks, anamorphic streaks, and ghost flare reflections',
  tags: ['kinetic', 'typography', 'lens', 'flare', 'photography', 'light', 'cinematic', 'anamorphic'],
  category: 'captions',
  component: LensFlareComponent as any,
  defaultConfig: {
    words: ['LIGHT', 'FLARE', 'GLOW', 'BEAM'],
    colors: ['#FFFFFF', '#FFE8C8', '#FFFFFF', '#E0D0B8'],
    bgColor: '#0A0A14',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIGHT', 'FLARE', 'GLOW', 'BEAM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFE8C8', '#FFFFFF', '#E0D0B8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
