import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PullFocusConfig extends KineticBaseConfig {
  foregroundBlur: number
}

// Rack focus / pull focus: the focus assistant physically turns the focus ring
// between two subjects. Here: text starts as a foreground soft blob — close and
// blurred — then the "assistant" pulls focus and the text snaps into sharp clarity.
// A warm haze layer in front represents the out-of-focus foreground plane.

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Simulated foreground dust/particles that are blurred when near
const PARTICLES = [
  { x: 12, y: 30, s: 3 },
  { x: 80, y: 20, s: 4 },
  { x: 25, y: 70, s: 2 },
  { x: 70, y: 75, s: 5 },
  { x: 45, y: 15, s: 2 },
  { x: 88, y: 55, s: 3 },
  { x: 8, y: 80, s: 4 },
  { x: 55, y: 85, s: 2 },
  { x: 92, y: 40, s: 3 },
  { x: 35, y: 55, s: 2 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Out-of-focus foreground particles — big warm blobs */}
        {PARTICLES.map((p, i) => {
          const drift = Math.sin(time * 0.25 + i * 1.3) * 0.8
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${p.x + drift}%`,
                top: `${p.y}%`,
                width: `${p.s * 10}px`,
                height: `${p.s * 10}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(255,180,80,0.12) 0%, transparent 80%)`,
                filter: `blur(${p.s * 5}px)`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Background depth lines */}
        {[20, 40, 60, 80].map(y => (
          <div
            key={y}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${y}%`,
              height: 1,
              background: 'rgba(255,255,255,0.025)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Cinematic vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 28%, rgba(0,0,0,0.72) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let blur: number
    let opacity: number
    let scale: number
    let warmth: number  // warm color cast when out of focus (foreground = warm)

    if (phase === 'enter') {
      // Pulling from soft foreground blur → sharp
      const ep = easeOutCubic(enterProgress)
      blur = (1 - ep) * 28   // drops from heavy blur to zero
      opacity = 0.3 + ep * 0.7
      scale = 1 + (1 - ep) * 0.12  // slightly large when close/blurred
      warmth = (1 - ep) * 0.6
    } else if (phase === 'hold') {
      blur = 0
      opacity = 1
      scale = 1
      warmth = 0
    } else {
      const ep = easeInCubic(exitProgress)
      blur = ep * 24
      opacity = 1 - ep * 0.9
      scale = 1 + ep * 0.1
      warmth = ep * 0.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          whiteSpace: 'nowrap',
          opacity,
        }}
      >
        {/* Warm bloom — foreground out-of-focus haze */}
        {warmth > 0.05 && (
          <div
            style={{
              position: 'absolute',
              inset: '-20% -15%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 700,
              color: `rgba(255,160,60,${warmth * 0.7})`,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              filter: `blur(${blur * 0.8 + 18}px)`,
            }}
          >
            {word}
          </div>
        )}
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            filter: blur > 0.2 ? `blur(${blur}px)` : 'none',
            textShadow: blur < 0.5 ? `0 0 30px rgba(200,220,255,0.25), 0 2px 6px rgba(0,0,0,0.8)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PullFocusComponent(props: MotionGraphicProps<PullFocusConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pull-focus',
  title: 'Kinetic Pull Focus',
  description: 'Rack focus pull: text starts as a blurred warm foreground blob and snaps into sharp clarity as the focus is pulled — warm-to-sharp cinematic focus reveal',
  tags: ['kinetic', 'typography', 'film', 'camera', 'pull focus', 'rack focus', 'depth of field', 'cinematic', 'lens', 'focus'],
  category: 'captions',
  component: PullFocusComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'PULL', 'RACK', 'SHARP'],
    colors: ['#FFFFFF', '#F0EDE0', '#FFFFFF', '#E8E4D0'],
    bgColor: '#07060A',
    cycleDuration: 1.5,
    foregroundBlur: 28,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'PULL', 'RACK', 'SHARP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0EDE0', '#FFFFFF', '#E8E4D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#07060A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'foregroundBlur', label: 'Foreground Blur (px)', type: 'number', defaultValue: 28, min: 10, max: 60, group: 'Animation' },
  ],
})
