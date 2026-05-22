import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DarkRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, width }: WordRenderProps) => {
    // Spotlight position: sweeps across the text area
    let spotlightX = 0 // percentage
    let spotlightRadius = 120 // px
    let spotlightOpacity = 0

    if (phase === 'enter') {
      // Spotlight sweeps from left to center
      spotlightX = -20 + enterProgress * 70 // -20% to 50%
      spotlightRadius = 80 + enterProgress * 60
      spotlightOpacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      // Spotlight hovers near center with subtle drift
      spotlightX = 50 + Math.sin(holdProgress * Math.PI * 2) * 8
      spotlightRadius = 140 + Math.sin(holdProgress * Math.PI * 3) * 20
      spotlightOpacity = 1
    } else {
      // Spotlight sweeps off to the right
      spotlightX = 50 + exitProgress * 70
      spotlightRadius = 140 - exitProgress * 60
      spotlightOpacity = 1 - exitProgress
    }

    // The text is only visible inside the spotlight circle via clip-path
    // Use a radial gradient mask to create the spotlight reveal
    const maskImage = `radial-gradient(circle ${spotlightRadius}px at ${spotlightX}% 50%, black 0%, black 70%, transparent 100%)`

    return (
      <>
        {/* Spotlight glow on background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle ${spotlightRadius * 1.5}px at ${spotlightX}% 50%, rgba(255,255,220,0.06) 0%, transparent 100%)`,
            opacity: spotlightOpacity,
          }}
        />
        {/* Text revealed by spotlight */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: `0 0 10px rgba(255,255,200,0.3)`,
            whiteSpace: 'nowrap',
            WebkitMaskImage: maskImage,
            maskImage,
          }}
        >
          {word}
        </div>
        {/* Faint outline of text visible in darkness */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.04)',
            whiteSpace: 'nowrap',
            opacity: spotlightOpacity,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DarkRevealComponent(props: MotionGraphicProps<DarkRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dark-reveal',
  title: 'Kinetic Dark Reveal',
  description: 'Text revealed by a sweeping spotlight in pure darkness, suspenseful and cinematic horror reveal',
  tags: ['kinetic', 'typography', 'horror', 'spotlight', 'dark', 'reveal', 'suspense', 'cinematic'],
  category: 'captions',
  component: DarkRevealComponent as any,
  defaultConfig: {
    words: ['FIND', 'HIDDEN', 'TRUTH', 'SEEK'],
    colors: ['#E8E0C8', '#D4CCB0', '#F0E8D0', '#C8C0A8'],
    bgColor: '#020202',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FIND', 'HIDDEN', 'TRUTH', 'SEEK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0C8', '#D4CCB0', '#F0E8D0', '#C8C0A8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020202', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
