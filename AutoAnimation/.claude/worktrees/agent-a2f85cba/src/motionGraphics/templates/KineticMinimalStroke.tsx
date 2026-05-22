import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalStrokeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Phase 1 (enter): outline only, no fill — stroke draws in via opacity
    // Phase 2 (hold): fill color bleeds in as hold progresses
    // Phase 3 (exit): fade out
    let textColor = 'transparent'
    let strokeColor = color
    let strokeWidth = '1px'
    let opacity = 1

    if (phase === 'enter') {
      // Outline appears: transparent fill, stroke fades in
      textColor = 'transparent'
      strokeColor = color
      strokeWidth = '1px'
      opacity = enterProgress
    } else if (phase === 'hold') {
      // Fill bleeds in from transparent to full color
      // Use rgba interpolation: mix transparent → color
      // We simulate this by layering: keep stroke visible, fade fill in via opacity trick
      // We set text color with increasing opacity
      const fillOpacity = holdProgress * holdProgress // ease in
      textColor = color
      // Blend between outline-only (transparent fill) and filled text
      // We do this by fading between two stacked divs using a CSS approach:
      // Instead, use -webkit-text-stroke with color transitioning
      strokeColor = color
      strokeWidth = `${(1 - holdProgress * 0.5).toFixed(2)}px`
      opacity = 1
      // We'll handle the fill fade via a secondary wrapper opacity trick below
      void fillOpacity // used below
    } else {
      textColor = color
      opacity = 1 - exitProgress
    }

    const fillOpacity = phase === 'hold' ? holdProgress * holdProgress : phase === 'exit' ? 1 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Stroke layer — always visible once entered */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            color: 'transparent',
            WebkitTextStroke: `${strokeWidth} ${strokeColor}`,
            whiteSpace: 'nowrap',
            position: 'relative',
          }}
        >
          {word}
          {/* Fill layer overlaid via absolute positioning */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: textColor,
              WebkitTextStroke: '0px transparent',
              opacity: fillOpacity,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function MinimalStrokeComponent(props: MotionGraphicProps<MinimalStrokeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-stroke',
  title: 'Minimal Stroke',
  description: 'Text outline draws in on enter, then fill color bleeds in during hold. Pure stroke-to-fill typographic effect.',
  tags: ['kinetic', 'typography', 'minimal', 'stroke', 'outline', 'fill', 'draw'],
  category: 'captions',
  component: MinimalStrokeComponent as any,
  defaultConfig: {
    words: ['OUTLINE', 'STROKE', 'FILL', 'DRAW'],
    colors: ['#111111', '#333333', '#111111', '#222222'],
    bgColor: '#ffffff',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OUTLINE', 'STROKE', 'FILL', 'DRAW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#333333', '#111111', '#222222'],
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
