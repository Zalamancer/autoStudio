import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LaserTextConfig extends KineticBaseConfig {
  laserColor: string
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Club atmosphere with fog/haze
    const fogLayers = Array.from({ length: 5 }, (_, i) => {
      const y = 20 + i * (height / 5)
      const drift = Math.sin(time * 0.3 + i * 1.5) * 30
      const opacity = 0.01 + rand(i * 31) * 0.015
      return {
        y,
        drift,
        opacity,
        height: 30 + rand(i * 47) * 40,
      }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark club interior gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(10, 15, 8, 0.3) 0%, rgba(5, 5, 5, 0.1) 100%)',
          }}
        />
        {/* Fog/haze layers */}
        {fogLayers.map((fog, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: -50 + fog.drift,
              right: -50 - fog.drift,
              top: fog.y,
              height: fog.height,
              background: `linear-gradient(90deg, transparent 0%, rgba(100, 180, 100, ${fog.opacity}) 30%, rgba(120, 200, 120, ${fog.opacity * 1.2}) 50%, rgba(100, 180, 100, ${fog.opacity}) 70%, transparent 100%)`,
              filter: 'blur(15px)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Laser origin point — projector */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '5%',
            width: 6,
            height: 6,
            background: 'rgba(0, 255, 0, 0.08)',
            borderRadius: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.04)',
          }}
        />
        {/* Scattered laser fan lines in background */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {Array.from({ length: 6 }, (_, i) => {
            const angle = -0.4 + (i / 5) * 0.8
            const originX = width / 2
            const originY = height * 0.95
            const endX = originX + Math.sin(angle + Math.sin(time * 1.5 + i) * 0.15) * width * 0.6
            const endY = Math.max(0, originY - Math.cos(angle) * height * 0.9)
            return (
              <line
                key={i}
                x1={originX}
                y1={originY}
                x2={endX}
                y2={endY}
                stroke={`rgba(0, 255, 60, ${0.015 + rand(i * 37) * 0.01})`}
                strokeWidth={0.5}
              />
            )
          })}
        </svg>
        {/* Club ceiling structure hints */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            top: 0,
            height: 8,
            background: 'rgba(30, 35, 25, 0.15)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0
    const fps = 30
    const time = f / fps

    // Laser colors — green primary, red secondary
    const laserColors = ['#00FF40', '#FF2200', '#00FF40', '#00AAFF']
    const laserColor = laserColors[index % laserColors.length]
    const isGreen = laserColor.startsWith('#00')

    // Font size calculation
    const fontSize = Math.min(width / (totalChars * 0.6), 140)

    if (phase === 'enter') {
      // Laser beam traces text point-by-point, character by character
      const traceProgress = easeOutQuad(enterProgress)

      // Which character is currently being traced
      const charBeingTraced = Math.floor(traceProgress * totalChars)
      const charTraceProgress = (traceProgress * totalChars) - charBeingTraced

      // Laser beam scanning point position
      const scanX = width * 0.15 + traceProgress * width * 0.7
      const scanY = height * 0.5

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Already traced characters */}
          {chars.map((ch, ci) => {
            if (ci > charBeingTraced) return null
            const charOpacity = ci < charBeingTraced ? 0.85 : charTraceProgress * 0.85

            return (
              <div
                key={ci}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Courier New', 'Consolas', monospace",
                    fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color: laserColor,
                    opacity: charOpacity,
                    textShadow: `0 0 4px ${laserColor}, 0 0 10px ${laserColor}, 0 0 20px ${laserColor}60`,
                    letterSpacing: 6,
                    textTransform: 'uppercase',
                    // Clip to show only this character
                    clipPath: `inset(0 ${(totalChars - ci - 1) * (100 / totalChars)}% 0 ${ci * (100 / totalChars)}%)`,
                  }}
                >
                  {word}
                </span>
              </div>
            )
          })}
          {/* Scanning laser beam from projector to trace point */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Beam line */}
            <line
              x1={width / 2}
              y1={height * 0.95}
              x2={scanX}
              y2={scanY}
              stroke={`${laserColor}20`}
              strokeWidth={1.5}
            />
            {/* Bright core beam */}
            <line
              x1={width / 2}
              y1={height * 0.95}
              x2={scanX}
              y2={scanY}
              stroke={`${laserColor}40`}
              strokeWidth={0.5}
            />
            {/* Scanning point — bright dot where laser hits */}
            <circle cx={scanX} cy={scanY} r={5}
              fill={`${laserColor}60`} />
            <circle cx={scanX} cy={scanY} r={2.5}
              fill={`${laserColor}AA`} />
            <circle cx={scanX} cy={scanY} r={1}
              fill="#FFFFFF" />
            {/* Fog diffusion around scan point */}
            <circle cx={scanX} cy={scanY} r={15}
              fill={`${laserColor}08`} />
          </svg>
        </div>
      )
    } else if (phase === 'hold') {
      // Full word displayed — laser beam subtle oscillation through fog
      const scanOsc = Math.sin(holdProgress * Math.PI * 4) * width * 0.25
      const centerX = width / 2 + scanOsc
      const pulse = 0.85 + Math.sin(holdProgress * Math.PI * 6) * 0.15

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Fog glow behind text */}
          <div
            style={{
              position: 'absolute',
              left: '15%',
              right: '15%',
              top: '35%',
              bottom: '35%',
              background: `radial-gradient(ellipse at center, ${laserColor}06 0%, transparent 70%)`,
              filter: 'blur(15px)',
              pointerEvents: 'none',
            }}
          />
          {/* Laser text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', 'Consolas', monospace",
              fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
              fontWeight: 700,
              color: laserColor,
              opacity: pulse,
              textShadow: `0 0 4px ${laserColor},
                           0 0 12px ${laserColor},
                           0 0 25px ${laserColor}80,
                           0 0 40px ${laserColor}30`,
              letterSpacing: 6,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
          {/* Oscillating laser sweep line */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <line
              x1={width / 2}
              y1={height * 0.95}
              x2={centerX}
              y2={height * 0.3}
              stroke={`${laserColor}10`}
              strokeWidth={0.8}
            />
          </svg>
        </div>
      )
    } else {
      // Exit: laser retraces backwards and text fades
      const retraceProgress = easeOutQuad(exitProgress)
      const remainingChars = Math.floor((1 - retraceProgress) * totalChars)
      const clipRight = retraceProgress * 100

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Fading text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', 'Consolas', monospace",
              fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
              fontWeight: 700,
              color: laserColor,
              opacity: 1 - retraceProgress * 0.5,
              textShadow: `0 0 4px ${laserColor}, 0 0 10px ${laserColor}80`,
              letterSpacing: 6,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              clipPath: `inset(0 ${clipRight}% 0 0)`,
            }}
          >
            {word}
          </div>
          {/* Retrace laser point */}
          {retraceProgress < 0.9 && (
            <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {(() => {
                const retX = width * 0.85 - retraceProgress * width * 0.7
                const retY = height * 0.5
                return (
                  <>
                    <line
                      x1={width / 2}
                      y1={height * 0.95}
                      x2={retX}
                      y2={retY}
                      stroke={`${laserColor}15`}
                      strokeWidth={1}
                    />
                    <circle cx={retX} cy={retY} r={3}
                      fill={`${laserColor}50`} />
                    <circle cx={retX} cy={retY} r={1}
                      fill="#FFFFFF" />
                  </>
                )
              })()}
            </svg>
          )}
        </div>
      )
    }
  },
}

function LaserTextComponent(props: MotionGraphicProps<LaserTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-laser-text',
  title: 'Kinetic Laser Text',
  description: 'Scanning laser beam draws text point-by-point in green/red laser light with fog diffusion, club atmosphere, and vector trace animation',
  tags: ['kinetic', 'typography', 'laser', 'show', 'beam', 'scan', 'club', 'fog', 'vector', 'green'],
  category: 'captions',
  component: LaserTextComponent as any,
  defaultConfig: {
    words: ['LASER', 'BEAM', 'SCAN', 'SHOW'],
    colors: ['#00FF40', '#FF2200', '#00FF40', '#00AAFF'],
    bgColor: '#050805',
    cycleDuration: 1.4,
    laserColor: '#00FF40',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LASER', 'BEAM', 'SCAN', 'SHOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF40', '#FF2200', '#00FF40', '#00AAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050805', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'laserColor', label: 'Laser Color', type: 'color', defaultValue: '#00FF40', group: 'Animation' },
  ],
})
