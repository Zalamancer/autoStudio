import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LineByLineConfig extends KineticBaseConfig {
  scanLines: number
  lineThickness: number
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__lineByLineConfig ?? { scanLines: 12, lineThickness: 3 }
    const scanLines = config.scanLines ?? 12
    const lineThickness = config.lineThickness ?? 3

    // Reveal sweep: 0 = scan at top, 1 = scan has passed the bottom
    // Enter: scan sweeps top-to-bottom revealing text
    // Exit: scan sweeps top-to-bottom covering text
    const sweepP = phase === 'hold' ? 1 : phase === 'enter' ? easeInOutCubic(enterProgress) : easeInOutCubic(exitProgress)

    // Revealed Y boundary (pixels from top)
    const revealedY = phase === 'exit' ? height * (1 - sweepP) : height * sweepP

    // Clip path: reveal region is above revealedY (enter), or above revealedY (exit = remaining visible)
    const clipY = phase === 'exit' ? revealedY : revealedY
    const clipPath = phase === 'exit'
      ? `polygon(0 0, 100% 0, 100% ${clipY}px, 0 ${clipY}px)`
      : `polygon(0 0, 100% 0, 100% ${clipY}px, 0 ${clipY}px)`

    // Active scan line bar — the leading edge of the sweep
    const scanBarY = phase === 'exit' ? revealedY - lineThickness : revealedY
    const scanBarVisible = phase !== 'hold'

    // Background scan lines (subtle horizontal stripes)
    const bgLines: React.ReactNode[] = []
    for (let i = 0; i < scanLines; i++) {
      const lineY = (i / scanLines) * height
      bgLines.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: lineY,
            width: '100%',
            height: 1,
            background: 'rgba(255,255,255,0.04)',
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Subtle scan line grid overlay (always present) */}
        {bgLines}

        {/* Clipped text — only the revealed portion shows */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath,
            WebkitClipPath: clipPath,
          }}
        >
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
            }}
          >
            {word}
          </div>
        </div>

        {/* Active scan line bar at the leading edge */}
        {scanBarVisible && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: scanBarY,
              width: '100%',
              height: lineThickness,
              background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color} 80%, transparent 100%)`,
              opacity: 0.85,
              boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
            }}
          />
        )}
      </div>
    )
  },
}

function LineByLineComponent(props: MotionGraphicProps<LineByLineConfig>) {
  ;(globalThis as any).__lineByLineConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-line-by-line',
  title: 'Kinetic Line By Line',
  description: 'A glowing horizontal scan line sweeps top-to-bottom, revealing text below it during enter and erasing it during exit',
  tags: ['kinetic', 'typography', 'scan', 'lines', 'reveal', 'geometric', 'pattern', 'horizontal', 'sweep'],
  category: 'captions',
  component: LineByLineComponent as any,
  defaultConfig: {
    words: ['SCAN', 'LINES', 'SWEEP', 'REVEAL'],
    colors: ['#00FFFF', '#39FF14', '#FF00FF', '#FFD700'],
    bgColor: '#050510',
    cycleDuration: 1.3,
    scanLines: 12,
    lineThickness: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'LINES', 'SWEEP', 'REVEAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#39FF14', '#FF00FF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'scanLines', label: 'Background Scan Lines', type: 'number', defaultValue: 12, min: 4, max: 32, group: 'Animation' },
    { key: 'lineThickness', label: 'Scan Bar Thickness (px)', type: 'number', defaultValue: 3, min: 1, max: 10, group: 'Animation' },
  ],
})
