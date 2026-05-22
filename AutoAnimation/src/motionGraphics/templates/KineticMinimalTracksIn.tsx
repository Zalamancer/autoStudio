import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalTracksInConfig extends KineticBaseConfig {}

/** Quintic ease-out for a crisp, decisive settle */
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    // letterSpacing expands from zero into wide tracking, then collapses out
    let letterSpacing = '0.12em'

    if (phase === 'enter') {
      const eased = easeOutQuint(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      // Start at 0 spacing, expand to target 0.12em
      const spacing = eased * 0.12
      letterSpacing = `${spacing.toFixed(4)}em`
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      // Collapse tracking inward as it exits
      const spacing = (1 - eased) * 0.12
      letterSpacing = `${spacing.toFixed(4)}em`
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 200,
          letterSpacing,
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

function MinimalTracksInComponent(props: MotionGraphicProps<MinimalTracksInConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-tracks-in',
  title: 'Minimal Tracks In',
  description: 'Letter-spacing expands from zero to wide tracking on enter, collapses to nothing on exit — pure typographic tracking motion',
  tags: ['kinetic', 'typography', 'minimal', 'tracking', 'letter-spacing', 'expand', 'clean'],
  category: 'captions',
  component: MinimalTracksInComponent as any,
  defaultConfig: {
    words: ['SPACE', 'TRACK', 'WIDE', 'OPEN'],
    colors: ['#1A1A1A', '#2A2A2A', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPACE', 'TRACK', 'WIDE', 'OPEN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#2A2A2A', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
