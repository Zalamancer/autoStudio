import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrunkOpenConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Trunk lid: starts at 0deg (closed, covering text from above) swings up to -110deg (fully open, past vertical)
    let lidAngle = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutBack(Math.min(1, enterProgress))
      // Lid starts at 0 (horizontal, over text) and swings to -110 (past upright)
      lidAngle = (1 - eased) * 0
      // Actually: lid goes FROM 0 (closed) TO -110 (open)
      lidAngle = -(eased * 110)
      opacity = enterProgress > 0.05 ? 1 : enterProgress / 0.05
    } else if (phase === 'hold') {
      // Lid sways in the breeze past upright
      lidAngle = -110 + Math.sin(holdProgress * Math.PI * 2.5) * 5
    } else {
      const eased = easeInQuad(exitProgress)
      lidAngle = -110 + eased * 110
      opacity = exitProgress < 0.8 ? 1 : (1 - exitProgress) / 0.2
    }

    const closedness = 1 - Math.min(1, Math.abs(lidAngle) / 110)
    const textOpacity = 1 - closedness * 0.9

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
        <div style={{ position: 'relative', width: '80%', maxWidth: 500 }}>
          {/* Trunk box body — bottom part (holds text) */}
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, #2a1f14, #1a1208)',
              border: '3px solid #5a3d1a',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 90,
              boxShadow: `0 8px 30px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Trunk interior lining */}
            <div
              style={{
                position: 'absolute',
                inset: 4,
                background: 'linear-gradient(180deg, #2d2418, #1e1710)',
                borderRadius: '0 0 4px 4px',
                border: '1px solid #3d2a10',
              }}
            />
            <div
              style={{
                position: 'relative',
                fontSize: 'clamp(44px, 11vw, 150px)',
                fontWeight: 900,
                color,
                whiteSpace: 'nowrap',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                letterSpacing: '0.01em',
                textShadow: `0 0 30px ${color}55, 0 2px 6px rgba(0,0,0,0.6)`,
                opacity: textOpacity,
              }}
            >
              {word}
            </div>
            {/* Metal corner brackets */}
            {[
              { top: 0, left: 0 },
              { top: 0, right: 0 },
              { bottom: 0, left: 0 },
              { bottom: 0, right: 0 },
            ].map((style, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  ...style,
                  width: 14,
                  height: 14,
                  background: 'radial-gradient(circle at 30% 30%, #cca060, #7a5020)',
                  borderRadius: 2,
                  zIndex: 2,
                }}
              />
            ))}
            {/* Center latch */}
            <div
              style={{
                position: 'absolute',
                top: -2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 8,
                background: 'linear-gradient(90deg, #cca060, #ffd080, #cca060)',
                borderRadius: '0 0 4px 4px',
                zIndex: 2,
              }}
            />
          </div>

          {/* Box rim / top edge */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              right: -3,
              height: 8,
              background: 'linear-gradient(90deg, #5a3d1a, #8a6030, #5a3d1a)',
              borderRadius: '2px 2px 0 0',
              zIndex: 3,
            }}
          />

          {/* Trunk lid — pivots up from bottom (trunk top edge) */}
          <div
            style={{
              position: 'absolute',
              top: -3,
              left: -3,
              right: -3,
              height: '55%',
              perspective: 1000,
              perspectiveOrigin: '50% 100%',
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                transformOrigin: 'bottom center',
                transform: `rotateX(${lidAngle}deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              {/* Lid face */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, #3a2818, #2a1f14)',
                  border: '3px solid #5a3d1a',
                  borderRadius: '8px 8px 0 0',
                  boxShadow: closedness > 0.1
                    ? `0 ${closedness * 20}px ${closedness * 40}px rgba(0,0,0,0.5)`
                    : 'none',
                }}
              >
                {/* Lid panels / decoration */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '8px 12px',
                    border: '1px solid #6a4d2a',
                    borderRadius: 4,
                    opacity: 0.4,
                  }}
                />
                {/* Metal straps on lid */}
                {[25, 75].map((pct) => (
                  <div
                    key={pct}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${pct}%`,
                      width: 6,
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(90deg, #7a5020, #cca060, #7a5020)',
                      opacity: 0.7,
                    }}
                  />
                ))}
                {/* Corner brackets on lid */}
                {[
                  { top: 0, left: 0 },
                  { top: 0, right: 0 },
                ].map((style, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      ...style,
                      width: 14,
                      height: 14,
                      background: 'radial-gradient(circle at 30% 30%, #cca060, #7a5020)',
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>

              {/* Lid underside (visible from inside when open) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, #1e1710, #2a1f14)',
                  borderRadius: '8px 8px 0 0',
                  transform: 'rotateX(180deg)',
                }}
              />
            </div>
          </div>

          {/* Hinge bars on sides */}
          {[-1, 1].map((side) => (
            <div
              key={side}
              style={{
                position: 'absolute',
                top: -4,
                [side < 0 ? 'left' : 'right']: 20,
                width: 8,
                height: 16,
                background: 'linear-gradient(90deg, #888, #ccc, #888)',
                borderRadius: 4,
                zIndex: 6,
              }}
            />
          ))}
        </div>
      </div>
    )
  },
}

function TrunkOpenComponent(props: MotionGraphicProps<TrunkOpenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-trunk-open',
  title: 'Kinetic Trunk Open',
  description: 'A wooden trunk lid swings up from the bottom edge like opening a car trunk or chest, revealing text glowing inside',
  tags: ['kinetic', 'typography', 'trunk', 'chest', 'open', 'hinge', 'lid', 'mechanical', 'vintage'],
  category: 'captions',
  component: TrunkOpenComponent as any,
  defaultConfig: {
    words: ['OPEN', 'CHEST', 'REVEAL', 'FIND'],
    colors: ['#FFD700', '#FF8C00', '#FF4500', '#DAA520'],
    bgColor: '#0d0805',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OPEN', 'CHEST', 'REVEAL', 'FIND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF8C00', '#FF4500', '#DAA520'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0805', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.6, max: 6, group: 'Timing' },
  ],
})
