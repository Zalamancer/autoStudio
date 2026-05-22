import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GarageDoorConfig extends KineticBaseConfig {
  panels: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__garageDoorConfig ?? { panels: 6 }
    const panels = Math.max(3, Math.min(12, config.panels ?? 6))
    const panelHeight = height / panels

    // Each panel rolls up from bottom to top with stagger
    // Panel 0 = top, panel N-1 = bottom. Bottom panels rise first (like a real garage door).
    const panelElements = []

    let rollProgress = 0
    if (phase === 'enter') {
      rollProgress = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      rollProgress = 1
    } else {
      rollProgress = 1 - easeInCubic(exitProgress)
    }

    for (let i = 0; i < panels; i++) {
      // Bottom panel index is panels-1, it starts moving first
      const reversedIndex = panels - 1 - i
      const staggerStart = reversedIndex / panels * 0.5
      const panelProgress = Math.max(0, Math.min(1, (rollProgress - staggerStart) / (1 - staggerStart * 0.8)))
      const eased = easeOutCubic(panelProgress)

      // Panel translates upward by full height when fully open
      const translateY = -eased * (i + 1) * panelHeight

      // Slight 3D tilt: as panel rolls up, it tilts backward
      const tiltAngle = (1 - eased) * 12 // degrees, maximum 12deg when closed

      // Panel shading: darker at top edge, lighter at bottom (simulates cylinder roll)
      const shade = 0.15 + 0.25 * (i / panels) // bottom panels slightly lighter
      const panelColor = `rgba(${Math.round(180 + shade * 60)}, ${Math.round(180 + shade * 60)}, ${Math.round(185 + shade * 55)}, ${0.88 - eased * 0.15})`

      panelElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: i * panelHeight,
            width,
            height: panelHeight,
            perspective: 800,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${panelColor} 0%, rgba(150,150,158,${0.82 - eased * 0.1}) 100%)`,
              transform: `translateY(${translateY}px) perspective(800px) rotateX(${tiltAngle}deg)`,
              transformOrigin: 'top center',
              boxShadow: eased < 0.95 ? `0 3px 8px rgba(0,0,0,0.25)` : 'none',
              borderBottom: '1px solid rgba(100,100,110,0.4)',
              borderTop: '1px solid rgba(230,230,240,0.25)',
            }}
          >
            {/* Horizontal ridges on each panel */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                width: '100%',
                height: 1,
                background: 'rgba(120,120,130,0.35)',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
        </div>,
      )
    }

    const textOpacity =
      phase === 'enter'
        ? Math.min(1, enterProgress * 3)
        : phase === 'hold'
          ? 1
          : 1 - exitProgress

    return (
      <>
        {/* Text sits behind rolling panels */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {/* Garage door panels on top */}
        {panelElements}
        {/* Door track lines on left and right */}
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 0,
            width: 3,
            height: '100%',
            background: 'rgba(160,160,170,0.2)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 8,
            top: 0,
            width: 3,
            height: '100%',
            background: 'rgba(160,160,170,0.2)',
            borderRadius: 2,
          }}
        />
      </>
    )
  },
}

function GarageDoorComponent(props: MotionGraphicProps<GarageDoorConfig>) {
  ;(globalThis as any).__garageDoorConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-garage-door',
  title: 'Kinetic Garage Door',
  description: 'Horizontal panels roll up like a garage door from bottom to top, each staggered, to reveal text behind',
  tags: ['kinetic', 'typography', 'garage', 'door', 'reveal', 'geometric', 'mechanical', 'panels', 'roll'],
  category: 'captions',
  component: GarageDoorComponent as any,
  defaultConfig: {
    words: ['ROLL', 'LIFT', 'OPEN', 'UP'],
    colors: ['#E2E8F0', '#CBD5E1', '#F1F5F9', '#94A3B8'],
    bgColor: '#0f172a',
    cycleDuration: 1.6,
    panels: 6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ROLL', 'LIFT', 'OPEN', 'UP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E2E8F0', '#CBD5E1', '#F1F5F9', '#94A3B8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'panels',
      label: 'Door Panels',
      type: 'number',
      defaultValue: 6,
      min: 3,
      max: 12,
      group: 'Animation',
    },
  ],
})
