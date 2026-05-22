import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CyberSliceConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Diagonal laser lines sweeping across
    const lasers = Array.from({ length: 6 }, (_, i) => {
      const angle = -25 + i * 10
      const xPos = ((time * 40 + i * 60) % 200) - 50
      const isCyan = i % 2 === 0
      const color = isCyan ? 'rgba(0,255,255,' : 'rgba(255,0,255,'
      const opacity = 0.04 + Math.sin(time * 2 + i) * 0.02

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${xPos}%`,
            top: '-10%',
            bottom: '-10%',
            width: 1,
            background: `linear-gradient(180deg, transparent, ${color}${opacity}), ${color}${opacity + 0.02}), transparent)`,
            transform: `rotate(${angle}deg)`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {lasers}
        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.015) 2px, rgba(0,255,255,0.015) 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Central glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(255,0,255,0.03) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 137 + 43

    if (phase === 'enter') {
      // Laser slices text into view -- top and bottom halves slide in
      const sliceGap = (1 - enterProgress) * 30
      const opacity = Math.min(1, enterProgress * 2)
      const laserX = enterProgress < 0.6 ? (enterProgress / 0.6) * 120 - 10 : 110
      const laserOpacity = enterProgress < 0.6 ? 0.8 : Math.max(0, 1 - (enterProgress - 0.6) / 0.4) * 0.8

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {/* Top half */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              clipPath: 'inset(0 0 50% 0)',
              transform: `translateY(${-sliceGap / 2}px)`,
              textShadow: `0 0 8px ${color}`,
              opacity,
            }}
          >
            {word}
          </div>
          {/* Bottom half */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              clipPath: 'inset(50% 0 0 0)',
              transform: `translateY(${sliceGap / 2}px)`,
              textShadow: `0 0 8px ${color}`,
              opacity,
            }}
          >
            {word}
          </div>
          {/* Laser beam */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${laserX}%`,
              width: '15%',
              height: 2,
              transform: 'translateY(-50%)',
              background: `linear-gradient(90deg, transparent, #00FFFF, #FF00FF, transparent)`,
              boxShadow: '0 0 10px rgba(0,255,255,0.5), 0 0 20px rgba(255,0,255,0.3)',
              opacity: laserOpacity,
              pointerEvents: 'none',
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // Stable with glitch slice effect periodically
      const glitchActive = Math.sin(f * 0.12) > 0.85
      const sliceOffset = glitchActive ? ((seed * 7) % 6) - 3 : 0

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div
            style={{
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              clipPath: 'inset(0 0 50% 0)',
              transform: `translateX(${sliceOffset}px)`,
              textShadow: glitchActive
                ? `2px 0 #00FFFF, -2px 0 #FF00FF, 0 0 10px ${color}`
                : `0 0 10px ${color}, 0 0 25px ${color}30`,
            }}
          >
            {word}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              clipPath: 'inset(50% 0 0 0)',
              transform: `translateX(${-sliceOffset}px)`,
              textShadow: glitchActive
                ? `2px 0 #FF00FF, -2px 0 #00FFFF, 0 0 10px ${color}`
                : `0 0 10px ${color}, 0 0 25px ${color}30`,
            }}
          >
            {word}
          </div>
          {/* Center slice line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: -10,
              right: -10,
              height: 1,
              background: glitchActive
                ? 'linear-gradient(90deg, transparent, rgba(0,255,255,0.4), rgba(255,0,255,0.4), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)',
            }}
          />
        </div>
      )
    } else {
      // Exit: halves slide apart
      const sliceGap = exitProgress * 50
      const opacity = 1 - exitProgress

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity }}>
          <div
            style={{
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              clipPath: 'inset(0 0 50% 0)',
              transform: `translateY(${-sliceGap}px) translateX(${-exitProgress * 20}px)`,
              textShadow: `0 0 8px ${color}`,
            }}
          >
            {word}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              clipPath: 'inset(50% 0 0 0)',
              transform: `translateY(${sliceGap}px) translateX(${exitProgress * 20}px)`,
              textShadow: `0 0 8px ${color}`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function CyberSliceComponent(props: MotionGraphicProps<CyberSliceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cyber-slice',
  title: 'Kinetic Cyber Slice',
  description: 'Text sliced by cyber laser beams, top and bottom halves separate and rejoin with glitch effects',
  tags: ['kinetic', 'typography', 'cyber', 'laser', 'slice', 'glitch', 'cyberpunk', 'futuristic'],
  category: 'captions',
  component: CyberSliceComponent as any,
  defaultConfig: {
    words: ['SLICE', 'CUT', 'EDGE', 'SHARP'],
    colors: ['#FF00FF', '#00FFFF', '#FF00FF', '#00FFFF'],
    bgColor: '#08060f',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLICE', 'CUT', 'EDGE', 'SHARP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF00FF', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08060f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
