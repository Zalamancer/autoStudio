import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ViewfinderConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Viewfinder grid (rule of thirds)
    const thirdW = width / 3
    const thirdH = height / 3

    // Metering dots at intersections
    const intersections = [
      { x: thirdW, y: thirdH },
      { x: thirdW * 2, y: thirdH },
      { x: thirdW, y: thirdH * 2 },
      { x: thirdW * 2, y: thirdH * 2 },
    ]

    // Active focus point blinks
    const activeFocusIdx = Math.floor(frame / 30) % 4
    const blinkPhase = (frame % 30) / 30

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Viewfinder rounded border */}
        <div
          style={{
            position: 'absolute',
            inset: '3%',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
          }}
        />
        {/* Rule of thirds grid lines */}
        {[1, 2].map((i) => (
          <div key={`v${i}`}>
            {/* Vertical */}
            <div
              style={{
                position: 'absolute',
                left: thirdW * i,
                top: '3%',
                bottom: '3%',
                width: 1,
                background: 'rgba(255,255,255,0.08)',
              }}
            />
            {/* Horizontal */}
            <div
              style={{
                position: 'absolute',
                top: thirdH * i,
                left: '3%',
                right: '3%',
                height: 1,
                background: 'rgba(255,255,255,0.08)',
              }}
            />
          </div>
        ))}
        {/* Focus point indicators */}
        {intersections.map((pt, i) => {
          const isActive = i === activeFocusIdx
          const dotOpacity = isActive ? 0.5 + blinkPhase * 0.5 : 0.15
          const dotSize = isActive ? 8 : 4
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: pt.x,
                top: pt.y,
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: isActive ? '#FF3333' : 'rgba(255,255,255,0.4)',
                transform: 'translate(-50%, -50%)',
                opacity: dotOpacity,
                boxShadow: isActive ? '0 0 8px rgba(255,50,50,0.4)' : 'none',
              }}
            />
          )
        })}
        {/* Center focus brackets */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'clamp(50px, 10vw, 90px)',
            height: 'clamp(50px, 10vw, 90px)',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Top-left */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: '2px solid rgba(255,255,255,0.35)', borderLeft: '2px solid rgba(255,255,255,0.35)' }} />
          {/* Top-right */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: '2px solid rgba(255,255,255,0.35)', borderRight: '2px solid rgba(255,255,255,0.35)' }} />
          {/* Bottom-left */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: '2px solid rgba(255,255,255,0.35)', borderLeft: '2px solid rgba(255,255,255,0.35)' }} />
          {/* Bottom-right */}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: '2px solid rgba(255,255,255,0.35)', borderRight: '2px solid rgba(255,255,255,0.35)' }} />
        </div>
        {/* Exposure meter bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {Array.from({ length: 11 }).map((_, i) => {
            const isMid = i === 5
            const meterVal = Math.sin(frame * 0.04 + i * 0.2)
            return (
              <div
                key={i}
                style={{
                  width: isMid ? 2 : 1,
                  height: isMid ? 10 : 6,
                  background: `rgba(255,255,255,${0.2 + Math.abs(meterVal) * 0.2})`,
                }}
              />
            )
          })}
        </div>
        {/* Top-left info text */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.2vw, 11px)',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 1,
          }}
        >
          AF
        </div>
        {/* Top-right info */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            right: '5%',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.2vw, 11px)',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 1,
          }}
        >
          ISO {200 + Math.floor(frame / 60) * 100}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let focusBlur = 0

    if (phase === 'enter') {
      // Focus pull — starts blurred, snaps to sharp
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      focusBlur = (1 - eased) * 6
      scale = 1.08 - eased * 0.08
    } else if (phase === 'hold') {
      opacity = 1
      // Very subtle focus breathing
      focusBlur = Math.sin(holdProgress * Math.PI * 3) * 0.3
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.01
    } else {
      // Defocus and fade
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      focusBlur = eased * 8
      scale = 1 + eased * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: `blur(${focusBlur}px)`,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(38px, 11vw, 150px)',
          fontWeight: 800,
          textTransform: 'uppercase',
          color,
          letterSpacing: 4,
          textShadow: `0 0 10px ${color}30`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function ViewfinderComponent(props: MotionGraphicProps<ViewfinderConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-viewfinder',
  title: 'Kinetic Viewfinder',
  description: 'Text inside a camera viewfinder with rule-of-thirds grid, focus brackets, exposure meter, and focus pull animation',
  tags: ['kinetic', 'typography', 'camera', 'viewfinder', 'photography', 'focus', 'grid'],
  category: 'captions',
  component: ViewfinderComponent as any,
  defaultConfig: {
    words: ['FRAME', 'FOCUS', 'SHOOT', 'VIEW'],
    colors: ['#FFFFFF', '#E0E0E0', '#FFFFFF', '#D0D0D0'],
    bgColor: '#111111',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FRAME', 'FOCUS', 'SHOOT', 'VIEW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E0E0E0', '#FFFFFF', '#D0D0D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
