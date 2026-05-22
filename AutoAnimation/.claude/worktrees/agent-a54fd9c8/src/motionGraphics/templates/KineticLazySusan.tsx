import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LazySusanConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * KineticLazySusan
 * A circular rotating platform (lazy susan) viewed at a shallow perspective angle.
 * The text sits on the platform and rotates INTO view — starting from the far back
 * of the disc (small, foreshortened), sweeping around to the front (large, readable).
 * Uses CSS 3D perspective + rotateY on the platform so depth is visible.
 * The platform appears as a flattened ellipse due to perspective tilt.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const cx = width / 2
    const cy = height * 0.58 // platform sits slightly below center
    const platW = width * 0.78
    const platH = platW * 0.22 // foreshortened ellipse

    // Concentric rings on the platform
    const rings = Array.from({ length: 4 }, (_, i) => {
      const scale = 0.3 + 0.175 * i
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx - (platW * scale) / 2,
            top: cy - (platH * scale) / 2,
            width: platW * scale,
            height: platH * scale,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${0.04 + i * 0.02})`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Platform ellipse */}
        <div
          style={{
            position: 'absolute',
            left: cx - platW / 2,
            top: cy - platH / 2,
            width: platW,
            height: platH,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
          }}
        />
        {rings}
        {/* Center spindle */}
        <div
          style={{
            position: 'absolute',
            left: cx - 4,
            top: cy - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.35)',
          }}
        />
        {/* Table surface shadow beneath platform */}
        <div
          style={{
            position: 'absolute',
            left: cx - platW * 0.52,
            top: cy + platH * 0.4,
            width: platW * 1.04,
            height: platH * 0.4,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.25)',
            filter: 'blur(8px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // The platform rotates around the Y-axis (vertical) viewed at angle.
    // We simulate this by rotating the text's position around a vertical Y axis
    // projected onto screen. Text starts at the "back" of the disc (rotateY = 180°)
    // and swings around to the "front" (rotateY = 0°), picking up scale/brightness.

    const cy = height * 0.52

    let rotateYDeg = 180
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      rotateYDeg = 180 - 180 * eased
      opacity = enterProgress < 0.25 ? enterProgress / 0.25 : 1
    } else if (phase === 'hold') {
      rotateYDeg = 0
    } else {
      const eased = easeInCubic(exitProgress)
      rotateYDeg = 180 * eased // spins away to back again
      opacity = exitProgress > 0.65 ? 1 - (exitProgress - 0.65) / 0.35 : 1
    }

    // Perspective projection of a point on a circle at angle rotateYDeg
    // x offset on screen = cos(rotateYDeg) * radius (horizontal position on disc)
    // depth = sin(rotateYDeg) — affects scale and brightness
    const cosA = Math.cos((rotateYDeg * Math.PI) / 180)
    const sinA = Math.sin((rotateYDeg * Math.PI) / 180) // depth factor: 0 = front, 1 = side

    // At 0° (front): scale=1, brightness=1
    // At 90° (side): scale shrinks in X
    // At 180° (back): near invisible
    const perspectiveScale = 1 - 0.35 * Math.abs(sinA)
    const depthBrightness = 0.25 + 0.75 * (1 - Math.abs(sinA))

    // Vertical position: at back of disc, text appears higher (further away)
    const depthY = -sinA * height * 0.06

    // Horizontal foreshortening: platform is seen at perspective, text X shifts with rotation
    const scaleX = Math.abs(cosA)

    return (
      <div
        style={{
          position: 'absolute',
          top: cy,
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${depthY}px)`,
          opacity,
        }}
      >
        {/* Shadow on the platform */}
        {Math.abs(sinA) < 0.6 && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '-18%',
              transform: `translateX(-50%) scaleX(${scaleX * 0.8}) scaleY(0.25)`,
              width: '120%',
              height: '100%',
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(0,0,0,${0.3 * depthBrightness}) 0%, transparent 70%)`,
              filter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          />
        )}
        <span
          style={{
            display: 'inline-block',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transform: `scaleX(${scaleX}) scale(${perspectiveScale})`,
            filter: `brightness(${depthBrightness})`,
            textShadow: `0 4px 24px ${color}44`,
            transformOrigin: 'center center',
          }}
        >
          {word}
        </span>
      </div>
    )
  },
}

function LazySusanComponent(props: MotionGraphicProps<LazySusanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lazy-susan',
  title: 'Kinetic Lazy Susan',
  description:
    'Text rotates in on a lazy-susan platform — viewed at perspective angle, the word sweeps from the back of the disc to the front with depth foreshortening.',
  tags: ['kinetic', 'typography', 'lazy-susan', 'rotate', 'perspective', 'depth', '3d', 'platform'],
  category: 'captions',
  component: LazySusanComponent as any,
  defaultConfig: {
    words: ['SERVE', 'SPIN', 'DISH', 'HOT'],
    colors: ['#FFA040', '#FFDD88', '#FF6633', '#FFBB44'],
    bgColor: '#0c0806',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SERVE', 'SPIN', 'DISH', 'HOT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFA040', '#FFDD88', '#FF6633', '#FFBB44'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0806', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
