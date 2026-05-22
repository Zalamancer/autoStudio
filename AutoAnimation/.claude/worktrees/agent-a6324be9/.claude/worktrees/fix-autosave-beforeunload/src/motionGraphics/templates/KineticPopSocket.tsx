import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PopSocketConfig extends KineticBaseConfig {
  popHeight: number
}

// PopSocket spring: fast extend with overshoot, then settle
function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 2.8
  return Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.5) * c4) + 1
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__popSocketConfig ?? { popHeight: 60 }
    const popHeight = config.popHeight ?? 60

    // PopSocket extends from flat (scale 0 on Z) to popped out
    // Simulated with scaleY of the accordion cylinder + perspective
    let extendAmount = 0 // 0 = flat, 1 = fully extended

    if (phase === 'enter') {
      extendAmount = easeOutElastic(enterProgress)
    } else if (phase === 'hold') {
      extendAmount = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.04 // subtle breathing
    } else {
      extendAmount = 1 - easeInQuart(exitProgress)
    }

    extendAmount = Math.max(0, extendAmount)

    const cx = width / 2
    const cy = height / 2

    // Outer disc radius — the base that sticks to the phone
    const baseRadius = Math.min(width, height) * 0.28
    // Inner disc (the pop-out top surface) is slightly smaller
    const topRadius = baseRadius * 0.82
    // How far the top disc is elevated
    const elevation = popHeight * extendAmount

    // Accordion rings (the cylindrical side of the popsocket)
    const ringCount = 4
    const ringElements = []
    for (let i = 0; i < ringCount; i++) {
      const ringRatio = (i + 0.5) / ringCount
      const ringY = cy - elevation * ringRatio
      const ringWidth = topRadius * 2 * (0.88 + 0.12 * (1 - ringRatio))
      const ringHeight = (elevation / ringCount) * 0.7

      ringElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx - ringWidth / 2,
            top: ringY - ringHeight / 2,
            width: ringWidth,
            height: ringHeight,
            borderRadius: '50%',
            border: `3px solid ${color}55`,
            background: `linear-gradient(180deg, ${color}18, transparent)`,
            opacity: extendAmount * 0.8,
          }}
        />,
      )
    }

    const textOpacity = Math.min(1, extendAmount * 1.6)
    // Scale the top disc - starts at 0, pops to 1
    const discScale = Math.min(1.05, extendAmount)

    return (
      <>
        {/* Base ring on "phone" surface */}
        <div
          style={{
            position: 'absolute',
            left: cx - baseRadius,
            top: cy - baseRadius * 0.35,
            width: baseRadius * 2,
            height: baseRadius * 0.7,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${color}22 0%, ${color}08 60%, transparent 100%)`,
            border: `2px solid ${color}33`,
          }}
        />

        {/* Accordion cylinder rings */}
        {ringElements}

        {/* Top disc — the surface that pops out, contains text */}
        <div
          style={{
            position: 'absolute',
            left: cx - topRadius,
            top: cy - elevation - topRadius * 0.4,
            width: topRadius * 2,
            height: topRadius * 0.8,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at 40% 35%, ${color}ee, ${color}99)`,
            boxShadow: `0 ${elevation * 0.3}px ${elevation * 0.6}px rgba(0,0,0,0.35), 0 0 20px ${color}44`,
            transform: `scale(${discScale})`,
            transformOrigin: 'center center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Highlight on disc */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: '35%',
              height: '28%',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              filter: 'blur(4px)',
            }}
          />
        </div>

        {/* Text floats above the disc */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: cy - elevation - topRadius * 0.1,
            transform: 'translate(-50%, -50%)',
            opacity: textOpacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 7vw, 100px)',
              fontWeight: 900,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              textShadow: `0 1px 8px rgba(0,0,0,0.6)`,
            }}
          >
            {word}
          </div>
        </div>
      </>
    )
  },
}

function PopSocketComponent(props: MotionGraphicProps<PopSocketConfig>) {
  ;(globalThis as any).__popSocketConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pop-socket',
  title: 'Kinetic PopSocket',
  description: 'Text pops out from center like a phone PopSocket extending — elastic spring reveal with accordion cylinder',
  tags: ['kinetic', 'typography', 'popsocket', 'pop', 'spring', 'reveal', 'mechanical', 'everyday', '3d'],
  category: 'captions',
  component: PopSocketComponent as any,
  defaultConfig: {
    words: ['POP', 'SNAP', 'GRIP', 'HOLD'],
    colors: ['#FF6B6B', '#4ECDC4', '#C084FC', '#F59E0B'],
    bgColor: '#111120',
    cycleDuration: 1.6,
    popHeight: 60,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['POP', 'SNAP', 'GRIP', 'HOLD'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#4ECDC4', '#C084FC', '#F59E0B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111120', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'popHeight', label: 'Pop Height (px)', type: 'number', defaultValue: 60, min: 20, max: 120, group: 'Animation' },
  ],
})
