import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalPhaseConfig extends KineticBaseConfig {
  phaseOffset: number
}

/** Expo ease-out — silky deceleration */
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

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    // Phase mechanic: text enters with opacity 0→1 AND a slight horizontal offset
    // (e.g. +24px right of center) that eases to 0. The opacity and position arrive
    // at the same time but with different easing curves — opacity is linear,
    // position decelerates with expo-out. This creates the "phasing in" sensation
    // where the text feels like it's materializing from slightly off-position.
    //
    // Exit: text phases out upward (slight negative Y offset) and fades.

    const phaseOffsetPx = 28  // horizontal offset in pixels during enter

    let opacity = 0
    let translateX = 0
    let translateY = 0

    if (phase === 'enter') {
      // Opacity: linear — arrives steadily
      opacity = enterProgress
      // Position: expo-out — decelerates quickly to 0
      const posEased = easeOutExpo(enterProgress)
      translateX = (1 - posEased) * phaseOffsetPx
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
      translateY = 0
    } else {
      // Exit: fade up — text drifts upward slightly while fading
      const e = easeInExpo(exitProgress)
      opacity = 1 - exitProgress  // linear fade out
      translateY = -e * 16  // drift up
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalPhaseComponent(props: MotionGraphicProps<MinimalPhaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-phase',
  title: 'Kinetic Minimal Phase',
  description: 'Text phases in with opacity rising linearly while position decelerates from a slight offset — materializes into place',
  tags: ['kinetic', 'typography', 'minimal', 'phase', 'fade', 'offset', 'entrance', 'materialise', 'clean'],
  category: 'captions',
  component: MinimalPhaseComponent as any,
  defaultConfig: {
    words: ['PHASE', 'DRIFT', 'SETTLE', 'ALIGN'],
    colors: ['#1a1a1a', '#222222', '#111111', '#333333'],
    bgColor: '#ffffff',
    cycleDuration: 1.1,
    phaseOffset: 28,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PHASE', 'DRIFT', 'SETTLE', 'ALIGN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
    { key: 'phaseOffset', label: 'Phase Offset (px)', type: 'number', defaultValue: 28, min: 4, max: 80, group: 'Animation' },
  ],
})
