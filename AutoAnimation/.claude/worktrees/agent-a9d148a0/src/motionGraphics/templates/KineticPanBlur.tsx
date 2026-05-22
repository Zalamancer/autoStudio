import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PanBlurConfig extends KineticBaseConfig {
  panDirection: number  // angle in degrees (0=right, 90=down, 180=left, 270=up)
}

// Camera pan blur: motion blur from a fast camera pan (horizontal smear)
// decelerates and the image stabilises to reveal crisp text.
// Classic technique for dynamic reveal cuts in sports, action, and music videos.
// We simulate the directional smear with CSS blur + translate offset.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, enterProgress, holdProgress, exitProgress }: BackgroundRenderProps) => {
    const ep = enterProgress ?? 0
    const xp = exitProgress ?? 0
    const hp = holdProgress ?? 0

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    // Speed lines — parallax streaks during pan, fade as motion stops
    const motionT = hp > 0 ? (xp > 0 ? easeOut(xp) : 0) : 1 - easeOut(ep)
    // motionT: 1 = full pan blur, 0 = still

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Horizontal speed streaks from pan */}
        {motionT > 0.05 && Array.from({ length: 12 }, (_, i) => {
          const y = 8 + i * 7.5
          const width = 20 + (i % 3) * 15
          const offset = (i % 5) * 6
          const opacity = motionT * (0.04 + (i % 2) * 0.03)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${y}%`,
                left: `${offset}%`,
                right: 0,
                height: 1 + (i % 2),
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${opacity * 1.5}) 30%, rgba(255,255,255,${opacity}) 70%, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* Motion blur ambient light smear */}
        {motionT > 0.1 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg,
                rgba(255,255,255,${motionT * 0.04}) 0%,
                transparent 40%,
                transparent 60%,
                rgba(255,255,255,${motionT * 0.03}) 100%
              )`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Settled vignette — visible when pan stops */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${0.3 + (1 - motionT) * 0.35}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeIn  = (t: number) => Math.pow(t, 3)

    let translateX: number   // horizontal offset simulating pan inertia
    let blur: number         // directional motion blur amount
    let opacity: number
    let skewX: number        // slight skew at peak speed

    const panDistance = 80  // px — how far text travels with the pan

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      // Text arrives from the pan direction, decelerates into position
      translateX = (1 - ep) * panDistance
      blur = (1 - ep) * 18
      skewX = (1 - ep) * -6
      opacity = 0.2 + ep * 0.8
    } else if (phase === 'hold') {
      translateX = 0
      blur = 0
      skewX = 0
      opacity = 1
    } else {
      const ep = easeIn(exitProgress)
      // Camera pans away — text blurs back out in opposite direction
      translateX = -ep * panDistance * 0.7
      blur = ep * 16
      skewX = ep * 4
      opacity = 1 - ep * 0.85
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) skewX(${skewX}deg)`,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Motion trail — ghost of text smeared in pan direction */}
        {blur > 1 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${blur * 1.5}px), -50%)`,
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.15)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              filter: `blur(${blur * 0.8}px)`,
              opacity: opacity * 0.5,
            }}
          >
            {word}
          </div>
        )}

        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            // Directional motion blur via CSS — approximated with horizontal blur
            filter: blur > 0.3
              ? `blur(${blur * 0.4}px) brightness(${1 + blur * 0.015})`
              : 'none',
            opacity,
            textShadow: blur < 1 ? `0 2px 16px rgba(0,0,0,0.6), 0 0 40px rgba(255,255,255,0.08)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PanBlurComponent(props: MotionGraphicProps<PanBlurConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pan-blur',
  title: 'Kinetic Pan Blur',
  description: 'Camera pan motion blur decelerates to reveal text — horizontal smear with speed lines and inertia, like a fast whip-pan cut settling on subject',
  tags: ['kinetic', 'typography', 'film', 'camera', 'pan', 'motion blur', 'whip pan', 'cinematic', 'action', 'speed'],
  category: 'captions',
  component: PanBlurComponent as any,
  defaultConfig: {
    words: ['ACTION', 'CUT', 'SCENE', 'TAKE'],
    colors: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#F8F8F8'],
    bgColor: '#060606',
    cycleDuration: 1.2,
    panDirection: 0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ACTION', 'CUT', 'SCENE', 'TAKE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#F8F8F8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060606', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'panDirection', label: 'Pan Direction (deg)', type: 'number', defaultValue: 0, min: 0, max: 360, group: 'Animation' },
  ],
})
