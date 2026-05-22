import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CADTraceConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // AutoCAD dark background with subtle grid
    const gridSize = 30
    const dotColor = 'rgba(80, 140, 200, 0.08)'
    const dots: { x: number; y: number }[] = []

    for (let gx = gridSize; gx < width; gx += gridSize) {
      for (let gy = gridSize; gy < height; gy += gridSize) {
        dots.push({ x: gx, y: gy })
      }
    }

    // Crosshair cursor position animates
    const cursorT = ((frame * 0.02) % 1)
    const cursorX = width * 0.15 + cursorT * width * 0.7
    const cursorY = height * 0.4 + Math.sin(cursorT * Math.PI * 2) * height * 0.1

    // Command line at bottom
    const commands = ['LINE', 'PLINE', 'OFFSET', 'TRIM', 'EXTEND', 'MIRROR']
    const cmdIndex = Math.floor(frame * 0.03) % commands.length
    const typingProgress = (frame * 0.06) % 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Grid dots */}
          {dots.map((d, i) => (
            <rect key={`d${i}`} x={d.x - 0.5} y={d.y - 0.5} width={1} height={1} fill={dotColor} />
          ))}
          {/* Crosshair cursor */}
          <line x1={cursorX} y1={0} x2={cursorX} y2={height} stroke="rgba(0, 255, 0, 0.15)" strokeWidth={0.5} strokeDasharray="4 4" />
          <line x1={0} y1={cursorY} x2={width} y2={cursorY} stroke="rgba(0, 255, 0, 0.15)" strokeWidth={0.5} strokeDasharray="4 4" />
          {/* Crosshair center square */}
          <rect x={cursorX - 5} y={cursorY - 5} width={10} height={10} fill="none" stroke="rgba(0, 255, 0, 0.4)" strokeWidth={0.8} />
          {/* Snap points */}
          {[0.2, 0.4, 0.6, 0.8].map((t, i) => {
            const sx = width * t
            const sy = height * 0.5
            const near = Math.abs(cursorX - sx) < 40
            return (
              <g key={`s${i}`}>
                <rect x={sx - 3} y={sy - 3} width={6} height={6}
                  fill="none" stroke={near ? 'rgba(255, 255, 0, 0.6)' : 'rgba(255, 255, 0, 0.15)'} strokeWidth={0.8}
                  transform={`rotate(45 ${sx} ${sy})`} />
              </g>
            )
          })}
          {/* UCS icon */}
          <line x1={15} y1={height - 15} x2={35} y2={height - 15} stroke="rgba(255, 0, 0, 0.3)" strokeWidth={1} />
          <line x1={15} y1={height - 15} x2={15} y2={height - 35} stroke="rgba(0, 255, 0, 0.3)" strokeWidth={1} />
          <text x={37} y={height - 12} fill="rgba(255, 0, 0, 0.3)" fontSize={8} fontFamily="'Courier New', monospace">X</text>
          <text x={10} y={height - 37} fill="rgba(0, 255, 0, 0.3)" fontSize={8} fontFamily="'Courier New', monospace">Y</text>
        </svg>
        {/* Command line */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 24,
          background: 'rgba(0, 0, 0, 0.6)',
          borderTop: '1px solid rgba(80, 140, 200, 0.2)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 8,
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          color: 'rgba(200, 220, 255, 0.6)',
        }}>
          Command: {commands[cmdIndex].slice(0, Math.floor(typingProgress * commands[cmdIndex].length))}
          <span style={{ opacity: Math.sin(frame * 0.15) > 0 ? 1 : 0 }}>_</span>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    // Text traced with polyline points, crosshair places each letter
    const letters = word.split('')
    const totalLetters = letters.length
    const fontSize = Math.min(width / (totalLetters * 0.7), 130)
    const startX = width * 0.5 - (totalLetters * fontSize * 0.35)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {letters.map((letter, i) => {
          const letterX = startX + i * fontSize * 0.7
          const letterY = height * 0.45

          let opacity = 0
          let showCursor = false
          let showPoint = false

          if (phase === 'enter') {
            // Letters appear sequentially as cursor "places" them
            const letterT = i / totalLetters
            const t = enterProgress
            if (t > letterT) {
              const letterProgress = Math.min(1, (t - letterT) * totalLetters * 1.5)
              opacity = letterProgress
              showPoint = true
              // Show cursor on the letter currently being placed
              if (t < letterT + 1 / totalLetters) {
                showCursor = true
              }
            }
          } else if (phase === 'hold') {
            opacity = 1
            showPoint = true
            // Subtle pulse on nodes
          } else {
            opacity = 1 - exitProgress
            showPoint = opacity > 0.3
          }

          return (
            <div key={i} style={{ position: 'absolute', left: letterX, top: letterY }}>
              {/* Snap point indicator */}
              {showPoint && (
                <div style={{
                  position: 'absolute',
                  left: fontSize * 0.35 - 4,
                  top: -8,
                  width: 8,
                  height: 8,
                  border: `1px solid ${color}`,
                  transform: 'rotate(45deg)',
                  opacity: opacity * 0.6,
                }} />
              )}
              {/* The letter */}
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                fontWeight: 400,
                color,
                opacity,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
              }}>
                {letter}
              </div>
              {/* Crosshair on current letter */}
              {showCursor && (
                <div style={{ position: 'absolute', left: fontSize * 0.35, top: fontSize * 0.3 }}>
                  <div style={{
                    position: 'absolute',
                    width: 30,
                    height: 0,
                    borderTop: '1px solid rgba(0, 255, 0, 0.6)',
                    left: -15,
                    top: 0,
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: 0,
                    height: 30,
                    borderLeft: '1px solid rgba(0, 255, 0, 0.6)',
                    left: 0,
                    top: -15,
                  }} />
                </div>
              )}
            </div>
          )
        })}
        {/* Polyline connecting letter base points */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {letters.map((_, i) => {
            if (i === 0) return null
            const prevX = startX + (i - 1) * fontSize * 0.7 + fontSize * 0.35
            const currX = startX + i * fontSize * 0.7 + fontSize * 0.35
            const baseY = height * 0.45 + fontSize + 4
            let lineOpacity = 0
            if (phase === 'enter') {
              const t = enterProgress
              const letterT = i / totalLetters
              lineOpacity = t > letterT ? Math.min(1, (t - letterT) * totalLetters * 2) * 0.4 : 0
            } else if (phase === 'hold') {
              lineOpacity = 0.35
            } else {
              lineOpacity = (1 - exitProgress) * 0.35
            }
            return (
              <line key={`pl${i}`}
                x1={prevX} y1={baseY} x2={currX} y2={baseY}
                stroke={color} strokeWidth={0.8} strokeDasharray="3 2"
                opacity={lineOpacity} />
            )
          })}
        </svg>
        {/* Coordinate readout */}
        {phase !== 'exit' && (
          <div style={{
            position: 'absolute',
            top: height * 0.45 - 28,
            left: startX,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: `${color}50`,
            letterSpacing: 1,
            opacity: phase === 'enter' ? enterProgress : 1,
          }}>
            @{Math.round(startX)},{Math.round(height * 0.45)}
          </div>
        )}
      </div>
    )
  },
}

function CADTraceComponent(props: MotionGraphicProps<CADTraceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cad-trace',
  title: 'CAD Trace',
  description: 'AutoCAD-style text with crosshair cursor placing polyline snap points, command line interface, UCS axes, and grid dot background',
  tags: ['kinetic', 'typography', 'cad', 'autocad', 'technical', 'drafting', 'crosshair', 'polyline'],
  category: 'captions',
  component: CADTraceComponent as any,
  defaultConfig: {
    words: ['DRAW', 'LINE', 'SNAP', 'PLOT'],
    colors: ['#00FF00', '#00CCFF', '#FFFF00', '#00FF00'],
    bgColor: '#1a1a24',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRAW', 'LINE', 'SNAP', 'PLOT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF00', '#00CCFF', '#FFFF00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a24', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
