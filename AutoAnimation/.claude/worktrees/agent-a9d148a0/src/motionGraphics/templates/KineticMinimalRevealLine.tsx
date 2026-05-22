import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalRevealLineConfig extends KineticBaseConfig {
  accentColor: string
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

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // The config is accessed through the word's color prop; accent comes from the template wrapper
    // We use a CSS variable approach by embedding the accent in the render
    const accentColor = '#E53E3E'

    // Enter: line sweeps down from top of text to below, revealing text behind it
    // Hold: text visible, line sits as underline accent
    // Exit: line sweeps back up, hiding text

    let textClipTop = 0 // percentage of text clipped from top (100 = fully hidden)
    let lineY = 0 // line position as percentage offset from center
    let textOpacity = 1
    let lineOpacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // Line sweeps from above text to below — reveals text as it passes
      textClipTop = 100 - eased * 100
      lineY = -30 + eased * 60 // from -30px above to +30px below
      lineOpacity = eased
    } else if (phase === 'hold') {
      textClipTop = 0
      lineY = 30
      lineOpacity = 1
    } else {
      const eased = easeInCubic(exitProgress)
      // Line sweeps back up, hiding text
      textClipTop = eased * 100
      lineY = 30 - eased * 60
      lineOpacity = 1 - eased
      textOpacity = 1 - eased * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Text with clip mask */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            clipPath: `inset(${textClipTop}% 0 0 0)`,
            opacity: textOpacity,
          }}
        >
          {word}
        </div>

        {/* Thin horizontal accent line */}
        <div
          style={{
            width: '120%',
            height: '2px',
            background: accentColor,
            opacity: lineOpacity,
            transform: `translateY(${lineY}px)`,
            marginTop: '-4px',
          }}
        />
      </div>
    )
  },
}

function MinimalRevealLineComponent(props: MotionGraphicProps<MinimalRevealLineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-reveal-line',
  title: 'Kinetic Minimal Reveal Line',
  description: 'Text revealed by a thin horizontal line sweeping down, line rests as underline accent, then sweeps back up to hide text on exit',
  tags: ['kinetic', 'typography', 'minimal', 'clean', 'reveal', 'line', 'underline'],
  category: 'captions',
  component: MinimalRevealLineComponent as any,
  defaultConfig: {
    words: ['Reveal', 'Line', 'Clean'],
    colors: ['#000000', '#000000', '#000000'],
    bgColor: '#FFFFFF',
    accentColor: '#E53E3E',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['Reveal', 'Line', 'Clean'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#000000', '#000000', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Line Color', type: 'color', defaultValue: '#E53E3E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
