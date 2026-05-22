import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HoloProjectConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Holographic projection base with upward light cone
    const coneOpacity = 0.06 + Math.sin(frame * 0.05) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Projection cone from bottom center */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: `${width * 0.35}px solid transparent`,
            borderRight: `${width * 0.35}px solid transparent`,
            borderBottom: `${height * 0.95}px solid rgba(0, 200, 255, ${coneOpacity})`,
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 180, 255, 0.015) 2px, rgba(0, 180, 255, 0.015) 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Projector base */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 60,
            height: 8,
            background: 'linear-gradient(to top, rgba(0, 180, 255, 0.3), rgba(0, 180, 255, 0.05))',
            borderRadius: '4px 4px 0 0',
          }}
        />
        {/* Center emission point glow */}
        <div
          style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 220, 255, 0.25) 0%, transparent 70%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Hologram materializes from chromatic RGB split converging to one
      const spread = (1 - enterProgress) * 6
      const opacity = Math.min(1, enterProgress * 2)
      const verticalOffset = (1 - enterProgress) * 20

      return (
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${verticalOffset}px))`,
            overflow: 'hidden',
          }}
        >
          {/* Red channel offset */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color: `rgba(255, 50, 50, ${opacity * 0.4})`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              transform: `translate(${-spread}px, ${-spread * 0.5}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
          {/* Green channel offset */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color: `rgba(50, 255, 100, ${opacity * 0.4})`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              transform: `translate(${spread * 0.5}px, ${spread * 0.3}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
          {/* Blue/main channel */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity,
              textShadow: `0 0 8px ${color}, 0 0 20px ${color}30`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Stable hologram with subtle chromatic fringe oscillation and flicker
      const fringe = Math.sin(f * 0.12) * 2
      const flicker = Math.sin(f * 0.4) > 0.9 ? 0.75 : 1
      const breathe = Math.sin(f * 0.06) * 0.5

      return (
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: flicker,
          }}
        >
          {/* Chromatic fringe -- red */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color: 'rgba(255, 50, 50, 0.2)',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              transform: `translate(${-fringe}px, ${-breathe}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
          {/* Chromatic fringe -- green */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color: 'rgba(50, 255, 100, 0.2)',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              transform: `translate(${fringe * 0.6}px, ${breathe}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textShadow: `0 0 10px ${color}, 0 0 25px ${color}25`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
          {/* Per-character scan line highlight */}
          {chars.map((ch, ci) => {
            const scanActive = Math.sin(f * 0.08 + ci * 1.2) > 0.7
            if (!scanActive) return null
            return (
              <span
                key={ci}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: 700,
                  color: 'transparent',
                  whiteSpace: 'nowrap',
                  letterSpacing: 4,
                  pointerEvents: 'none',
                }}
              />
            )
          })}
        </div>
      )
    } else {
      // Exit: hologram destabilizes -- chromatic split widens, flickers, fades
      const spread = exitProgress * 12
      const opacity = 1 - exitProgress
      const flicker = Math.sin(f * 0.5 + exitProgress * 10) > 0.3 ? opacity : opacity * 0.4
      const verticalDrift = exitProgress * -15

      return (
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${verticalDrift}px))`,
          }}
        >
          {/* Red diverge */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color: `rgba(255, 50, 50, ${flicker * 0.4})`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              transform: `translate(${-spread}px, ${-spread * 0.3}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
          {/* Green diverge */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color: `rgba(50, 255, 100, ${flicker * 0.4})`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              transform: `translate(${spread}px, ${spread * 0.3}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
          {/* Main fading */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity: flicker,
              textShadow: `0 0 ${6 + exitProgress * 10}px ${color}`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function HoloProjectComponent(props: MotionGraphicProps<HoloProjectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-holo-project',
  title: 'Kinetic Holo Project',
  description: 'Holographic projection with chromatic RGB split, screen blend mode, projection cone from below, and scan line flicker',
  tags: ['kinetic', 'typography', 'hologram', 'projection', 'chromatic', 'rgb', 'futuristic', 'sci-fi'],
  category: 'captions',
  component: HoloProjectComponent as any,
  defaultConfig: {
    words: ['HOLO', 'BEAM', 'PROJECT', 'LIVE'],
    colors: ['#00DDFF', '#00FFBB', '#00DDFF', '#AAFFEE'],
    bgColor: '#050a14',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HOLO', 'BEAM', 'PROJECT', 'LIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00DDFF', '#00FFBB', '#00DDFF', '#AAFFEE'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
