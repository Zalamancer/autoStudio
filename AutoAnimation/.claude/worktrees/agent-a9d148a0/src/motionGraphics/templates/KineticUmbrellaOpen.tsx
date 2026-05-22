import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UmbrellaOpenConfig extends KineticBaseConfig {
  panels: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__umbrellaConfig ?? { panels: 8 }
    const panels = config.panels ?? 8

    // Each panel fans out radially from the center point (top-center, like an umbrella)
    // Panel i rotates from collapsed (all pointing down) to open (spread angle)
    const cx = width / 2
    const cy = height * 0.12 // umbrella tip near top

    // Full open: panels spread across 180 degrees (semicircle opening downward)
    const totalAngle = 180
    const panelAngle = totalAngle / (panels - 1)

    const panelElements = []
    for (let i = 0; i < panels; i++) {
      const stagger = (i / panels) * 0.5
      let openProgress = 0

      if (phase === 'enter') {
        const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.3) / 0.7))
        openProgress = easeOutBack(delayed)
      } else if (phase === 'hold') {
        openProgress = 1
      } else {
        const reverseStagger = ((panels - 1 - i) / panels) * 0.4
        const delayed = Math.max(0, Math.min(1, (exitProgress - reverseStagger) / 0.6))
        openProgress = 1 - easeInCubic(delayed)
      }

      // Start angle: all panels collapsed pointing straight down (90 deg)
      const startAngle = 90
      const targetAngle = -90 + i * panelAngle
      const currentAngle = startAngle + (targetAngle - startAngle) * openProgress
      const rad = (currentAngle * Math.PI) / 180

      const panelLength = height * 0.72
      const panelWidth = (2 * Math.PI * panelLength * 0.55) / panels

      const endX = cx + Math.cos(rad) * panelLength
      const endY = cy + Math.sin(rad) * panelLength

      // Midpoint for curved appearance
      const midX = cx + Math.cos(rad) * (panelLength * 0.5)
      const midY = cy + Math.sin(rad) * (panelLength * 0.5)

      // Color cycle through panels for rainbow umbrella look, or use word color
      const hueShift = (i / panels) * 40
      const panelOpacity = 0.75 + 0.25 * openProgress

      panelElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: panelLength,
            height: panelWidth * 0.5,
            transformOrigin: '0 50%',
            transform: `rotate(${currentAngle}deg)`,
            background: `linear-gradient(90deg, ${color}cc, ${color}66)`,
            opacity: panelOpacity,
            borderRadius: `0 ${panelLength * 0.2}px ${panelLength * 0.2}px 0`,
            boxShadow: openProgress > 0.1 ? `0 2px 8px rgba(0,0,0,0.2)` : 'none',
          }}
        />,
      )
    }

    // Umbrella handle at bottom
    let handleProgress = 0
    if (phase === 'enter') handleProgress = easeOutBack(enterProgress)
    else if (phase === 'hold') handleProgress = 1
    else handleProgress = 1 - easeInCubic(exitProgress)

    const textOpacity = Math.min(1, handleProgress * 2)

    return (
      <>
        {/* Text in the center / lower area */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -20%)',
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(32px, 9vw, 120px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: `0 2px 16px ${color}55`,
              textAlign: 'center',
            }}
          >
            {word}
          </div>
        </div>

        {/* Umbrella panels */}
        {panelElements}

        {/* Center tip / rivet */}
        <div
          style={{
            position: 'absolute',
            left: cx - 7,
            top: height * 0.12 - 7,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: `linear-gradient(135deg, #e0e0e0, #888)`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            opacity: handleProgress,
          }}
        />

        {/* Umbrella handle stem */}
        <div
          style={{
            position: 'absolute',
            left: cx - 3,
            top: height * 0.12,
            width: 6,
            height: height * 0.85 * handleProgress,
            background: 'linear-gradient(180deg, #888, #555)',
            borderRadius: 3,
            opacity: handleProgress,
          }}
        />
      </>
    )
  },
}

function UmbrellaOpenComponent(props: MotionGraphicProps<UmbrellaOpenConfig>) {
  ;(globalThis as any).__umbrellaConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-umbrella-open',
  title: 'Kinetic Umbrella Open',
  description: 'Text fans out radially from a center point like an umbrella snapping open, panels spring into position',
  tags: ['kinetic', 'typography', 'umbrella', 'fan', 'radial', 'reveal', 'spring', 'mechanical', 'everyday'],
  category: 'captions',
  component: UmbrellaOpenComponent as any,
  defaultConfig: {
    words: ['OPEN', 'WIDE', 'COVER', 'SAFE'],
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
    bgColor: '#0f172a',
    cycleDuration: 1.6,
    panels: 8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OPEN', 'WIDE', 'COVER', 'SAFE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'], group: 'Style' },
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
    { key: 'panels', label: 'Umbrella Panels', type: 'number', defaultValue: 8, min: 4, max: 14, group: 'Animation' },
  ],
})
