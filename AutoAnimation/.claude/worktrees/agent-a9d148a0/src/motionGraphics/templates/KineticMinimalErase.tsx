import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalEraseConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    // Erase-in-reverse mechanic: the text is already "written" on the canvas.
    // An eraser mark (white smudge band) travels right→left across the text.
    // As the eraser passes, it does NOT erase — it REVEALS the clean text beneath.
    // Before the eraser: text appears as a faint gray chalk ghost (pre-erased state).
    // After the eraser passes: text is crisp and dark (the "erased marks" disappear).
    //
    // The eraser travels right→left, so sweepX goes from 1→0 over enterProgress 0→1.

    const eraserX = 1 - easeOutCubic(enterProgress)  // 1.0→0.0 (right to left)
    const eraserPercent = eraserX * 100

    // Width of the eraser band as a percent of element
    const bandWidthPercent = 18

    // Text in the already-erased region (left of eraser) = crisp dark text
    // Text in the not-yet-erased region (right of eraser) = faint ghost text
    const ghostOpacity = 0.18
    const crispOpacity = 1.0

    let exitOpacity = 1

    if (phase === 'exit') {
      exitOpacity = 1 - easeInOutCubic(exitProgress)
    }

    // We render two layers with clip-path to split at eraserX:
    // Layer 1 (left/revealed): opacity=1, color=dark
    // Layer 2 (right/ghost): opacity=ghostOpacity, color=light gray

    const revealedClip = `inset(0 ${100 - eraserPercent}% 0 0)`  // left portion
    const ghostClip = `inset(0 0 0 ${eraserPercent}%)`             // right portion

    const textStyle: React.CSSProperties = {
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize: 'clamp(36px, 8vw, 120px)',
      fontWeight: 300,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color,
      whiteSpace: 'nowrap',
    }

    const eraserVisible = phase === 'enter' && eraserX > 0 && eraserX < 1

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
        {/* Ghost layer — right portion (not yet "erased") */}
        {phase === 'enter' && eraserX > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: ghostClip,
              opacity: ghostOpacity,
            }}
          >
            <div style={textStyle}>{word}</div>
          </div>
        )}

        {/* Revealed layer — left portion (erased → clean text) */}
        {(phase !== 'enter' || eraserPercent < 100) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: phase === 'enter' ? revealedClip : undefined,
              opacity: crispOpacity,
            }}
          >
            <div style={textStyle}>{word}</div>
          </div>
        )}

        {/* Full text during hold and exit */}
        {phase !== 'enter' && (
          <div style={textStyle}>{word}</div>
        )}

        {/* Eraser mark — a soft white smudge band at the transition point */}
        {eraserVisible && (
          <div
            style={{
              position: 'absolute',
              top: '-0.2em',
              left: `${eraserPercent - bandWidthPercent / 2}%`,
              width: `${bandWidthPercent}%`,
              height: '1.5em',
              background: `linear-gradient(
                90deg,
                transparent 0%,
                rgba(255,255,255,0.5) 20%,
                rgba(255,255,255,0.85) 50%,
                rgba(255,255,255,0.5) 80%,
                transparent 100%
              )`,
              pointerEvents: 'none',
              borderRadius: 4,
            }}
          />
        )}
      </div>
    )
  },
}

function MinimalEraseComponent(props: MotionGraphicProps<MinimalEraseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-erase',
  title: 'Kinetic Minimal Erase',
  description: 'An eraser mark sweeps right to left — in its wake the text is revealed crisp and clean from a faint ghost state',
  tags: ['kinetic', 'typography', 'minimal', 'erase', 'reveal', 'sweep', 'entrance', 'chalk', 'clean'],
  category: 'captions',
  component: MinimalEraseComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'CLEAN', 'ERASE', 'CLEAR'],
    colors: ['#1a1a1a', '#222222', '#111111', '#333333'],
    bgColor: '#ffffff',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'CLEAN', 'ERASE', 'CLEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
