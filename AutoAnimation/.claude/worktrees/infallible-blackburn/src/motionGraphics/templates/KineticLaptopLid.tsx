import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LaptopLidConfig extends KineticBaseConfig {
  screenColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Laptop lid: starts at -90deg (screen face-down on desk) lifts to -10deg (open laptop angle)
    let lidAngle = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // Lid lifts from -90deg (flat) to -10deg (open)
      const startAngle = -90
      const endAngle = -10
      lidAngle = startAngle + eased * (endAngle - startAngle)
      opacity = enterProgress > 0.05 ? 1 : enterProgress / 0.05
    } else if (phase === 'hold') {
      // Slight screen wobble like someone typing
      lidAngle = -10 + Math.sin(holdProgress * Math.PI * 5) * 2
    } else {
      const eased = easeInQuad(exitProgress)
      lidAngle = -10 - eased * 80
      opacity = exitProgress < 0.75 ? 1 : (1 - exitProgress) / 0.25
    }

    // How open the screen is: 0 = closed, 1 = fully open
    const openness = Math.min(1, Math.max(0, (-lidAngle - 10) / 80))
    const screenBrightness = Math.max(0, 1 - openness * 0.1) // screen is bright when open

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
        <div style={{ position: 'relative', width: 320, height: 220 }}>
          {/* Keyboard base — always visible */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background: 'linear-gradient(180deg, #2d2d2d, #1f1f1f)',
              borderRadius: '0 0 12px 12px',
              border: '1.5px solid #3a3a3a',
              borderTop: 'none',
              overflow: 'hidden',
            }}
          >
            {/* Keyboard rows */}
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 3,
                  padding: `${4 + row * 2}px 12px 0`,
                }}
              >
                {Array.from({ length: 10 - row }, (_, k) => (
                  <div
                    key={k}
                    style={{
                      width: 18 + row * 2,
                      height: 10,
                      borderRadius: 2,
                      background: 'radial-gradient(circle at 40% 30%, #3a3a3a, #222)',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>
            ))}
            {/* Trackpad */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 60,
                height: 18,
                borderRadius: 3,
                background: '#252525',
                border: '1px solid #3a3a3a',
              }}
            />
          </div>

          {/* Hinge bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 78,
              left: 16,
              right: 16,
              height: 6,
              background: 'linear-gradient(90deg, #555, #888, #999, #888, #555)',
              borderRadius: 3,
              zIndex: 10,
            }}
          />

          {/* Lid — rotates around horizontal hinge at keyboard top */}
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              left: 0,
              right: 0,
              height: 140,
              perspective: 1000,
              perspectiveOrigin: '50% 100%',
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
              {/* Lid outer shell */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, #1c1c1c, #2a2a2a)',
                  borderRadius: '12px 12px 0 0',
                  border: '1.5px solid #3a3a3a',
                  borderBottom: 'none',
                }}
              >
                {/* Apple-style logo circle */}
                <div
                  style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #2e2e2e, #1a1a1a)',
                    opacity: 0.6,
                  }}
                />
              </div>

              {/* Screen (inside of lid, faces viewer when open) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: 'rotateX(180deg)',
                  borderRadius: '12px 12px 0 0',
                  background: openness > 0.2
                    ? `radial-gradient(ellipse at 50% 40%, ${color}15 0%, #050505 70%)`
                    : '#050505',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1.5px solid #1a1a1a',
                }}
              >
                {/* Screen bezel */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '8px 10px 4px',
                    background: '#000',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: openness > 0.3 ? `inset 0 0 30px ${color}22` : 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'clamp(32px, 8vw, 100px)',
                      fontWeight: 800,
                      color,
                      whiteSpace: 'nowrap',
                      fontFamily: "'SF Pro', 'Inter', 'Helvetica Neue', sans-serif",
                      letterSpacing: '-0.03em',
                      opacity: openness * screenBrightness,
                      textShadow: openness > 0.4 ? `0 0 30px ${color}66` : 'none',
                    }}
                  >
                    {word}
                  </div>
                  {/* Desktop taskbar at bottom */}
                  {openness > 0.5 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 8,
                        right: 8,
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.04)',
                        opacity: openness - 0.5,
                      }}
                    />
                  )}
                </div>
                {/* Camera dot */}
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#1a1a1a',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function LaptopLidComponent(props: MotionGraphicProps<LaptopLidConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-laptop-lid',
  title: 'Kinetic Laptop Lid',
  description: 'A laptop screen lifts up from the keyboard base on a realistic hinge, revealing text glowing on the screen as it opens',
  tags: ['kinetic', 'typography', 'laptop', 'lid', 'hinge', 'screen', '3d', 'tech', 'mechanical'],
  category: 'captions',
  component: LaptopLidComponent as any,
  defaultConfig: {
    words: ['POWER', 'ON', 'OPEN', 'CODE'],
    colors: ['#60A5FA', '#A78BFA', '#34D399', '#FB923C'],
    bgColor: '#0a0a14',
    cycleDuration: 2.2,
    screenColor: '#60A5FA',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POWER', 'ON', 'OPEN', 'CODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#60A5FA', '#A78BFA', '#34D399', '#FB923C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'screenColor', label: 'Screen Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.8, max: 6, group: 'Timing' },
  ],
})
