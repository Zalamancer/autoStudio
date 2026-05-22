import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpotlightSweepConfig extends KineticBaseConfig {
  spotlightSize: number
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__spotlightSweepConfig ?? { spotlightSize: 180 }
    const baseRadius = config.spotlightSize ?? 180

    // Spotlight sweeps from left to right during enter, drifts during hold, exits right
    let spotX = 0 // percentage across width
    let spotY = 50 // percentage down height
    let radius = baseRadius
    let intensity = 0

    if (phase === 'enter') {
      const eased = easeInOutSine(enterProgress)
      spotX = -15 + eased * 65 // sweep from offscreen-left to center
      spotY = 50 + Math.sin(enterProgress * Math.PI) * 5
      radius = baseRadius * (0.7 + enterProgress * 0.3)
      intensity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'hold') {
      // Spotlight gently oscillates around center
      spotX = 50 + Math.sin(holdProgress * Math.PI * 2) * 12
      spotY = 50 + Math.cos(holdProgress * Math.PI * 3) * 4
      radius = baseRadius * (1 + Math.sin(holdProgress * Math.PI * 4) * 0.08)
      intensity = 1
    } else {
      const eased = easeInOutSine(exitProgress)
      spotX = 50 + eased * 65 // sweep from center to offscreen-right
      spotY = 50 - Math.sin(exitProgress * Math.PI) * 5
      radius = baseRadius * (1 - exitProgress * 0.3)
      intensity = 1 - exitProgress * 1.5
    }

    const spotPxX = (spotX / 100) * width

    // Radial mask: text is only visible inside the spotlight circle
    const maskImage = `radial-gradient(circle ${radius}px at ${spotX}% ${spotY}%, black 0%, black 60%, transparent 100%)`

    return (
      <>
        {/* Spotlight cone glow on background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle ${radius * 1.8}px at ${spotX}% ${spotY}%, rgba(255,255,230,0.07) 0%, transparent 100%)`,
            opacity: Math.max(0, intensity),
            pointerEvents: 'none',
          }}
        />
        {/* Floor reflection */}
        <div
          style={{
            position: 'absolute',
            left: spotPxX - radius,
            bottom: 0,
            width: radius * 2,
            height: 40,
            background: `radial-gradient(ellipse at 50% 0%, rgba(255,255,220,${0.04 * Math.max(0, intensity)}), transparent 80%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Ghost outline of text in darkness */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.03)',
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: Math.max(0, intensity),
          }}
        >
          {word}
        </div>
        {/* Text revealed only inside spotlight */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            textShadow: `0 0 20px rgba(255,255,220,0.25)`,
            WebkitMaskImage: maskImage,
            maskImage,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function SpotlightSweepComponent(props: MotionGraphicProps<SpotlightSweepConfig>) {
  ;(globalThis as any).__spotlightSweepConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spotlight-sweep',
  title: 'Kinetic Spotlight Sweep',
  description: 'Single spotlight circle sweeps across to reveal text, only visible within the light cone',
  tags: ['kinetic', 'typography', 'spotlight', 'sweep', 'reveal', 'theatrical', 'geometric'],
  category: 'captions',
  component: SpotlightSweepComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'LIGHT', 'STAGE', 'SHINE'],
    colors: ['#F5E6CA', '#E8D5B0', '#F0DABB', '#DCC8A0'],
    bgColor: '#060608',
    cycleDuration: 1.4,
    spotlightSize: 180,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'LIGHT', 'STAGE', 'SHINE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6CA', '#E8D5B0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060608', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'spotlightSize', label: 'Spotlight Size', type: 'number', defaultValue: 180, min: 60, max: 400, group: 'Animation' },
  ],
})
