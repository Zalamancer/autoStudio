import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FisheyeLensConfig extends KineticBaseConfig {}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle radial lens distortion lines
    const rings = Array.from({ length: 5 }, (_, i) => {
      const radius = 15 + i * 18
      const pulseOffset = Math.sin(time * 0.8 + i * 0.6) * 2
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${radius + pulseOffset}%`,
            height: `${radius + pulseOffset}%`,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${0.03 + i * 0.005})`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Radial vignette for lens feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
        {rings}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Fisheye = extreme scale at center, warped perspective
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let borderRadius = '0%'
    let letterSpacing = 0

    if (phase === 'enter') {
      // Start with extreme fisheye bulge, normalize to flat
      const t = easeOutElastic(enterProgress)
      // Fisheye starts very bloated in center, squished at edges
      scaleX = 1 + (1 - t) * 2.5 // Extreme horizontal stretch
      scaleY = 1 + (1 - t) * 2.5 // Extreme vertical stretch
      borderRadius = `${(1 - t) * 50}%`
      letterSpacing = (1 - t) * 30
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      // Subtle breathing lens pulse
      const pulse = Math.sin(holdProgress * Math.PI * 3) * 0.04
      scaleX = 1 + pulse
      scaleY = 1 + pulse
      letterSpacing = 0
    } else {
      // Re-fisheye on exit, suck back into lens
      const t = easeInCubic(exitProgress)
      scaleX = 1 + t * 3
      scaleY = 1 + t * 3
      borderRadius = `${t * 50}%`
      letterSpacing = t * 40
      opacity = 1 - t
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 800,
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius,
            padding: '16px 32px',
          }}
        >
          {/* Lens glass overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle, rgba(255,255,255,${0.06 * scaleX}) 0%, transparent 70%)`,
              pointerEvents: 'none',
              borderRadius: 'inherit',
            }}
          />
          <div
            style={{
              transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
              transformOrigin: 'center center',
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 900,
              color,
              textShadow: `0 0 20px ${color}55, 0 0 40px ${color}22`,
              whiteSpace: 'nowrap',
              letterSpacing,
              opacity,
              textAlign: 'center',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function FisheyeLensComponent(props: MotionGraphicProps<FisheyeLensConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fisheye-lens',
  title: 'Kinetic Fisheye Lens',
  description: 'Text bursts through a fisheye lens distortion with extreme bulging that normalizes to flat on reveal, elastic settle, and radial vignette',
  tags: ['kinetic', 'typography', 'fisheye', 'lens', 'distortion', 'warp', 'optics'],
  category: 'captions',
  component: FisheyeLensComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'LENS', 'WARP', 'ZOOM'],
    colors: ['#00D4FF', '#FF6B9D', '#A78BFA', '#34D399'],
    bgColor: '#0a0a1a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'LENS', 'WARP', 'ZOOM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00D4FF', '#FF6B9D', '#A78BFA', '#34D399'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
