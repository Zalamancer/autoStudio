import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalInvertConfig extends KineticBaseConfig {}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Invert mechanic: a filled rectangle sweeps across the canvas left→right.
    // Before the sweep: white bg, invisible text (or dark bg).
    // The sweep inverts — behind the sweep: dark bg, white text.
    // After full sweep: settled into dark-on-white (inverted from start).
    //
    // Implementation: a clipping rect grows from left. The text behind the clip
    // is rendered in inverted color. The bg behind the clip is also inverted.
    // The sweep position is enterProgress.

    const sweepX = easeInOutCubic(phase === 'enter' ? enterProgress : phase === 'hold' ? 1 : 1) * 100  // percent

    // During enter: sweep reveals inverted state
    // During hold: fully inverted (dark text on white becomes: white text on dark block, or we do dark on white revealed)
    // Exit: opacity fade

    // We keep it simple: bg is white (#ffffff). Text color is dark.
    // During enter: a dark filled block sweeps left→right. Text inside the block is white (inverted).
    // Outside the block: text is invisible (same as bg).

    const textColor = color  // dark color e.g. #1a1a1a
    const invertedTextColor = '#ffffff'
    const blockColor = textColor  // the sweeping inversion block

    let blockWidthPercent = 0
    let outsideTextOpacity = 0
    let exitOpacity = 1

    if (phase === 'enter') {
      blockWidthPercent = easeInOutCubic(enterProgress) * 100
      outsideTextOpacity = 0  // text not visible outside block during enter
    } else if (phase === 'hold') {
      blockWidthPercent = 100
      outsideTextOpacity = 1
    } else {
      blockWidthPercent = 100
      outsideTextOpacity = 1 - easeOutCubic(exitProgress)
      exitOpacity = outsideTextOpacity
    }

    const clipInsideStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: `${blockWidthPercent}%`,
      height: '100%',
      overflow: 'hidden',
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: exitOpacity,
        }}
      >
        {/* The inversion block — a dark rectangle sweeping left to right */}
        {blockWidthPercent < 100 && (
          <div
            style={{
              position: 'absolute',
              top: '-0.15em',
              left: `calc(-0.04em)`,
              width: `${blockWidthPercent}%`,
              height: '1.3em',
              background: blockColor,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Full block during hold/exit */}
        {blockWidthPercent >= 100 && (
          <div
            style={{
              position: 'absolute',
              top: '-0.15em',
              left: '-0.04em',
              right: '-0.04em',
              height: '1.3em',
              background: blockColor,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Text rendered in inverted color (white) — clipped to the block */}
        {blockWidthPercent > 0 && (
          <div style={clipInsideStyle}>
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(36px, 8vw, 120px)',
                fontWeight: 300,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: invertedTextColor,
                whiteSpace: 'nowrap',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {word}
            </div>
          </div>
        )}

        {/* Base text layer — visible outside block during hold/exit, but we use the inverted layer on top */}
        {blockWidthPercent >= 100 && (
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(36px, 8vw, 120px)',
              fontWeight: 300,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: invertedTextColor,
              whiteSpace: 'nowrap',
              opacity: outsideTextOpacity,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {word}
          </div>
        )}
      </div>
    )
  },
}

function MinimalInvertComponent(props: MotionGraphicProps<MinimalInvertConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-invert',
  title: 'Kinetic Minimal Invert',
  description: 'A dark block sweeps left to right inverting colors — white background becomes dark, text becomes white behind the sweep',
  tags: ['kinetic', 'typography', 'minimal', 'invert', 'wipe', 'sweep', 'entrance', 'contrast', 'clean'],
  category: 'captions',
  component: MinimalInvertComponent as any,
  defaultConfig: {
    words: ['INVERT', 'FLIP', 'SWAP', 'SHIFT'],
    colors: ['#1a1a1a', '#222222', '#111111', '#333333'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INVERT', 'FLIP', 'SWAP', 'SHIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
