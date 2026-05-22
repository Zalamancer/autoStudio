import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DJDeckConfig extends KineticBaseConfig {
  deckColor: string
  neonColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const platSize = Math.min(width, height) * 0.32

    // Two platters rotating at different speeds
    const leftRotation = time * 33.3 // ~33 RPM
    const rightRotation = time * 45 // ~45 RPM

    const leftCx = cx - platSize * 0.85
    const rightCx = cx + platSize * 0.85

    function renderPlatter(px: number, rotation: number, key: string) {
      const grooveCount = 10
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            top: cy - platSize,
            left: px - platSize,
            width: platSize * 2,
            height: platSize * 2,
          }}
        >
          {/* Platter base */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle, #1a1a1a 20%, #111 22%, #1a1a1a 80%, #111 100%)`,
              transform: `rotate(${rotation}deg)`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            {/* Groove rings */}
            {Array.from({ length: grooveCount }).map((_, i) => {
              const r = platSize * (0.25 + (i / grooveCount) * 0.65)
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: r * 2,
                    height: r * 2,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )
            })}

            {/* Vinyl shine */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
              }}
            />

            {/* Center label */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: platSize * 0.35,
                height: platSize * 0.35,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #2a2a2a 0%, #1a1a1a 100%)',
                transform: 'translate(-50%, -50%)',
                border: '2px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#444',
                }}
              />
            </div>
          </div>

          {/* Neon ring glow */}
          <div
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: '50%',
              border: '1px solid rgba(0,200,255,0.15)',
              boxShadow: '0 0 12px rgba(0,200,255,0.1), inset 0 0 12px rgba(0,200,255,0.05)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )
    }

    // Crossfader position oscillates
    const crossfaderPos = 0.5 + 0.3 * Math.sin(time * 0.5)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Deck surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, #0a0a0f 0%, #121218 50%, #0a0a0f 100%)`,
          }}
        />

        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,200,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,200,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Left platter */}
        {renderPlatter(leftCx, leftRotation, 'left')}

        {/* Right platter */}
        {renderPlatter(rightCx, rightRotation, 'right')}

        {/* Crossfader / Mixer section */}
        <div
          style={{
            position: 'absolute',
            top: cy + platSize * 0.6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(160px, 35vw, 260px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 10px)',
          }}
        >
          {/* Channel meters */}
          <div style={{ display: 'flex', gap: 'clamp(20px, 5vw, 40px)', marginBottom: 4 }}>
            {[0, 1].map((ch) => (
              <div
                key={ch}
                style={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-end',
                  height: 'clamp(20px, 4vw, 32px)',
                }}
              >
                {Array.from({ length: 5 }).map((_, j) => {
                  const level = Math.sin(time * (3 + ch) + j * 0.5) * 0.5 + 0.5
                  const isActive = j / 5 < level
                  const meterColor = j < 3 ? '#00FF88' : j < 4 ? '#FFAA00' : '#FF4444'
                  return (
                    <div
                      key={j}
                      style={{
                        width: 'clamp(3px, 0.6vw, 5px)',
                        height: `${40 + j * 15}%`,
                        background: isActive ? meterColor : '#222',
                        borderRadius: 1,
                        opacity: isActive ? 0.9 : 0.3,
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Crossfader track */}
          <div
            style={{
              width: '80%',
              height: 'clamp(4px, 0.8vw, 6px)',
              background: '#222',
              borderRadius: 3,
              position: 'relative',
            }}
          >
            {/* Crossfader knob */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${crossfaderPos * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 'clamp(16px, 3vw, 24px)',
                height: 'clamp(10px, 2vw, 14px)',
                background: 'linear-gradient(180deg, #555, #333)',
                borderRadius: 3,
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              }}
            />
          </div>

          {/* EQ knobs */}
          <div style={{ display: 'flex', gap: 'clamp(10px, 2vw, 18px)', marginTop: 4 }}>
            {[0, 1, 2].map((k) => (
              <div
                key={k}
                style={{
                  width: 'clamp(12px, 2.5vw, 18px)',
                  height: 'clamp(12px, 2.5vw, 18px)',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #444 0%, #222 100%)',
                  border: '1px solid #555',
                  position: 'relative',
                }}
              >
                {/* Knob indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: '50%',
                    width: 2,
                    height: '35%',
                    background: '#00CCFF',
                    transform: `translateX(-50%) rotate(${time * 20 + k * 40}deg)`,
                    transformOrigin: 'bottom center',
                    borderRadius: 1,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    holdProgress,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let glowStrength = 20

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.7 + 0.3 * eased
    } else if (phase === 'hold') {
      // Subtle pulse
      glowStrength = 20 + 10 * Math.sin(holdProgress * Math.PI * 6)
    } else {
      opacity = 1 - exitProgress
      scale = 1 + 0.2 * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(36px, 9vw, 120px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textShadow: `0 0 ${glowStrength}px ${color}80, 0 0 ${glowStrength * 2}px ${color}30`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function DJDeckComponent(props: MotionGraphicProps<DJDeckConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dj-deck',
  title: 'Kinetic DJ Deck',
  description:
    'DJ turntable visual with two rotating platters, crossfader, EQ knobs, and channel meters. Electronic music vibes with neon accents.',
  tags: ['kinetic', 'music', 'dj', 'turntable', 'deck', 'electronic', 'edm', 'neon'],
  category: 'captions',
  component: DJDeckComponent as any,
  defaultConfig: {
    words: ['DROP', 'THE', 'MIX'],
    colors: ['#00CCFF', '#FF00FF', '#00FF88'],
    bgColor: '#06060C',
    cycleDuration: 1.3,
    deckColor: '#1a1a1a',
    neonColor: '#00CCFF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DROP', 'THE', 'MIX'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00CCFF', '#FF00FF', '#00FF88'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06060C', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
