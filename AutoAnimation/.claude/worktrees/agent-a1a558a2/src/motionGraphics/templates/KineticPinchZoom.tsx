import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PinchZoomConfig extends KineticBaseConfig {
  pinchIntensity: number
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeInCubic(t: number): number { return t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Pinch point indicator lines converging to center */}
        {[-1, 0, 1].map(side => (
          <div key={side} style={{
            position: 'absolute',
            top: '50%',
            left: side < 0 ? 0 : side > 0 ? '100%' : '50%',
            width: side === 0 ? 1 : `${20 + Math.sin(time * 2) * 3}%`,
            height: 1,
            background: `rgba(255,255,255,0.04)`,
            transform: side === 0 ? 'translate(-50%, 0)' : side < 0 ? 'none' : 'translateX(-100%)',
          }} />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        {chars.map((ch, ci) => {
          // Position -1..1 from center; 0 = center char
          const centerOffset = totalChars > 1 ? (ci - (totalChars - 1) / 2) / ((totalChars - 1) / 2) : 0
          const distFromCenter = Math.abs(centerOffset)

          let translateX = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1

          if (phase === 'enter') {
            // Start: all chars pinched to center (scaleX near 0, all at same X)
            // Expand outward to full width with fan motion
            const fanOpen = easeOutBack(enterProgress)

            // Pinch: chars start at zero horizontal offset from each other (collapsed)
            // Their offset from center grows as fan opens
            const charTargetOffset = centerOffset  // normalized
            const currentOffset = charTargetOffset * fanOpen
            // Each character originally at 0 (compressed to center point)
            const compressionFactor = 1 - easeOutExpo(enterProgress)

            // Chars cluster at center initially, then fan out
            translateX = currentOffset * (width * 0.45) - charTargetOffset * (width * 0.45) * compressionFactor

            // Vertical: chars are tall/thin when pinched, normalize as they open
            scaleX = Math.max(0.1, fanOpen)
            scaleY = 1 + (1 - fanOpen) * 0.5

            opacity = Math.min(1, enterProgress * 4)
          } else if (phase === 'hold') {
            // Breathing: subtle horizontal pinch and release
            const breathe = Math.sin(holdProgress * Math.PI * 3) * 0.03
            scaleX = 1 + breathe
            scaleY = 1 - breathe * 0.3
            translateX = centerOffset * breathe * 20
          } else {
            // Re-pinch: all chars converge back to center point
            const ep = easeInCubic(exitProgress)
            translateX = -centerOffset * (width * 0.45) * ep
            scaleX = 1 - ep * 0.9
            scaleY = 1 + ep * 0.5
            opacity = exitProgress > 0.5 ? 1 - (exitProgress - 0.5) * 2 : 1
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `translateX(${translateX}px) scaleX(${scaleX}) scaleY(${scaleY})`,
              transformOrigin: 'center center',
              opacity,
              whiteSpace: 'pre',
              textShadow: `0 2px 8px rgba(0,0,0,0.3)`,
              lineHeight: 1,
            }}>
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function PinchZoomComponent(props: MotionGraphicProps<PinchZoomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pinch-zoom',
  title: 'Kinetic Pinch Zoom',
  description: 'Text is pinched to a single vertical seam at center then fans outward like an unfolding hand — characters radiate from the pinch point with elastic overshoot',
  tags: ['kinetic', 'typography', 'pinch', 'zoom', 'fan', 'warp', 'distort', 'unfold', 'converge'],
  category: 'captions',
  component: PinchZoomComponent as any,
  defaultConfig: {
    words: ['PINCH', 'ZOOM', 'PRESS', 'FAN'],
    colors: ['#2EC4B6', '#E71D36', '#FF9F1C', '#CBFFA9'],
    bgColor: '#011627',
    cycleDuration: 1.3,
    pinchIntensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PINCH', 'ZOOM', 'PRESS', 'FAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2EC4B6', '#E71D36', '#FF9F1C', '#CBFFA9'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#011627', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'pinchIntensity', label: 'Pinch Intensity', type: 'number', defaultValue: 1, min: 0.3, max: 2, group: 'Animation' },
  ],
})
