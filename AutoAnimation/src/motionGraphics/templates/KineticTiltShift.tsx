import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TiltShiftConfig extends KineticBaseConfig {
  sharpBandHeight: number
}

// Tilt-shift / miniature lens effect:
// A tilted plane of focus keeps only a horizontal band sharp — everything
// above and below falls into progressive blur. Used by photographers to
// make real scenes look like miniature scale models.
// Text sits in the sharp band; top/bottom of frame blur outward.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
      {/* Subtle horizontal grid — mimics miniature diorama lines */}
      {[15, 30, 45, 55, 70, 85].map(y => (
        <div
          key={y}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${y}%`,
            height: 1,
            background: 'rgba(255,255,255,0.03)',
            pointerEvents: 'none',
          }}
        />
      ))}
      {/* Tilt-shift blur bands — top and bottom of frame are blurred */}
      {/* Top blur band */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      />
      {/* Bottom blur band */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      />
      {/* Central clarity band highlight */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    let opacity: number
    let scale: number
    let yOffset: number  // text drifts in from slight vertical offset as focus lands

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      opacity = ep
      scale = 0.95 + ep * 0.05
      yOffset = (1 - ep) * 8  // rises gently into focus plane
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      yOffset = 0
    } else {
      const ep = easeOut(exitProgress)
      opacity = 1 - ep * 0.9
      scale = 1 + ep * 0.03
      yOffset = ep * -6  // drifts out upward
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${yOffset}px)) scale(${scale})`,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Soft glow in the focus plane */}
        <div
          style={{
            position: 'absolute',
            inset: '-8% -5%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(38px, 9vw, 130px)',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.12)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            filter: 'blur(10px)',
            opacity,
          }}
        >
          {word}
        </div>
        {/* Main text — crisp and sharp, lives in the focal plane */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(38px, 9vw, 130px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity,
            textShadow: `0 1px 0 rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.08)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function TiltShiftComponent(props: MotionGraphicProps<TiltShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tilt-shift',
  title: 'Kinetic Tilt Shift',
  description: 'Miniature tilt-shift lens effect: text sits razor-sharp in the focal plane while top and bottom of frame fall into deep progressive blur',
  tags: ['kinetic', 'typography', 'film', 'camera', 'tilt shift', 'miniature', 'depth of field', 'focus', 'cinematic', 'lens'],
  category: 'captions',
  component: TiltShiftComponent as any,
  defaultConfig: {
    words: ['TILT', 'SHIFT', 'MINIATURE', 'FOCUS'],
    colors: ['#FFFFFF', '#D0E8FF', '#FFFFFF', '#C8DCFF'],
    bgColor: '#060A0E',
    cycleDuration: 1.4,
    sharpBandHeight: 30,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TILT', 'SHIFT', 'MINIATURE', 'FOCUS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#D0E8FF', '#FFFFFF', '#C8DCFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060A0E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'sharpBandHeight', label: 'Sharp Band Height (%)', type: 'number', defaultValue: 30, min: 10, max: 60, group: 'Animation' },
  ],
})
