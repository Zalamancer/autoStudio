import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShutterRollConfig extends KineticBaseConfig {
  strips: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__shutterRollConfig ?? { strips: 10 }
    const strips = config.strips ?? 10
    const stripHeight = height / strips

    const stripElements = []
    for (let i = 0; i < strips; i++) {
      const stagger = i / strips

      let revealProgress = 0
      if (phase === 'enter') {
        // Rolling shutter: each strip reveals with a top-to-bottom wave delay
        const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.6) / 0.4))
        revealProgress = easeOutExpo(delayed)
      } else if (phase === 'hold') {
        revealProgress = 1
      } else {
        // Exit: bottom-to-top rolling close
        const reverseStagger = (strips - 1 - i) / strips
        const delayed = Math.max(0, Math.min(1, (exitProgress - reverseStagger * 0.5) / 0.5))
        revealProgress = 1 - easeInExpo(delayed)
      }

      // The strip slides in from the right as it reveals
      const translateX = (1 - revealProgress) * width * 0.3
      const clipOpacity = revealProgress

      stripElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: i * stripHeight,
            width,
            height: stripHeight + 1,
            overflow: 'hidden',
          }}
        >
          {/* The revealed text strip */}
          <div
            style={{
              position: 'absolute',
              top: -i * stripHeight,
              left: 0,
              width,
              height,
              transform: `translateX(${translateX}px)`,
              opacity: clipOpacity,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
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
          {/* Strip separator line */}
          {revealProgress > 0 && revealProgress < 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 1,
                background: `rgba(255,255,255,${0.1 * (1 - revealProgress)})`,
              }}
            />
          )}
        </div>,
      )
    }

    // Rolling shutter scan line at the wave front
    let scanY = 0
    let scanOpacity = 0
    if (phase === 'enter') {
      scanY = enterProgress * height
      scanOpacity = enterProgress < 0.9 ? 0.6 : (1 - enterProgress) * 6
    } else if (phase === 'exit') {
      scanY = (1 - exitProgress) * height
      scanOpacity = exitProgress < 0.9 ? 0.4 : 0
    }

    return (
      <>
        {stripElements}
        {/* Scan line */}
        {scanOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: scanY - 1,
              height: 2,
              background: `rgba(255,255,255,${scanOpacity})`,
              boxShadow: `0 0 12px rgba(255,255,255,${scanOpacity * 0.5})`,
              pointerEvents: 'none',
            }}
          />
        )}
      </>
    )
  },
}

function ShutterRollComponent(props: MotionGraphicProps<ShutterRollConfig>) {
  ;(globalThis as any).__shutterRollConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shutter-roll',
  title: 'Kinetic Shutter Roll',
  description: 'Rolling shutter effect reveals text in horizontal strips from top to bottom with a wave scan line',
  tags: ['kinetic', 'typography', 'shutter', 'rolling', 'reveal', 'mechanical', 'geometric'],
  category: 'captions',
  component: ShutterRollComponent as any,
  defaultConfig: {
    words: ['SCAN', 'ROLL', 'SWEEP', 'WAVE'],
    colors: ['#00D4FF', '#00FF88', '#FF6BFF', '#FFD700'],
    bgColor: '#0a0a14',
    cycleDuration: 1.4,
    strips: 10,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'ROLL', 'SWEEP', 'WAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00D4FF', '#00FF88', '#FF6BFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'strips', label: 'Number of Strips', type: 'number', defaultValue: 10, min: 3, max: 25, group: 'Animation' },
  ],
})
