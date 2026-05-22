import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AROverlayConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Targeting reticle radius pulses
    const reticleRadius = 60 + Math.sin(frame * 0.08) * 8

    // Small floating data nodes
    const nodes = Array.from({ length: 6 }, (_, i) => {
      const seed = i * 113 + 7
      const bx = (seededRand(seed) * 0.7 + 0.15) * width
      const by = (seededRand(seed + 1) * 0.6 + 0.2) * height
      const pulse = 0.3 + Math.abs(Math.sin(frame * 0.05 + i * 1.3)) * 0.4
      return { x: bx, y: by, pulse }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scan line grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,255,255,0.012) 5px, rgba(0,255,255,0.012) 6px), repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(0,255,255,0.008) 5px, rgba(0,255,255,0.008) 6px)',
            pointerEvents: 'none',
          }}
        />

        {/* Center targeting circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: reticleRadius * 2,
            height: reticleRadius * 2,
            borderRadius: '50%',
            border: '1px solid rgba(0,255,255,0.15)',
            boxShadow: '0 0 12px rgba(0,255,255,0.07)',
            pointerEvents: 'none',
          }}
        />

        {/* Rotating arc segment top-right */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${frame * 0.6}deg)`,
            width: (reticleRadius + 18) * 2,
            height: (reticleRadius + 18) * 2,
            borderRadius: '50%',
            border: '1.5px solid transparent',
            borderTop: '1.5px solid rgba(0,255,255,0.35)',
            borderRight: '1.5px solid rgba(0,255,255,0.1)',
            pointerEvents: 'none',
          }}
        />

        {/* Counter-rotating arc bottom-left */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${-frame * 0.4}deg)`,
            width: (reticleRadius + 32) * 2,
            height: (reticleRadius + 32) * 2,
            borderRadius: '50%',
            border: '1px solid transparent',
            borderBottom: '1px solid rgba(255,0,255,0.25)',
            borderLeft: '1px solid rgba(255,0,255,0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating AR data nodes */}
        {nodes.map((n, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: n.x,
              top: n.y,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: i % 2 === 0 ? `rgba(0,255,255,${n.pulse})` : `rgba(255,0,255,${n.pulse})`,
              boxShadow: i % 2 === 0
                ? `0 0 6px rgba(0,255,255,${n.pulse * 0.8})`
                : `0 0 6px rgba(255,0,255,${n.pulse * 0.8})`,
            }}
          />
        ))}

        {/* Bottom status bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 20,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,255,0.3)',
            letterSpacing: 2,
          }}
        >
          AR.SYS v2.7 | FRAME {String(frame).padStart(4, '0')} | LOCK
        </div>

        {/* Top-right coordinate readout */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 20,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,255,0.3)',
            letterSpacing: 2,
            textAlign: 'right',
          }}
        >
          <div>X {(4812 + frame).toString().padStart(5, '0')}</div>
          <div>Y {(2047 + Math.floor(frame * 0.7)).toString().padStart(5, '0')}</div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    if (phase === 'enter') {
      // Targeting brackets converge inward onto the text
      const bracketInset = (1 - enterProgress) * 60
      const opacity = Math.min(1, enterProgress * 2.5)
      const bracketOpacity = Math.min(1, enterProgress * 3)
      const bSize = 14

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          {/* Convergence flash line */}
          {enterProgress > 0.7 && (
            <div
              style={{
                position: 'absolute',
                left: -bracketInset - 20,
                right: -bracketInset - 20,
                top: '50%',
                height: 1,
                background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
                transform: 'translateY(-50%)',
              }}
            />
          )}

          {/* Top-left AR bracket */}
          <div style={{ position: 'absolute', top: -10 - bracketInset * 0.3, left: -12 - bracketInset, opacity: bracketOpacity }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: bSize, height: 2, background: color }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: bSize, background: color }} />
          </div>
          {/* Top-right AR bracket */}
          <div style={{ position: 'absolute', top: -10 - bracketInset * 0.3, right: -12 - bracketInset, opacity: bracketOpacity }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: bSize, height: 2, background: color }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 2, height: bSize, background: color }} />
          </div>
          {/* Bottom-left AR bracket */}
          <div style={{ position: 'absolute', bottom: -10 - bracketInset * 0.3, left: -12 - bracketInset, opacity: bracketOpacity }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: bSize, height: 2, background: color }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 2, height: bSize, background: color }} />
          </div>
          {/* Bottom-right AR bracket */}
          <div style={{ position: 'absolute', bottom: -10 - bracketInset * 0.3, right: -12 - bracketInset, opacity: bracketOpacity }}>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: bSize, height: 2, background: color }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 2, height: bSize, background: color }} />
          </div>

          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 25px ${color}50`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Brackets locked, data readout flickering above
      const bSize = 14
      const dataVal = Math.floor(holdProgress * 99)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Data readout above */}
          <div
            style={{
              position: 'absolute',
              top: -28,
              left: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: `${color}99`,
              letterSpacing: 3,
              whiteSpace: 'nowrap',
            }}
          >
            LOCK:{String(dataVal).padStart(2, '0')}% | ID_0x{(0xA4F2 + dataVal).toString(16).toUpperCase()}
          </div>

          {/* Locked brackets */}
          {/* Top-left */}
          <div style={{ position: 'absolute', top: -10, left: -12 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: bSize, height: 2, background: color }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: bSize, background: color }} />
          </div>
          {/* Top-right */}
          <div style={{ position: 'absolute', top: -10, right: -12 }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: bSize, height: 2, background: color }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 2, height: bSize, background: color }} />
          </div>
          {/* Bottom-left */}
          <div style={{ position: 'absolute', bottom: -10, left: -12 }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: bSize, height: 2, background: color }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 2, height: bSize, background: color }} />
          </div>
          {/* Bottom-right */}
          <div style={{ position: 'absolute', bottom: -10, right: -12 }}>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: bSize, height: 2, background: color }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 2, height: bSize, background: color }} />
          </div>

          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 30px ${color}60`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>

          {/* Bottom scan bar */}
          <div
            style={{
              position: 'absolute',
              bottom: -16,
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
            }}
          />
        </div>
      )
    } else {
      // Exit: brackets expand outward as text fades
      const bracketInset = exitProgress * 50
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
          {/* Expanding brackets on exit */}
          <div
            style={{
              position: 'absolute',
              inset: -10 - bracketInset,
              border: `1px solid ${color}30`,
              borderRadius: 2,
            }}
          />
        </div>
      )
    }
  },
}

function AROverlayComponent(props: MotionGraphicProps<AROverlayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ar-overlay',
  title: 'Kinetic AR Overlay',
  description: 'Augmented reality targeting brackets converge to lock onto text with data readout, rotating arc segments, and AR coordinate chrome',
  tags: ['kinetic', 'typography', 'ar', 'augmented-reality', 'targeting', 'hud', 'futuristic', 'sci-fi'],
  category: 'captions',
  component: AROverlayComponent as any,
  defaultConfig: {
    words: ['ACQUIRE', 'LOCK', 'TARGET', 'FIRE'],
    colors: ['#00FFFF', '#00FFFF', '#FF00FF', '#00FFFF'],
    bgColor: '#0a0a12',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ACQUIRE', 'LOCK', 'TARGET', 'FIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#00FFFF', '#FF00FF', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
