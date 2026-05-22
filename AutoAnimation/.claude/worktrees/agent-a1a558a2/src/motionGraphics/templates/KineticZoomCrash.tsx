import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZoomCrashConfig extends KineticBaseConfig {
  crashIntensity: number
}

// Zoom crash / smash zoom:
// An ultra-fast manual zoom — the operator slams the zoom ring from wide to tele
// in a single frame burst. Creates aggressive kinetic energy. Used in action
// cinematography and documentary crash-cuts.
// Text flies from tiny (far) to extreme close-up, overshoots, bounces back.

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Radial speed-lines emanating from center — intensify during enter crash
    const lineCount = 16
    const pulseBase = 0.04 + Math.abs(Math.sin(time * 1.2)) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Radial speed lines */}
        {Array.from({ length: lineCount }, (_, i) => {
          const angle = (i / lineCount) * 360
          const opacity = pulseBase * (0.6 + (i % 3) * 0.2)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '80%',
                height: 1,
                background: `linear-gradient(to right, transparent 0%, rgba(255,255,255,${opacity}) 30%, transparent 100%)`,
                transformOrigin: '0% 50%',
                transform: `rotate(${angle}deg)`,
              }}
            />
          )
        })}
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,0,0.75) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let scale: number
    let opacity: number
    let blur: number
    let brightness: number

    if (phase === 'enter') {
      // Explosive zoom: tiny → overshoots → settles
      const ep = easeOutElastic(enterProgress)
      scale = 0.02 + ep * 0.98   // from almost invisible dot to full size
      opacity = Math.min(1, enterProgress * 4)  // snaps on quickly
      blur = Math.max(0, (1 - enterProgress * 1.5) * 8)  // motion blur on the crash in
      brightness = 1 + Math.max(0, 1 - enterProgress * 3) * 0.6  // flash on impact
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
      blur = 0
      brightness = 1
    } else {
      const ep = easeInExpo(exitProgress)
      // Fast crash out — zoom even closer until it fills frame then disappears
      scale = 1 + ep * 3.5
      opacity = Math.max(0, 1 - exitProgress * 2.5)
      blur = ep * 12
      brightness = 1
    }

    const filterParts: string[] = []
    if (blur > 0.1) filterParts.push(`blur(${blur}px)`)
    if (Math.abs(brightness - 1) > 0.02) filterParts.push(`brightness(${brightness})`)
    const filterStr = filterParts.length > 0 ? filterParts.join(' ') : 'none'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          whiteSpace: 'nowrap',
          opacity,
          filter: filterStr,
        }}
      >
        {/* Impact glow burst */}
        {phase === 'enter' && enterProgress < 0.4 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${200 + (1 - enterProgress) * 400}px`,
              height: `${200 + (1 - enterProgress) * 400}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,200,100,${0.3 * (1 - enterProgress * 2.5)}) 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 900,
            color,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            textShadow: `0 0 30px rgba(255,200,80,0.3), 0 4px 8px rgba(0,0,0,0.9)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ZoomCrashComponent(props: MotionGraphicProps<ZoomCrashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zoom-crash',
  title: 'Kinetic Zoom Crash',
  description: 'Smash zoom: text slams in from a near-invisible dot with elastic overshoot — explosive manual zoom crash effect with speed lines and impact flash',
  tags: ['kinetic', 'typography', 'film', 'camera', 'zoom crash', 'smash zoom', 'crash zoom', 'action', 'cinematic', 'lens'],
  category: 'captions',
  component: ZoomCrashComponent as any,
  defaultConfig: {
    words: ['CRASH', 'SLAM', 'IMPACT', 'ZOOM'],
    colors: ['#FFFFFF', '#FFE060', '#FF8040', '#FFFFFF'],
    bgColor: '#050508',
    cycleDuration: 1.2,
    crashIntensity: 100,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRASH', 'SLAM', 'IMPACT', 'ZOOM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFE060', '#FF8040', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050508', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 4, group: 'Timing' },
    { key: 'crashIntensity', label: 'Crash Intensity', type: 'number', defaultValue: 100, min: 50, max: 200, group: 'Animation' },
  ],
})
