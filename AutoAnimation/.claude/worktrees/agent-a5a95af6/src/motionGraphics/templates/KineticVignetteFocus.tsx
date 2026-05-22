import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VignetteFocusConfig extends KineticBaseConfig {}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({
    bgColor,
    frame,
    fps,
  }: BackgroundRenderProps) => {
    const time = frame / fps

    // Gentle vignette breathing
    const breathe = Math.sin(time * 1.5) * 3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Base vignette — always present */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse ${55 + breathe}% ${50 + breathe}% at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.85) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let vignetteIntensity = 0.85 // base level

    if (phase === 'enter') {
      // Vignette intensifies from light to heavy, then text fades in
      const eased = easeInOutCubic(enterProgress)
      vignetteIntensity = 0.3 + eased * 0.55
      opacity = Math.max(0, (enterProgress - 0.3) / 0.7) // text delayed
    } else if (phase === 'hold') {
      opacity = 1
      vignetteIntensity = 0.85
    } else {
      // Vignette closes to full black
      const eased = easeInOutCubic(exitProgress)
      vignetteIntensity = 0.85 + eased * 0.15 // approach 1.0
      opacity = 1 - eased
    }

    // Dynamic spotlight size based on vignette intensity
    const spotlightSize = 55 - vignetteIntensity * 30

    return (
      <>
        {/* Dynamic vignette overlay that responds to word phase */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse ${spotlightSize}% ${spotlightSize * 0.85}% at 50% 50%, transparent 0%, rgba(0,0,0,${vignetteIntensity * 0.5}) 50%, rgba(0,0,0,${vignetteIntensity}) 100%)`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        {/* Text in the bright center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color,
            textShadow: '0 0 20px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            zIndex: 2,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function VignetteFocusComponent(props: MotionGraphicProps<VignetteFocusConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vignette-focus',
  title: 'Kinetic Vignette Focus',
  description:
    'Dark vignette spotlight with text in the bright center — vignette intensifies on enter and closes to black on exit',
  tags: ['kinetic', 'typography', 'vignette', 'spotlight', 'focus', 'cinematic', 'dark'],
  category: 'captions',
  component: VignetteFocusComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'ON WHAT', 'MATTERS', 'MOST'],
    colors: ['#FFFFFF', '#E8E8E8', '#FFFFFF', '#E8E8E8'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FOCUS', 'ON WHAT', 'MATTERS', 'MOST'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#E8E8E8', '#FFFFFF', '#E8E8E8'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#0a0a0a',
      group: 'Style',
    },
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
