import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCaseConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Enter: appear in lowercase (scaleY slightly compressed, lighter weight)
    // Hold: shift to uppercase via scaleY expanding to full height + weight increase
    //       achieved by cross-fading two absolutely stacked divs (lowercase vs uppercase)
    // Exit: fade out
    //
    // The "scale trick": lowercase text rendered at scaleY(0.75) morphs to scaleY(1.0)
    // simultaneously the uppercase version fades in over it for a smooth case shift.

    let opacity = 1
    let lowercaseOpacity = 1
    let uppercaseOpacity = 0
    let scaleY = 1

    const lower = word.toLowerCase()
    const upper = word.toUpperCase()

    if (phase === 'enter') {
      // Start lowercase, compressed
      opacity = enterProgress
      lowercaseOpacity = 1
      uppercaseOpacity = 0
      scaleY = 0.75 + enterProgress * 0.25 // 0.75 → 1.0
    } else if (phase === 'hold') {
      opacity = 1
      scaleY = 1
      // Cross-fade from lowercase to uppercase during hold
      const eased = holdProgress * holdProgress * (3 - 2 * holdProgress)
      lowercaseOpacity = 1 - eased
      uppercaseOpacity = eased
    } else {
      opacity = 1 - exitProgress
      lowercaseOpacity = 0
      uppercaseOpacity = 1
      scaleY = 1
    }

    const baseStyle: React.CSSProperties = {
      fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
      fontSize: 'clamp(36px, 8vw, 120px)',
      letterSpacing: '0.04em',
      color,
      whiteSpace: 'nowrap',
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleY(${scaleY.toFixed(3)})`,
          opacity,
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* Lowercase layer */}
          <div
            style={{
              ...baseStyle,
              fontWeight: 300,
              opacity: lowercaseOpacity,
            }}
          >
            {lower}
          </div>
          {/* Uppercase layer — absolutely positioned over lowercase */}
          <div
            style={{
              ...baseStyle,
              fontWeight: 500,
              opacity: uppercaseOpacity,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {upper}
          </div>
        </div>
      </div>
    )
  },
}

function MinimalCaseComponent(props: MotionGraphicProps<MinimalCaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-case',
  title: 'Minimal Case',
  description: 'Text appears in lowercase then shifts to uppercase using a smooth cross-fade and scaleY trick. Pure typographic case transformation.',
  tags: ['kinetic', 'typography', 'minimal', 'case', 'uppercase', 'lowercase', 'transform'],
  category: 'captions',
  component: MinimalCaseComponent as any,
  defaultConfig: {
    words: ['shift', 'case', 'upper', 'lower'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['shift', 'case', 'upper', 'lower'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#222222', '#333333', '#111111'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
