import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ClosedCaptionConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Broadcast static noise hint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(frame * 0.1) * 5}% ${50 + Math.cos(frame * 0.13) * 3}%, rgba(255,255,255,0.01), transparent 60%)`,
          }}
        />

        {/* CC icon in top-left */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            left: '4%',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: 0.5,
          }}
        >
          <div
            style={{
              width: 'clamp(18px, 4vw, 30px)',
              height: 'clamp(14px, 3vw, 22px)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 'clamp(6px, 1.5vw, 11px)',
                fontWeight: 900,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              CC
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: 'clamp(6px, 1.2vw, 9px)',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 1,
            }}
          >
            ENGLISH
          </span>
        </div>

        {/* Caption display area background box at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            left: '8%',
            right: '8%',
            height: '18%',
            background: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        />

        {/* Simulated prior caption line (faded) */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '10%',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(8px, 1.8vw, 13px)',
            color: 'rgba(255, 255, 255, 0.12)',
          }}
        >
          [previously on screen]
        </div>

        {/* Audio waveform indicator */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            right: '4%',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            height: 'clamp(12px, 3vw, 20px)',
            opacity: 0.3,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 'clamp(2px, 0.5vw, 3px)',
                height: `${40 + Math.sin(time * 8 + i * 1.2) * 35}%`,
                background: '#FFFFFF',
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    let opacity = 1
    const chars = word.split('')

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
    }

    return (
      <>
        {/* Main centered word with character-by-character highlight */}
        <div
          style={{
            position: 'absolute',
            top: '46%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
            }}
          >
            {chars.map((ch, ci) => {
              let charColor = color
              let charBg = 'transparent'
              let charWeight = 700

              if (phase === 'enter') {
                // Characters appear one by one
                const charThreshold = ci / chars.length
                if (enterProgress < charThreshold) {
                  charColor = 'transparent'
                }
              } else if (phase === 'hold') {
                // Highlight sweeps across word
                const highlightPos = holdProgress * (chars.length + 2) - 1
                const dist = Math.abs(ci - highlightPos)
                if (dist < 1.5) {
                  charBg = `${color}30`
                  charWeight = 900
                }
              }

              return (
                <span
                  key={ci}
                  style={{
                    color: charColor,
                    background: charBg,
                    fontWeight: charWeight,
                    padding: '0 1px',
                    borderRadius: 2,
                  }}
                >
                  {ch}
                </span>
              )
            })}
          </div>
        </div>

        {/* Bottom caption box echo */}
        <div
          style={{
            position: 'absolute',
            bottom: '9%',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: opacity * 0.8,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(9px, 2vw, 15px)',
              fontWeight: 600,
              color: '#FFFFFF',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {phase === 'enter'
              ? word.substring(0, Math.floor(enterProgress * (word.length + 1)))
              : word
            }
          </div>
        </div>
      </>
    )
  },
}

function ClosedCaptionComponent(props: MotionGraphicProps<ClosedCaptionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-closed-caption',
  title: 'Closed Caption',
  description: 'Broadcast closed caption block with CC icon, word-by-word highlight sync, character reveal, audio waveform, and subtitle box display',
  tags: ['kinetic', 'typography', 'broadcast', 'caption', 'closed-caption', 'subtitle', 'accessibility', 'television'],
  category: 'captions',
  component: ClosedCaptionComponent as any,
  defaultConfig: {
    words: ['WELCOME', 'TONIGHT', 'SPECIAL', 'REPORT'],
    colors: ['#FFFFFF', '#FFD700', '#FFFFFF', '#00CCFF'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WELCOME', 'TONIGHT', 'SPECIAL', 'REPORT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD700', '#FFFFFF', '#00CCFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
