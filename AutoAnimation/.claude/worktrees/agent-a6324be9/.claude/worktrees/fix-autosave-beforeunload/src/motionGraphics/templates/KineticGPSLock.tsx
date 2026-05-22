import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GPSLockConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Satellite signal bars
    const barCount = 12
    const barWidth = width * 0.03
    const barSpacing = width * 0.04

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark tech background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #0a0f18 0%, #0d1520 50%, #0a0f18 100%)',
        }} />
        {/* Grid overlay */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Fine grid */}
          {Array.from({ length: 20 }, (_, i) => {
            const x = (width / 20) * i
            return (
              <line key={`gv${i}`} x1={x} y1={0} x2={x} y2={height}
                stroke="rgba(0, 200, 100, 0.03)" strokeWidth={0.3} />
            )
          })}
          {Array.from({ length: 12 }, (_, i) => {
            const y = (height / 12) * i
            return (
              <line key={`gh${i}`} x1={0} y1={y} x2={width} y2={y}
                stroke="rgba(0, 200, 100, 0.03)" strokeWidth={0.3} />
            )
          })}
          {/* Accuracy circles pulsing */}
          {Array.from({ length: 3 }, (_, i) => {
            const r = 30 + i * 25 + Math.sin(time * 2 + i) * 5
            return (
              <circle key={`ac${i}`}
                cx={width / 2} cy={height / 2}
                r={r}
                fill="none"
                stroke={`rgba(0, 200, 100, ${0.04 - i * 0.01})`}
                strokeWidth={0.5}
                strokeDasharray="4,4" />
            )
          })}
          {/* Satellite status bars at bottom */}
          {Array.from({ length: barCount }, (_, i) => {
            const x = width * 0.15 + i * barSpacing
            const signalStrength = seededRand(i * 7 + 3)
            const barH = signalStrength * height * 0.08 + 4
            const animatedH = barH * (0.8 + Math.sin(time * 3 + i * 0.7) * 0.2)
            const isActive = signalStrength > 0.3
            return (
              <rect key={`bar${i}`}
                x={x} y={height - 25 - animatedH}
                width={barWidth * 0.6} height={animatedH}
                rx={1}
                fill={isActive ? `rgba(0, 200, 100, ${0.15 + signalStrength * 0.1})` : 'rgba(200, 50, 50, 0.1)'} />
            )
          })}
          <text x={width * 0.15} y={height - 10}
            fill="rgba(0, 200, 100, 0.1)" fontSize={6}
            fontFamily="'Courier New', monospace">
            {barCount} SVs tracked
          </text>
          {/* HDOP indicator */}
          <text x={width - 15} y={20} textAnchor="end"
            fill="rgba(0, 200, 100, 0.1)" fontSize={7}
            fontFamily="'Courier New', monospace">
            HDOP: 0.8
          </text>
          {/* Crosshair at center */}
          <line x1={width / 2 - 12} y1={height / 2} x2={width / 2 + 12} y2={height / 2}
            stroke="rgba(0, 200, 100, 0.08)" strokeWidth={0.5} />
          <line x1={width / 2} y1={height / 2 - 12} x2={width / 2} y2={height / 2 + 12}
            stroke="rgba(0, 200, 100, 0.08)" strokeWidth={0.5} />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.65), 100)
    const f = frame ?? 0

    if (phase === 'enter') {
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 3)

      // Digits resolve one-by-one like GPS acquiring signal
      // Each character scrambles through random chars before landing
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Accuracy circle shrinking */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: (1 - ease) * 200 + 30,
            height: (1 - ease) * 200 + 30,
            borderRadius: '50%',
            border: `1px solid ${color}20`,
            transform: 'translate(-50%, -50%)',
          }} />
          {/* Coordinate-style text resolving */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}>
            {word.split('').map((char, i) => {
              const charLockTime = 0.15 + (i / word.length) * 0.7
              const isLocked = ease > charLockTime
              const scrambleChars = '0123456789ABCDEF.-°\''
              const displayChar = isLocked
                ? char
                : scrambleChars[Math.floor(seededRand(f * 17 + i * 31) * scrambleChars.length)]

              return (
                <span key={i} style={{
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color: isLocked ? color : `${color}60`,
                  display: 'inline-block',
                  minWidth: fontSize * 0.6,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  textShadow: isLocked ? `0 0 8px ${color}40` : 'none',
                }}>
                  {displayChar}
                </span>
              )
            })}
          </div>
          {/* Status text */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.6}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: ease < 0.9 ? 'rgba(200, 150, 0, 0.5)' : 'rgba(0, 200, 100, 0.5)',
            letterSpacing: 2,
          }}>
            {ease < 0.9 ? 'ACQUIRING...' : '3D FIX'}
          </div>
          {/* Signal strength indicator */}
          <div style={{
            position: 'absolute',
            top: `calc(50% - ${fontSize * 0.7}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
          }}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`sig${i}`} style={{
                width: 4,
                height: 4 + i * 3,
                background: ease > (i + 1) * 0.2
                  ? 'rgba(0, 200, 100, 0.5)'
                  : 'rgba(100, 100, 100, 0.2)',
                borderRadius: 1,
                alignSelf: 'flex-end',
              }} />
            ))}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const pulse = Math.sin(holdProgress * Math.PI * 4)
      const accuracyR = 18 + pulse * 3

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Tight accuracy circle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: accuracyR * 2,
            height: accuracyR * 2,
            borderRadius: '50%',
            border: `1px solid ${color}15`,
            transform: 'translate(-50%, -50%)',
          }} />
          {/* Locked text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            letterSpacing: 2,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            textShadow: `0 0 10px ${color}30`,
          }}>
            {word}
          </div>
          {/* Coordinate readout */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.6}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(0, 200, 100, 0.4)',
            letterSpacing: 2,
          }}>
            3D FIX &bull; &plusmn;2.4m &bull; 12 SVs
          </div>
          {/* Signal bars full */}
          <div style={{
            position: 'absolute',
            top: `calc(50% - ${fontSize * 0.7}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
          }}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`hsig${i}`} style={{
                width: 4,
                height: 4 + i * 3,
                background: 'rgba(0, 200, 100, 0.5)',
                borderRadius: 1,
                alignSelf: 'flex-end',
              }} />
            ))}
          </div>
        </div>
      )
    } else {
      const t = exitProgress
      const ease = t * t

      // Signal lost — characters scramble back to noise
      return (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - ease }}>
          {/* Accuracy circle expanding — losing fix */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 30 + ease * 180,
            height: 30 + ease * 180,
            borderRadius: '50%',
            border: `1px solid ${color}${Math.round((1 - ease) * 20).toString(16).padStart(2, '0')}`,
            transform: 'translate(-50%, -50%)',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
          }}>
            {word.split('').map((char, i) => {
              const scrambleChars = '0123456789.-°?'
              const charLostTime = (i / word.length) * 0.6
              const isScrambled = ease > charLostTime
              const displayChar = isScrambled
                ? scrambleChars[Math.floor(seededRand(f * 13 + i * 23 + Math.floor(ease * 10)) * scrambleChars.length)]
                : char
              return (
                <span key={i} style={{
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color: isScrambled ? 'rgba(200, 100, 50, 0.5)' : color,
                  display: 'inline-block',
                  minWidth: fontSize * 0.6,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>
                  {displayChar}
                </span>
              )
            })}
          </div>
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.6}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(200, 80, 50, 0.5)',
            letterSpacing: 2,
            opacity: 1 - ease,
          }}>
            SIGNAL LOST
          </div>
        </div>
      )
    }
  },
}

function GPSLockComponent(props: MotionGraphicProps<GPSLockConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gps-lock',
  title: 'GPS Coordinate Lock',
  description: 'Text resolves digit-by-digit like GPS acquiring signal, coordinate format display, accuracy circle shrinking to lock, satellite status bars, and tech grid overlay',
  tags: ['kinetic', 'typography', 'gps', 'coordinate', 'satellite', 'lock', 'signal', 'tech'],
  category: 'captions',
  component: GPSLockComponent as any,
  defaultConfig: {
    words: ['LOCATE', 'TRACK', 'SIGNAL', 'LOCK'],
    colors: ['#00C864', '#00E070', '#00C864', '#00FF80'],
    bgColor: '#0a0f18',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOCATE', 'TRACK', 'SIGNAL', 'LOCK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00C864', '#00E070', '#00C864', '#00FF80'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
