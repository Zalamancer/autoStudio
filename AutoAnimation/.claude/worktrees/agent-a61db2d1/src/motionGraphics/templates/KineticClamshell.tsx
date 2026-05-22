import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ClamshellConfig extends KineticBaseConfig {
  shellColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Clamshell: top half rotates on horizontal hinge at center up (-90X -> 0)
    // bottom half rotates down (90X -> 0), revealing text between them
    let topAngle = 0
    let bottomAngle = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutBack(Math.min(1, enterProgress))
      topAngle = -(1 - eased) * 90
      bottomAngle = (1 - eased) * 90
      opacity = enterProgress > 0.1 ? 1 : enterProgress / 0.1
    } else if (phase === 'hold') {
      // Gentle clamshell quiver
      const quiver = Math.sin(holdProgress * Math.PI * 4) * 1.5
      topAngle = -quiver
      bottomAngle = quiver
    } else {
      const eased = easeInCubic(exitProgress)
      topAngle = -eased * 90
      bottomAngle = eased * 90
      opacity = exitProgress < 0.7 ? 1 : (1 - exitProgress) / 0.3
    }

    const closedness = Math.max(Math.abs(topAngle), Math.abs(bottomAngle)) / 90
    const shellShadow = closedness * 0.6

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
        }}
      >
        {/* Text in the center — revealed between the two halves */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(48px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              letterSpacing: '-0.02em',
              textShadow: `0 0 40px ${color}55, 0 2px 8px rgba(0,0,0,0.4)`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Top shell — rotates up on horizontal hinge at bottom of panel */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '50%',
            perspective: 900,
            perspectiveOrigin: '50% 100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'bottom center',
              transform: `rotateX(${topAngle}deg)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              background: `linear-gradient(180deg, #252525 0%, #1a1a1a 100%)`,
              borderTop: '3px solid #444',
              boxShadow: `0 ${8 * closedness}px ${20 * closedness}px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Concave inner surface texture */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse at 50% 120%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
              }}
            />
            {/* Shadow gradient on inner face as it closes */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(0deg, rgba(0,0,0,${shellShadow * 0.7}) 0%, transparent 60%)`,
                pointerEvents: 'none',
              }}
            />
            {/* Hinge ridge at bottom edge */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '10%',
                right: '10%',
                height: 3,
                background: 'linear-gradient(90deg, #555, #888, #555)',
                borderRadius: 1,
              }}
            />
          </div>
        </div>

        {/* Bottom shell — rotates down on horizontal hinge at top of panel */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '50%',
            perspective: 900,
            perspectiveOrigin: '50% 0%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'top center',
              transform: `rotateX(${bottomAngle}deg)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              background: `linear-gradient(0deg, #252525 0%, #1a1a1a 100%)`,
              borderBottom: '3px solid #444',
              boxShadow: `0 -${8 * closedness}px ${20 * closedness}px rgba(0,0,0,0.5)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, rgba(0,0,0,${shellShadow * 0.7}) 0%, transparent 60%)`,
                pointerEvents: 'none',
              }}
            />
            {/* Hinge ridge at top edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '10%',
                height: 3,
                background: 'linear-gradient(90deg, #555, #888, #555)',
                borderRadius: 1,
              }}
            />
          </div>
        </div>

        {/* Center seam highlight */}
        <div
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: '50%',
            height: Math.max(1, closedness * 4),
            transform: 'translateY(-50%)',
            background: `rgba(255,255,255,${closedness * 0.5})`,
            pointerEvents: 'none',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },
}

function ClamshellComponent(props: MotionGraphicProps<ClamshellConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-clamshell',
  title: 'Kinetic Clamshell',
  description: 'Top and bottom shell halves rotate open on a horizontal hinge at center, revealing text inside like a clamshell opening',
  tags: ['kinetic', 'typography', 'clamshell', 'hinge', 'fold', 'reveal', 'mechanical', 'shell'],
  category: 'captions',
  component: ClamshellComponent as any,
  defaultConfig: {
    words: ['CRACK', 'OPEN', 'SHELL', 'WIDE'],
    colors: ['#22D3EE', '#A78BFA', '#FB923C', '#4ADE80'],
    bgColor: '#050505',
    cycleDuration: 1.8,
    shellColor: '#1a1a1a',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRACK', 'OPEN', 'SHELL', 'WIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#22D3EE', '#A78BFA', '#FB923C', '#4ADE80'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    { key: 'shellColor', label: 'Shell Color', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
