import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlipPhoneConfig extends KineticBaseConfig {
  screenGlow: string
}

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 4.5
  if (t === 0) return 0
  if (t === 1) return 1
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Flip phone: the lid starts at -160deg (almost closed, folded back) and swings to 0 (open flat)
    // Hinge is at the horizontal center
    let lidAngle = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutElastic(Math.min(1, enterProgress))
      // Lid starts at -160deg (phone closed) and opens to 0deg
      lidAngle = -(1 - eased) * 160
      opacity = enterProgress > 0.05 ? 1 : enterProgress / 0.05
    } else if (phase === 'hold') {
      // Tiny wobble like holding it open
      lidAngle = Math.sin(holdProgress * Math.PI * 3) * 2
    } else {
      const eased = easeInCubic(exitProgress)
      lidAngle = -eased * 160
      opacity = exitProgress < 0.6 ? 1 : (1 - exitProgress) / 0.4
    }

    const closedness = Math.abs(lidAngle) / 160
    const screenVisible = 1 - closedness

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
        {/* Phone body — bottom half (fixed) */}
        <div style={{ position: 'relative', width: 220, height: 320 }}>
          {/* Bottom body */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a)',
              borderRadius: '0 0 20px 20px',
              border: '2px solid #444',
              borderTop: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Keypad dots */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: 16 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: 'radial-gradient(circle at 40% 35%, #555, #222)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>
            {/* Hinge bump */}
            <div
              style={{
                position: 'absolute',
                top: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 12,
                background: 'linear-gradient(180deg, #555, #333)',
                borderRadius: 6,
                boxShadow: '0 -2px 4px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* Lid — rotates on horizontal hinge at center */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              perspective: 800,
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
              {/* Lid outer surface */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, #1a1a1a, #2a2a2a)',
                  borderRadius: '20px 20px 0 0',
                  border: '2px solid #444',
                  borderBottom: 'none',
                }}
              />
              {/* Screen on inside of lid */}
              <div
                style={{
                  position: 'absolute',
                  inset: '8px 10px 4px',
                  background: screenVisible > 0.3
                    ? `radial-gradient(ellipse at 50% 40%, ${color}22, #000)`
                    : '#000',
                  borderRadius: '12px 12px 0 0',
                  border: `1px solid ${color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: screenVisible > 0.3 ? `inset 0 0 20px ${color}33` : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(28px, 7vw, 90px)',
                    fontWeight: 900,
                    color,
                    whiteSpace: 'nowrap',
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: '0.04em',
                    opacity: screenVisible,
                    textShadow: `0 0 20px ${color}, 0 0 40px ${color}88`,
                  }}
                >
                  {word}
                </div>
                {/* Screen scanlines */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
                    pointerEvents: 'none',
                    opacity: screenVisible,
                  }}
                />
              </div>
              {/* Speaker grille at top */}
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: '#111',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function FlipPhoneComponent(props: MotionGraphicProps<FlipPhoneConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flip-phone',
  title: 'Kinetic Flip Phone',
  description: 'A flip phone lid swings open with 3D rotateX hinge and elastic overshoot, revealing text on the glowing screen inside',
  tags: ['kinetic', 'typography', 'flip-phone', 'hinge', 'phone', '3d', 'nostalgia', 'mechanical'],
  category: 'captions',
  component: FlipPhoneComponent as any,
  defaultConfig: {
    words: ['HELLO', 'FLIP', 'OPEN', 'CALL'],
    colors: ['#00FF88', '#00CCFF', '#FF66CC', '#FFCC00'],
    bgColor: '#0a0a0a',
    cycleDuration: 2.0,
    screenGlow: '#00FF88',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HELLO', 'FLIP', 'OPEN', 'CALL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#00CCFF', '#FF66CC', '#FFCC00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'screenGlow', label: 'Screen Glow', type: 'color', defaultValue: '#00FF88', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.6, max: 6, group: 'Timing' },
  ],
})
