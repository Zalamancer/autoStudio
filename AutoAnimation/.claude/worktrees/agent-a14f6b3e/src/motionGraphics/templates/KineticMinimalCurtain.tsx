import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCurtainConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Two-panel curtain opening from the center.
 * The left panel is clipped to [0%, split%] and the right panel to [split%, 100%].
 * On enter: split travels from 50% → 0% (left) and 50% → 100% (right),
 * effectively opening like stage curtains.
 *
 * Implementation: render a single centered text element and use
 * two overlaid clipped copies — but since clip-path only applies one mask,
 * we instead reveal the text by animating an `inset` clip that removes
 * the center region: we clip OUT the hidden area with two inset panels.
 *
 * Simpler approach: use two absolutely-positioned divs each showing half
 * of the text using `clip-path: inset(0 right% 0 0)` / `inset(0 0 0 left%)`.
 * Both halves move away from center as curtains open.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // openAmount: 0 = fully closed (both panels cover text), 1 = fully open
    let openAmount: number
    if (phase === 'enter') {
      openAmount = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      openAmount = 1
    } else {
      openAmount = 1 - easeInCubic(exitProgress)
    }

    // Left curtain: clips from the right side inward. At openAmount=0 it covers 50%→100% (right half visible = none revealed)
    // Actually: left half is revealed when left panel slides left.
    // Left panel reveals left half: clip right side = 50% - openAmount*50% = 50*(1-openAmount)%
    // Right panel reveals right half: clip left side = 50% + openAmount*50% = 50*(1+openAmount)% — but inset uses distance from edge
    // inset(top right bottom left)
    // Left half:  inset(0  (50*(1-openAmount))%  0  0)  — hides the right portion
    // Right half: inset(0  0  0  (50*(1-openAmount))%) — hides the left portion

    const hiddenHalf = 50 * (1 - openAmount)

    const sharedStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize: 'clamp(36px, 8vw, 120px)',
      fontWeight: 300,
      color,
      whiteSpace: 'nowrap',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
    }

    return (
      <>
        {/* Left curtain half */}
        <div style={{ ...sharedStyle, clipPath: `inset(0 ${(50 + hiddenHalf).toFixed(2)}% 0 0)` }}>
          {word}
        </div>
        {/* Right curtain half */}
        <div style={{ ...sharedStyle, clipPath: `inset(0 0 0 ${(50 + hiddenHalf).toFixed(2)}%)` }}>
          {word}
        </div>
      </>
    )
  },
}

function MinimalCurtainComponent(props: MotionGraphicProps<MinimalCurtainConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-curtain',
  title: 'Kinetic Minimal Curtain',
  description: 'Two panels opening from the center like stage curtains — dual inset clip-paths slide apart left and right to reveal text',
  tags: ['kinetic', 'typography', 'minimal', 'clip-path', 'reveal', 'curtain', 'wipe', 'panels'],
  category: 'captions',
  component: MinimalCurtainComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'SHAPE', 'CLEAN'],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#FFFFFF',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'SHAPE', 'CLEAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#1A1A1A', '#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
