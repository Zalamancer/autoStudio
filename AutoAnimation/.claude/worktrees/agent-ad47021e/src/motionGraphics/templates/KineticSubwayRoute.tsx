import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SubwayRouteConfig extends KineticBaseConfig {}

const LINE_COLORS = ['#EE352E', '#00933C', '#0039A6', '#FF6319', '#996633', '#B933AD']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Beck-style transit map background with clean lines
    const lineCount = 5
    const stationSpacing = width / 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Horizontal transit lines */}
          {Array.from({ length: lineCount }, (_, i) => {
            const y = height * 0.2 + (i * height * 0.6) / (lineCount - 1)
            const lineColor = LINE_COLORS[i % LINE_COLORS.length]
            // Each line has segments with 90-degree bends
            const startX = -10
            const bendX1 = width * 0.15 + i * 20
            const midY = y + (i % 2 === 0 ? -15 : 15)
            const bendX2 = width * 0.85 - i * 20
            const endX = width + 10

            return (
              <g key={`line${i}`} opacity={0.12}>
                <path
                  d={`M${startX},${y} L${bendX1},${y} L${bendX1 + 20},${midY} L${bendX2 - 20},${midY} L${bendX2},${y} L${endX},${y}`}
                  fill="none" stroke={lineColor} strokeWidth={4} strokeLinecap="round" />
                {/* Station dots along the line */}
                {Array.from({ length: 6 }, (_, s) => {
                  const sx = stationSpacing * (s + 1)
                  const sy = sx > bendX1 && sx < bendX2 ? midY : y
                  return (
                    <g key={`st${i}-${s}`}>
                      <circle cx={sx} cy={sy} r={4} fill={bgColor} stroke={lineColor} strokeWidth={1.5} />
                    </g>
                  )
                })}
              </g>
            )
          })}
          {/* Interchange circles at intersections */}
          <circle cx={width * 0.35} cy={height * 0.5} r={8} fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
          <circle cx={width * 0.65} cy={height * 0.5} r={8} fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
          {/* Legend box */}
          <rect x={10} y={height - 40} width={60} height={25} rx={3}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
          <text x={15} y={height - 22} fill="rgba(255,255,255,0.08)" fontSize={6}
            fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif">
            TRANSIT MAP
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 110)
    const lineColor = LINE_COLORS[index % LINE_COLORS.length]

    if (phase === 'enter') {
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 3)

      // Line draws in from left, text follows along it
      const lineWidth = ease * (word.length * fontSize * 0.6 + 80)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Transit line under text */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.25}px)`,
            left: '50%',
            transform: `translateX(-50%)`,
            width: lineWidth,
            height: 6,
            background: lineColor,
            borderRadius: 3,
            opacity: 0.7,
            transformOrigin: 'left center',
          }} />
          {/* Station dots */}
          {word.split('').map((_, i) => {
            const letterProgress = Math.max(0, Math.min(1, (ease * word.length - i) * 2))
            const dotX = (i - word.length / 2 + 0.5) * fontSize * 0.58
            return (
              <div key={`sd${i}`} style={{
                position: 'absolute',
                top: `calc(50% + ${fontSize * 0.25}px - 5px)`,
                left: `calc(50% + ${dotX}px)`,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#ffffff',
                border: `2px solid ${lineColor}`,
                transform: `scale(${letterProgress})`,
                opacity: letterProgress,
              }} />
            )
          })}
          {/* Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${fontSize * 0.15}px))`,
            clipPath: `inset(0 ${100 - ease * 100}% 0 0)`,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Route indicator circle */}
          <div style={{
            position: 'absolute',
            top: `calc(50% - ${fontSize * 0.7}px)`,
            left: `calc(50% - ${word.length * fontSize * 0.29 + 30}px)`,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: lineColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: '#ffffff',
            opacity: ease,
            transform: `scale(${ease})`,
          }}>
            {String.fromCharCode(65 + index)}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const pulse = Math.sin(holdProgress * Math.PI * 4) * 0.3

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Transit line */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.25}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: word.length * fontSize * 0.6 + 80,
            height: 6,
            background: lineColor,
            borderRadius: 3,
            opacity: 0.7,
          }} />
          {/* Station dots */}
          {word.split('').map((_, i) => {
            const dotX = (i - word.length / 2 + 0.5) * fontSize * 0.58
            return (
              <div key={`hd${i}`} style={{
                position: 'absolute',
                top: `calc(50% + ${fontSize * 0.25}px - 5px)`,
                left: `calc(50% + ${dotX}px)`,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#ffffff',
                border: `2px solid ${lineColor}`,
              }} />
            )
          })}
          {/* Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${fontSize * 0.15}px))`,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Route indicator */}
          <div style={{
            position: 'absolute',
            top: `calc(50% - ${fontSize * 0.7}px)`,
            left: `calc(50% - ${word.length * fontSize * 0.29 + 30}px)`,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: lineColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: `0 0 ${8 + pulse * 4}px ${lineColor}60`,
          }}>
            {String.fromCharCode(65 + index)}
          </div>
        </div>
      )
    } else {
      const t = exitProgress
      const ease = t * t

      return (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - ease }}>
          {/* Line shrinks from both ends */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.25}px)`,
            left: '50%',
            transform: `translateX(-50%) scaleX(${1 - ease})`,
            width: word.length * fontSize * 0.6 + 80,
            height: 6,
            background: lineColor,
            borderRadius: 3,
            opacity: 0.7 * (1 - ease),
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${fontSize * 0.15}px + ${ease * -30}px))`,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 700,
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

function SubwayRouteComponent(props: MotionGraphicProps<SubwayRouteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-subway-route',
  title: 'Subway Route Map',
  description: 'Transit map with text following colored subway lines, station dots marking letter positions, clean Helvetica typography, Beck-style metro diagram',
  tags: ['kinetic', 'typography', 'subway', 'metro', 'transit', 'map', 'route', 'urban'],
  category: 'captions',
  component: SubwayRouteComponent as any,
  defaultConfig: {
    words: ['CENTRAL', 'EXPRESS', 'LOCAL', 'TRANSFER'],
    colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    bgColor: '#0a0f1e',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CENTRAL', 'EXPRESS', 'LOCAL', 'TRANSFER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
