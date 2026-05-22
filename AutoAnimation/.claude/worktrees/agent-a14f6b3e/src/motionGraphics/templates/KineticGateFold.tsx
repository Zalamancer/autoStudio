import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GateFoldConfig extends KineticBaseConfig {
  gateColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Gate swings open from the center: left panel rotates left, right panel rotates right
    let leftAngle = 0
    let rightAngle = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // Doors start closed (facing viewer, covering text), swing outward
      leftAngle = (1 - eased) * -90
      rightAngle = (1 - eased) * 90
      opacity = enterProgress > 0.1 ? 1 : enterProgress / 0.1
    } else if (phase === 'hold') {
      // Slight sway on hinges
      const sway = Math.sin(holdProgress * Math.PI * 3) * 2
      leftAngle = -sway
      rightAngle = sway
    } else {
      const eased = easeInCubic(exitProgress)
      leftAngle = eased * -90
      rightAngle = eased * 90
      opacity = exitProgress < 0.7 ? 1 : (1 - exitProgress) / 0.3
    }

    // Hinge shadow intensity (strongest when doors nearly closed)
    const closedness = Math.max(Math.abs(leftAngle), Math.abs(rightAngle)) / 90
    const shadowOpacity = closedness * 0.5

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* The text sits behind the gate panels */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity,
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
              textShadow: `0 2px 12px ${color}44`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Left gate panel — pivots on right edge (origin: right) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '50%',
            height: '100%',
            perspective: 1000,
            perspectiveOrigin: '100% 50%',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, #2a2a2a, #3a3a3a)`,
              transformOrigin: 'right center',
              transform: `rotateY(${leftAngle}deg)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              boxShadow: `inset -4px 0 12px rgba(0,0,0,0.4)`,
            }}
          >
            {/* Hinge screws */}
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: `${pct}%`,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #888, #333)',
                  transform: 'translateY(-50%)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}
              />
            ))}
            {/* Shadow on inner face when closing */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `rgba(0,0,0,${shadowOpacity})`,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Right gate panel — pivots on left edge (origin: left) */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '50%',
            height: '100%',
            perspective: 1000,
            perspectiveOrigin: '0% 50%',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(270deg, #2a2a2a, #3a3a3a)`,
              transformOrigin: 'left center',
              transform: `rotateY(${rightAngle}deg)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              boxShadow: `inset 4px 0 12px rgba(0,0,0,0.4)`,
            }}
          >
            {/* Hinge screws */}
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                style={{
                  position: 'absolute',
                  left: 6,
                  top: `${pct}%`,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #888, #333)',
                  transform: 'translateY(-50%)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `rgba(0,0,0,${shadowOpacity})`,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Center gap highlight — the crease where gates meet */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: 2,
            transform: 'translateX(-50%)',
            background: `rgba(255,255,255,${closedness * 0.3})`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },
}

function GateFoldComponent(props: MotionGraphicProps<GateFoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gate-fold',
  title: 'Kinetic Gate Fold',
  description: 'Two gate panels swing open on hinges from the center, revealing text beneath — like a grand reveal gate',
  tags: ['kinetic', 'typography', 'gate', 'fold', 'hinge', 'door', 'reveal', 'mechanical'],
  category: 'captions',
  component: GateFoldComponent as any,
  defaultConfig: {
    words: ['OPEN', 'REVEAL', 'ENTER', 'BEGIN'],
    colors: ['#FFD700', '#FF6B35', '#00D4FF', '#7C3AED'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.8,
    gateColor: '#2a2a2a',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OPEN', 'REVEAL', 'ENTER', 'BEGIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF6B35', '#00D4FF', '#7C3AED'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'gateColor', label: 'Gate Color', type: 'color', defaultValue: '#2a2a2a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
