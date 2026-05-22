import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HUDDisplayConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const bracketSize = Math.min(width, height) * 0.06
    const bracketThickness = 1
    const margin = 16
    const bracketColor = 'rgba(0, 255, 200, 0.4)'

    // Updating coordinates
    const lat = (37.7749 + Math.sin(frame * 0.01) * 0.001).toFixed(4)
    const lng = (-122.4194 + Math.cos(frame * 0.013) * 0.001).toFixed(4)
    const alt = Math.floor(1200 + Math.sin(frame * 0.02) * 50)
    const bearing = Math.floor((frame * 0.5) % 360)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scan lines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.015) 2px, rgba(0,255,200,0.015) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Corner brackets / targeting reticle */}
        {/* Top-left */}
        <div style={{ position: 'absolute', top: margin, left: margin, width: bracketSize, height: bracketThickness, background: bracketColor }} />
        <div style={{ position: 'absolute', top: margin, left: margin, width: bracketThickness, height: bracketSize, background: bracketColor }} />
        {/* Top-right */}
        <div style={{ position: 'absolute', top: margin, right: margin, width: bracketSize, height: bracketThickness, background: bracketColor }} />
        <div style={{ position: 'absolute', top: margin, right: margin, width: bracketThickness, height: bracketSize, background: bracketColor }} />
        {/* Bottom-left */}
        <div style={{ position: 'absolute', bottom: margin, left: margin, width: bracketSize, height: bracketThickness, background: bracketColor }} />
        <div style={{ position: 'absolute', bottom: margin, left: margin, width: bracketThickness, height: bracketSize, background: bracketColor }} />
        {/* Bottom-right */}
        <div style={{ position: 'absolute', bottom: margin, right: margin, width: bracketSize, height: bracketThickness, background: bracketColor }} />
        <div style={{ position: 'absolute', bottom: margin, right: margin, width: bracketThickness, height: bracketSize, background: bracketColor }} />

        {/* HUD data readouts */}
        <div
          style={{
            position: 'absolute',
            top: margin + bracketSize + 6,
            left: margin + 4,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(0, 255, 200, 0.35)',
            lineHeight: '14px',
          }}
        >
          <div>LAT {lat}</div>
          <div>LNG {lng}</div>
          <div>ALT {alt}m</div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: margin + bracketSize + 6,
            right: margin + 4,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(0, 255, 200, 0.35)',
            lineHeight: '14px',
            textAlign: 'right',
          }}
        >
          <div>BRG {bearing}°</div>
          <div>RNG 2.4km</div>
          <div>SIG ████</div>
        </div>

        {/* Center crosshair */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 40,
            height: 40,
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,255,200,0.1)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(0,255,200,0.1)' }} />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    if (phase === 'enter') {
      // Scan in left-to-right reveal
      const revealPercent = 100 - enterProgress * 100
      const opacity = Math.min(1, enterProgress * 2)

      // Draw in brackets around the word
      const bracketOpacity = Math.min(1, enterProgress * 3)

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
          {/* Bracket decorations */}
          <div
            style={{
              position: 'absolute',
              top: -8,
              left: -12,
              fontFamily: "'Courier New', monospace",
              fontSize: 14,
              color: `rgba(0, 255, 200, ${bracketOpacity * 0.5})`,
            }}
          >
            [
          </div>
          <div
            style={{
              position: 'absolute',
              top: -8,
              right: -12,
              fontFamily: "'Courier New', monospace",
              fontSize: 14,
              color: `rgba(0, 255, 200, ${bracketOpacity * 0.5})`,
            }}
          >
            ]
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}, 0 0 20px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              clipPath: `inset(0 ${revealPercent}% 0 0)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Coordinates updating beside the word
      const f = frame ?? 0
      const coordX = Math.floor(Math.sin(f * 0.05) * 100 + 500)
      const coordY = Math.floor(Math.cos(f * 0.07) * 100 + 300)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: 'rgba(0, 255, 200, 0.4)',
            }}
          >
            X:{coordX} Y:{coordY}
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}, 0 0 20px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 130px)',
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
      )
    }
  },
}

function HUDDisplayComponent(props: MotionGraphicProps<HUDDisplayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hud-display',
  title: 'Kinetic HUD Display',
  description: 'Military heads-up display with targeting brackets, coordinates readout, scan-line reveal, and tactical tech aesthetic',
  tags: ['kinetic', 'typography', 'hud', 'military', 'tactical', 'tech', 'futuristic'],
  category: 'captions',
  component: HUDDisplayComponent as any,
  defaultConfig: {
    words: ['TARGET', 'LOCKED', 'ENGAGE', 'FIRE'],
    colors: ['#00FFC8', '#00FFC8', '#FFAA00', '#FF4444'],
    bgColor: '#060e14',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TARGET', 'LOCKED', 'ENGAGE', 'FIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFC8', '#00FFC8', '#FFAA00', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060e14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
