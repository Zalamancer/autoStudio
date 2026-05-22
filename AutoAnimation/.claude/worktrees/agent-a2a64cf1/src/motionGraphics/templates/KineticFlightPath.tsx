import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlightPathConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Great circle arc path across the "map"
    const arcStartX = width * 0.08
    const arcStartY = height * 0.65
    const arcEndX = width * 0.92
    const arcEndY = height * 0.55
    const arcPeakY = height * 0.2

    // Airplane position along path
    const flightProgress = (time * 0.08) % 1
    const planeT = flightProgress
    const planeX = arcStartX + (arcEndX - arcStartX) * planeT
    const planeY = arcStartY + (arcEndY - arcStartY) * planeT - Math.sin(planeT * Math.PI) * (arcStartY - arcPeakY)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Map-like background with subtle land masses */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #0c1a2e 0%, #0e1f35 50%, #0c1a2e 100%)',
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Abstract land masses */}
          <path d={`M0,${height * 0.6} Q${width * 0.1},${height * 0.5} ${width * 0.15},${height * 0.55} Q${width * 0.2},${height * 0.62} ${width * 0.12},${height * 0.7} L0,${height * 0.75} Z`}
            fill="rgba(60, 80, 50, 0.12)" stroke="rgba(80, 100, 70, 0.08)" strokeWidth={0.5} />
          <path d={`M${width * 0.75},${height * 0.45} Q${width * 0.82},${height * 0.38} ${width * 0.9},${height * 0.42} Q${width * 0.95},${height * 0.5} ${width * 0.88},${height * 0.58} Q${width * 0.8},${height * 0.55} ${width * 0.75},${height * 0.45}`}
            fill="rgba(60, 80, 50, 0.12)" stroke="rgba(80, 100, 70, 0.08)" strokeWidth={0.5} />

          {/* Lat/long grid */}
          {Array.from({ length: 8 }, (_, i) => {
            const x = (width / 9) * (i + 1)
            return (
              <line key={`gv${i}`} x1={x} y1={0} x2={x} y2={height}
                stroke="rgba(100, 150, 200, 0.04)" strokeWidth={0.3} />
            )
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const y = (height / 6) * (i + 1)
            return (
              <line key={`gh${i}`} x1={0} y1={y} x2={width} y2={y}
                stroke="rgba(100, 150, 200, 0.04)" strokeWidth={0.3} />
            )
          })}

          {/* Great circle arc flight path */}
          <path d={`M${arcStartX},${arcStartY} Q${width / 2},${arcPeakY} ${arcEndX},${arcEndY}`}
            fill="none" stroke="rgba(255, 150, 50, 0.15)" strokeWidth={1.5}
            strokeDasharray="6,4" />

          {/* Contrail fade behind plane */}
          <path d={`M${arcStartX},${arcStartY} Q${width / 2},${arcPeakY} ${planeX},${planeY}`}
            fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth={3}
            strokeLinecap="round" />

          {/* Departure and arrival dots */}
          <circle cx={arcStartX} cy={arcStartY} r={4} fill="rgba(255, 150, 50, 0.3)" />
          <circle cx={arcEndX} cy={arcEndY} r={4} fill="rgba(255, 150, 50, 0.2)"
            strokeDasharray="2,2" stroke="rgba(255, 150, 50, 0.3)" strokeWidth={0.5} />

          {/* Airplane icon */}
          <g transform={`translate(${planeX}, ${planeY}) rotate(-15)`} opacity={0.35}>
            <path d="M0,-6 L3,4 L8,6 L3,5 L2,10 L0,8 L-2,10 L-3,5 L-8,6 L-3,4 Z"
              fill="rgba(255, 200, 100, 0.8)" />
          </g>

          {/* City labels */}
          <text x={arcStartX} y={arcStartY + 14} textAnchor="middle"
            fill="rgba(255, 150, 50, 0.15)" fontSize={7} fontFamily="'Helvetica Neue', sans-serif">
            DEP
          </text>
          <text x={arcEndX} y={arcEndY + 14} textAnchor="middle"
            fill="rgba(255, 150, 50, 0.12)" fontSize={7} fontFamily="'Helvetica Neue', sans-serif">
            ARR
          </text>

          {/* Altitude profile at bottom */}
          <path d={`M${width * 0.1},${height - 15} Q${width * 0.3},${height - 35} ${width * 0.5},${height - 40} Q${width * 0.7},${height - 35} ${width * 0.9},${height - 15}`}
            fill="none" stroke="rgba(100, 180, 255, 0.06)" strokeWidth={0.5} />
          <text x={width * 0.5} y={height - 42} textAnchor="middle"
            fill="rgba(100, 180, 255, 0.08)" fontSize={5} fontFamily="'Courier New', monospace">
            FL350
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 110)

    if (phase === 'enter') {
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 4)

      // Text follows arc path — sweeps in from left along great circle
      const arcX = -width * 0.3 + ease * width * 0.3
      const arcY = (1 - ease) * -20
      const arcRotation = (1 - ease) * -5

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Contrail behind text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `calc(50% + ${arcX - 20}px)`,
            width: ease * 60,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}15)`,
            transform: `translateY(-50%) rotate(${arcRotation}deg)`,
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${arcX}px), calc(-50% + ${arcY}px)) rotate(${arcRotation}deg)`,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 600,
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            opacity: ease,
          }}>
            {word}
          </div>
          {/* Flight info */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `${color}30`,
            letterSpacing: 2,
            opacity: ease,
          }}>
            FL350 &bull; GS 480kt &bull; HDG 275&deg;
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const float = Math.sin(holdProgress * Math.PI * 3) * 2

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${float}px))`,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 600,
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Airplane icon accent */}
          <div style={{
            position: 'absolute',
            top: `calc(50% - ${fontSize * 0.6}px)`,
            left: `calc(50% + ${word.length * fontSize * 0.3}px)`,
            fontFamily: 'sans-serif',
            fontSize: 14,
            color: `${color}40`,
            transform: `translateY(${float}px)`,
          }}>
            &#9992;
          </div>
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `${color}25`,
            letterSpacing: 2,
          }}>
            FL350 &bull; GS 480kt &bull; HDG 275&deg;
          </div>
        </div>
      )
    } else {
      const t = exitProgress
      const ease = t * t

      // Fly off to the right along arc
      const arcX = ease * width * 0.4
      const arcY = ease * -15
      const arcRotation = ease * 5

      return (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - ease }}>
          {/* Contrail */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `calc(50% + ${arcX - 40}px)`,
            width: 60,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}10)`,
            transform: `translateY(-50%) rotate(${arcRotation}deg)`,
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${arcX}px), calc(-50% + ${arcY}px)) rotate(${arcRotation}deg)`,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 600,
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function FlightPathComponent(props: MotionGraphicProps<FlightPathConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flight-path',
  title: 'Flight Path Arc',
  description: 'Text follows great circle arc across a map, airplane icon traces route with contrail fade, altitude profile, departure/arrival markers, and aviation-style HUD info',
  tags: ['kinetic', 'typography', 'flight', 'path', 'airplane', 'aviation', 'arc', 'travel'],
  category: 'captions',
  component: FlightPathComponent as any,
  defaultConfig: {
    words: ['DEPART', 'CRUISE', 'DESCEND', 'ARRIVE'],
    colors: ['#FF9632', '#FFB060', '#FF9632', '#FFD080'],
    bgColor: '#0c1a2e',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPART', 'CRUISE', 'DESCEND', 'ARRIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF9632', '#FFB060', '#FF9632', '#FFD080'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
