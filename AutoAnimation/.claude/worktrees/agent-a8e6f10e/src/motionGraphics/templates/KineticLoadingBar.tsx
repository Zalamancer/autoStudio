import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LoadingBarConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Boot screen aesthetic with scan lines
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CRT scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.01) 2px, rgba(0,255,65,0.01) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* Boot header */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(0, 255, 65, 0.2)',
            lineHeight: '16px',
          }}
        >
          <div>BIOS v3.14.159</div>
          <div>MEM OK ... 16384 MB</div>
          <div>CPU OK ... 12 CORES</div>
        </div>
        {/* Phosphor vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const barWidth = 260
    const barHeight = 16
    const f = frame ?? 0

    if (phase === 'enter') {
      // Loading bar fills during enter
      const fillPercent = enterProgress * 100
      const percentText = `${Math.floor(fillPercent)}%`
      const showCursor = Math.floor(f * 0.12) % 2 === 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* LOADING text */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 14,
              color: `${color}88`,
              letterSpacing: 4,
            }}
          >
            LOADING{showCursor ? '...' : '.. '}
          </div>
          {/* Progress bar */}
          <div
            style={{
              width: barWidth,
              height: barHeight,
              border: `1px solid ${color}44`,
              background: 'rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${fillPercent}%`,
                background: `linear-gradient(90deg, ${color}88, ${color})`,
                boxShadow: `0 0 8px ${color}40`,
              }}
            />
          </div>
          {/* Percent readout */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: `${color}66`,
              letterSpacing: 2,
            }}
          >
            [{percentText}]
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // COMPLETE with the word displayed
      const showCursor = Math.floor(f * 0.08) % 2 === 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Main word */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 25px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
            }}
          >
            {word}
          </div>
          {/* Completed bar */}
          <div
            style={{
              width: barWidth,
              height: barHeight,
              border: `1px solid ${color}44`,
              background: 'rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, ${color}88, ${color})`,
                boxShadow: `0 0 8px ${color}40`,
              }}
            />
          </div>
          {/* Status line */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: `${color}88`,
              letterSpacing: 2,
            }}
          >
            COMPLETE{showCursor ? '_' : ' '}
          </div>
        </div>
      )
    } else {
      // Shutting down effect
      const opacity = 1 - exitProgress
      const scale = 1 - exitProgress * 0.3
      const f2 = frame ?? 0
      const glitchX = exitProgress > 0.5 ? Math.sin(f2 * 0.5) * 3 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${glitchX}px), -50%) scaleY(${scale})`,
            opacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              color: `${color}44`,
              letterSpacing: 2,
            }}
          >
            SHUTTING DOWN...
          </div>
        </div>
      )
    }
  },
}

function LoadingBarComponent(props: MotionGraphicProps<LoadingBarConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-loading-bar',
  title: 'Kinetic Loading Bar',
  description: 'Boot screen loading bar that fills during enter, shows word on complete, and shuts down on exit with CRT scan lines',
  tags: ['kinetic', 'typography', 'loading', 'progress', 'boot', 'tech', 'retro'],
  category: 'captions',
  component: LoadingBarComponent as any,
  defaultConfig: {
    words: ['SYSTEM', 'ONLINE', 'READY', 'LAUNCH'],
    colors: ['#00FF41', '#00FF41', '#FFFF00', '#FF4444'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SYSTEM', 'ONLINE', 'READY', 'LAUNCH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF41'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
