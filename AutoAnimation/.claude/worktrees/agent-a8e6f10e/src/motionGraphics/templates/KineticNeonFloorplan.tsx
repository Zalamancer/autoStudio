import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonFloorplanConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame
    const glowPulse = 0.6 + Math.sin(f * 0.05) * 0.4
    const wallColor = `rgba(0, 255, 180, ${0.12 * glowPulse})`
    const doorColor = `rgba(0, 200, 255, ${0.1 * glowPulse})`

    // Animated room outlines that resemble a floor plan
    const cx = width / 2
    const cy = height / 2
    const roomW = width * 0.5
    const roomH = height * 0.45

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Main room outline */}
          <rect
            x={cx - roomW / 2}
            y={cy - roomH / 2}
            width={roomW}
            height={roomH}
            fill="none"
            stroke={wallColor}
            strokeWidth={1.5}
          />
          {/* Interior wall dividing room */}
          <line
            x1={cx}
            y1={cy - roomH / 2}
            x2={cx}
            y2={cy + roomH / 2 - roomH * 0.3}
            stroke={wallColor}
            strokeWidth={1}
          />
          {/* Horizontal interior wall */}
          <line
            x1={cx - roomW / 2}
            y1={cy + roomH * 0.1}
            x2={cx - roomW * 0.15}
            y2={cy + roomH * 0.1}
            stroke={wallColor}
            strokeWidth={1}
          />
          {/* Door arcs */}
          <path
            d={`M ${cx + roomW * 0.1} ${cy + roomH / 2} A ${roomH * 0.15} ${roomH * 0.15} 0 0 0 ${cx + roomW * 0.1 + roomH * 0.15} ${cy + roomH / 2 - roomH * 0.15}`}
            fill="none"
            stroke={doorColor}
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
          <path
            d={`M ${cx - roomW * 0.05} ${cy - roomH / 2} A ${roomH * 0.12} ${roomH * 0.12} 0 0 1 ${cx - roomW * 0.05 - roomH * 0.12} ${cy - roomH / 2 + roomH * 0.12}`}
            fill="none"
            stroke={doorColor}
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
          {/* Window markers on exterior walls */}
          <line
            x1={cx + roomW / 2}
            y1={cy - roomH * 0.15}
            x2={cx + roomW / 2}
            y2={cy + roomH * 0.15}
            stroke="rgba(0, 255, 255, 0.15)"
            strokeWidth={3}
          />
          {/* Furniture hint - small rectangles */}
          <rect
            x={cx - roomW * 0.35}
            y={cy - roomH * 0.3}
            width={roomW * 0.15}
            height={roomH * 0.12}
            fill="none"
            stroke={`rgba(0,255,180,${0.06 * glowPulse})`}
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
          <rect
            x={cx + roomW * 0.15}
            y={cy + roomH * 0.2}
            width={roomW * 0.2}
            height={roomH * 0.15}
            fill="none"
            stroke={`rgba(0,255,180,${0.06 * glowPulse})`}
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
        </svg>
        {/* Ambient glow at center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '50%',
            height: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse, rgba(0,255,180,${0.04 * glowPulse}) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Neon flicker on: text appears with rapid flicker then stabilizes
      const flickerPhase = enterProgress < 0.4
      let opacity = enterProgress
      if (flickerPhase) {
        const flickerRate = Math.sin(f * 1.5) * Math.sin(f * 2.3)
        opacity = enterProgress * (flickerRate > 0 ? 1 : 0.15)
      }
      const glowIntensity = enterProgress * 15

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
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 300,
              color,
              textTransform: 'uppercase',
              letterSpacing: 12,
              whiteSpace: 'nowrap',
              textShadow: `0 0 ${glowIntensity}px ${color}, 0 0 ${glowIntensity * 2}px ${color}60, 0 0 ${glowIntensity * 3}px ${color}20`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Steady neon glow with gentle pulse
      const pulse = 0.8 + Math.sin(holdProgress * Math.PI * 4) * 0.2
      const glow = 12 * pulse

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
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 300,
              color,
              textTransform: 'uppercase',
              letterSpacing: 12,
              whiteSpace: 'nowrap',
              textShadow: `0 0 ${glow}px ${color}, 0 0 ${glow * 2}px ${color}50, 0 0 ${glow * 3}px ${color}15`,
            }}
          >
            {word}
          </div>
          {/* Floor plan line beneath text */}
          <div
            style={{
              position: 'absolute',
              bottom: -14,
              left: '10%',
              right: '10%',
              height: 1,
              background: `${color}30`,
              boxShadow: `0 0 6px ${color}30`,
            }}
          />
        </div>
      )
    } else {
      // Exit: neon dies with flicker
      const flickerOff = exitProgress > 0.5
      let opacity = 1 - exitProgress
      if (flickerOff) {
        const flicker = Math.sin(f * 2) * Math.sin(f * 3.7)
        opacity = (1 - exitProgress) * (flicker > 0 ? 1 : 0.1)
      }

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
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 300,
              color,
              textTransform: 'uppercase',
              letterSpacing: 12,
              whiteSpace: 'nowrap',
              textShadow: `0 0 ${6 * (1 - exitProgress)}px ${color}, 0 0 ${12 * (1 - exitProgress)}px ${color}40`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function NeonFloorplanComponent(props: MotionGraphicProps<NeonFloorplanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-floorplan',
  title: 'Kinetic Neon Floorplan',
  description: 'Neon-glowing text over animated floor plan lines with door arcs, window markers, and flickering neon entrance/exit effects',
  tags: ['kinetic', 'typography', 'neon', 'floorplan', 'architecture', 'glow', 'interior'],
  category: 'captions',
  component: NeonFloorplanComponent as any,
  defaultConfig: {
    words: ['SPACE', 'LIGHT', 'FORM', 'GLOW'],
    colors: ['#00FFB4', '#00E0FF', '#00FFB4', '#00E0FF'],
    bgColor: '#080C14',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPACE', 'LIGHT', 'FORM', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFB4', '#00E0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080C14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
