import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HingedFlapConfig extends KineticBaseConfig {
  flapColor: string
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75 }
  if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375 }
  t -= 2.625 / d1
  return n1 * t * t + 0.984375
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Mail slot / cat flap: hinged at top, swings DOWN to reveal text
    // Flap starts at 0deg (closed, hiding text) and swings to 90deg (open, hanging down)
    let flapAngle = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutBounce(Math.min(1, enterProgress))
      flapAngle = eased * 90
      opacity = enterProgress > 0.05 ? 1 : enterProgress / 0.05
    } else if (phase === 'hold') {
      // Flap swings slightly like the pendulum effect of a door flap
      flapAngle = 90 + Math.sin(holdProgress * Math.PI * 3) * 8
    } else {
      const eased = easeInCubic(exitProgress)
      flapAngle = 90 - eased * 90
      opacity = exitProgress < 0.8 ? 1 : (1 - exitProgress) / 0.2
    }

    const closedness = 1 - Math.min(1, flapAngle / 90)
    const textVisible = 1 - closedness

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
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* The text — revealed as flap swings away */}
          <div
            style={{
              fontSize: 'clamp(48px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              letterSpacing: '0.04em',
              textShadow: `0 2px 10px ${color}44`,
              opacity: textVisible,
            }}
          >
            {word}
          </div>

          {/* Flap — hinged at top, swings down */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px -16px',
              perspective: 800,
              perspectiveOrigin: '50% 0%',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                transformOrigin: 'top center',
                transform: `rotateX(${flapAngle}deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              {/* Flap face */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, #c8a060, #8a6830)',
                  borderRadius: '4px 4px 8px 8px',
                  border: '2px solid #6a4820',
                  boxShadow: closedness > 0.1
                    ? `0 ${closedness * 12}px ${closedness * 24}px rgba(0,0,0,0.4)`
                    : 'none',
                }}
              >
                {/* Mail slot opening slit — dark rectangle */}
                <div
                  style={{
                    position: 'absolute',
                    top: '42%',
                    left: '8%',
                    right: '8%',
                    height: '16%',
                    background: '#1a0f00',
                    borderRadius: 2,
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
                  }}
                />
                {/* Brushed metal texture highlight */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 5px)',
                    borderRadius: '4px 4px 8px 8px',
                    pointerEvents: 'none',
                  }}
                />
                {/* Specular shine at top */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '10%',
                    right: '10%',
                    height: '30%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent)',
                    borderRadius: '4px 4px 0 0',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Flap underside (visible when fully swung down) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, #3a2810, #251a08)',
                  borderRadius: '4px 4px 8px 8px',
                  transform: 'rotateX(180deg)',
                  backfaceVisibility: 'hidden',
                }}
              />
            </div>
          </div>

          {/* Hinge bar at top of flap */}
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: '15%',
              right: '15%',
              height: 6,
              background: 'linear-gradient(90deg, #888, #ccc, #aaa, #ccc, #888)',
              borderRadius: 3,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          />

          {/* Hinge screws */}
          {[25, 75].map((pct) => (
            <div
              key={pct}
              style={{
                position: 'absolute',
                top: -13,
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ddd, #666)',
                zIndex: 11,
                boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
              }}
            />
          ))}

          {/* Frame / door surround */}
          <div
            style={{
              position: 'absolute',
              inset: '-16px -24px',
              border: '4px solid #3a2810',
              borderRadius: 10,
              background: 'transparent',
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />
          {/* Frame inner reveal shadow */}
          {textVisible > 0.1 && (
            <div
              style={{
                position: 'absolute',
                inset: '-12px -20px',
                boxShadow: `inset 0 0 20px rgba(0,0,0,${textVisible * 0.3})`,
                borderRadius: 8,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function HingedFlapComponent(props: MotionGraphicProps<HingedFlapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hinged-flap',
  title: 'Kinetic Hinged Flap',
  description: 'A brass mail-slot flap swings down from the top hinge with a bounce, revealing text beneath like a door letterbox',
  tags: ['kinetic', 'typography', 'flap', 'hinge', 'mail', 'slot', 'door', 'bounce', 'mechanical', 'brass'],
  category: 'captions',
  component: HingedFlapComponent as any,
  defaultConfig: {
    words: ['MAIL', 'DROP', 'SLOT', 'PUSH'],
    colors: ['#FBBF24', '#F87171', '#34D399', '#60A5FA'],
    bgColor: '#0f0b08',
    cycleDuration: 1.8,
    flapColor: '#c8a060',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MAIL', 'DROP', 'SLOT', 'PUSH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FBBF24', '#F87171', '#34D399', '#60A5FA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0b08', group: 'Style' },
    { key: 'flapColor', label: 'Flap Color', type: 'color', defaultValue: '#c8a060', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
