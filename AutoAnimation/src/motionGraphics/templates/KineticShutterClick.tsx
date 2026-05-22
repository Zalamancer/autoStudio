import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShutterClickConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, width, height }: BackgroundRenderProps) => {
    // Shutter blade positions — 6 blades closing and opening
    const bladeCount = 6
    const cx = width / 2
    const cy = height / 2
    const maxRadius = Math.sqrt(cx * cx + cy * cy)

    // Pulse shutter flash every ~40 frames
    const cycle = frame % 40
    const shutterClose = cycle < 4 ? cycle / 4 : cycle < 8 ? 1 - (cycle - 4) / 4 : 0
    const apertureRadius = maxRadius * (1 - shutterClose * 0.85)

    const blades = Array.from({ length: bladeCount }).map((_, i) => {
      const angle = (i / bladeCount) * Math.PI * 2 - Math.PI / 2
      const nextAngle = ((i + 1) / bladeCount) * Math.PI * 2 - Math.PI / 2
      const midAngle = (angle + nextAngle) / 2

      const innerR = apertureRadius * 0.3
      const outerR = apertureRadius * 1.8

      const x1 = cx + Math.cos(angle) * innerR
      const y1 = cy + Math.sin(angle) * innerR
      const x2 = cx + Math.cos(angle) * outerR
      const y2 = cy + Math.sin(angle) * outerR
      const x3 = cx + Math.cos(midAngle) * outerR
      const y3 = cy + Math.sin(midAngle) * outerR

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            borderLeft: `${Math.abs(x2 - x1)}px solid transparent`,
            borderRight: `${Math.abs(x3 - x2)}px solid transparent`,
            borderBottom: `${Math.abs(y2 - y1)}px solid rgba(20,20,20,${shutterClose * 0.6})`,
            transform: `translate(${Math.min(x1, x2, x3)}px, ${Math.min(y1, y2, y3)}px)`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)`,
          }}
        />
        {/* Aperture overlay lines */}
        {shutterClose > 0.01 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              left: `${cx - apertureRadius}px`,
              top: `${cy - apertureRadius}px`,
              width: `${apertureRadius * 2}px`,
              height: `${apertureRadius * 2}px`,
              border: `2px solid rgba(255,255,255,${shutterClose * 0.3})`,
            }}
          />
        )}
        {/* Flash on click */}
        {cycle < 2 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(255,255,255,${0.3 - cycle * 0.15})`,
            }}
          />
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let clipInset = '50% 50% 50% 50%' // Fully clipped (iris closed)

    if (phase === 'enter') {
      // Shutter opens to reveal — iris wipe from center
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      clipInset = `${50 - eased * 50}% ${50 - eased * 50}% ${50 - eased * 50}% ${50 - eased * 50}%`
      scale = 0.85 + eased * 0.15
    } else if (phase === 'hold') {
      opacity = 1
      clipInset = '0% 0% 0% 0%'
      // Subtle breathing scale
      scale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.02
    } else {
      // Shutter closes — iris wipe to center
      const eased = easeOutCubic(exitProgress)
      opacity = 1 - exitProgress
      clipInset = `${eased * 50}% ${eased * 50}% ${eased * 50}% ${eased * 50}%`
      scale = 1 - eased * 0.15
    }

    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            clipPath: `inset(${clipInset} round 50%)`,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            color,
            letterSpacing: 4,
            textShadow: `0 0 20px ${color}40, 0 2px 8px rgba(0,0,0,0.3)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Camera focus brackets */}
        {phase === 'hold' && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '35%',
                left: '25%',
                width: 'clamp(20px, 4vw, 40px)',
                height: 'clamp(20px, 4vw, 40px)',
                borderLeft: `2px solid ${color}50`,
                borderTop: `2px solid ${color}50`,
                opacity: 0.6 + Math.sin(holdProgress * Math.PI * 6) * 0.4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '35%',
                right: '25%',
                width: 'clamp(20px, 4vw, 40px)',
                height: 'clamp(20px, 4vw, 40px)',
                borderRight: `2px solid ${color}50`,
                borderBottom: `2px solid ${color}50`,
                opacity: 0.6 + Math.sin(holdProgress * Math.PI * 6) * 0.4,
              }}
            />
          </>
        )}
      </>
    )
  },
}

function ShutterClickComponent(props: MotionGraphicProps<ShutterClickConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shutter-click',
  title: 'Kinetic Shutter Click',
  description: 'Text appears with a camera shutter iris opening effect, flash burst, and focus bracket overlay',
  tags: ['kinetic', 'typography', 'camera', 'shutter', 'photography', 'iris', 'click'],
  category: 'captions',
  component: ShutterClickComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'CLICK', 'SHOOT', 'SNAP'],
    colors: ['#F5F5F5', '#E0D8C8', '#F5F5F5', '#C8D0E0'],
    bgColor: '#1A1A1A',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'CLICK', 'SHOOT', 'SNAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5F5F5', '#E0D8C8', '#F5F5F5', '#C8D0E0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
