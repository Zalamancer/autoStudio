import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChromeSphereMapConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Chrome sphere environment mapping: text takes on the appearance of shiny chrome
// reflecting an entire 360° environment — the characteristic gradient from Escher sphere
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Studio environment — the environment being reflected
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${time * 15}deg, rgba(200,200,200,0.02) 0%, transparent 50%, rgba(150,150,200,0.02) 100%)`,
          }}
        />
        {/* Studio ceiling light reflection simulation */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '30%',
            width: '40%',
            height: '15%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 100%)',
            filter: 'blur(12px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    // Chrome sphere: the text itself is the chrome sphere — it maps the environment
    const scale = phase === 'enter' ? 0.3 + backEased * 0.7 : phase === 'exit' ? 1 - exitProgress * 0.6 : 1

    // The chrome gradient: dark at top-left, bright highlight in upper-right,
    // reflected floor light at bottom — classic chrome sphere gradient
    const highlightAngle =
      phase === 'hold'
        ? 125 + Math.sin(time * 0.6) * 20 // slowly moving highlight
        : 125

    const opacity = phase === 'enter' ? Math.min(1, enterProgress * 2.5) : phase === 'exit' ? 1 - exitProgress : 1

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Chrome gradient on text via background-clip */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color: 'transparent',
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            backgroundImage: `
              radial-gradient(ellipse 40% 30% at ${65 + Math.sin(time * 0.4) * 10}% ${30 + Math.sin(time * 0.3) * 8}%,
                rgba(255,255,255,0.95) 0%,
                rgba(220,220,220,0.7) 30%,
                rgba(100,100,120,0.5) 60%,
                rgba(30,30,50,0.8) 80%,
                rgba(80,80,100,0.6) 90%,
                rgba(180,180,200,0.4) 100%
              )
            `,
          }}
        >
          {word}
        </div>

        {/* Secondary chrome sheen — moving highlight */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color: 'transparent',
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            backgroundImage: `linear-gradient(${highlightAngle}deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)`,
            opacity: 0.7,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ChromeSphereMapComponent(props: MotionGraphicProps<ChromeSphereMapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chrome-sphere-map',
  title: 'Kinetic Chrome Sphere Map',
  description:
    'Chrome sphere environment mapping — text renders as polished chrome with the characteristic Escher sphere gradient: bright highlight, dark midtone, floor reflection',
  tags: ['kinetic', 'typography', 'chrome', 'sphere', 'reflection', 'mirror', 'metal', 'environment-map'],
  category: 'captions',
  component: ChromeSphereMapComponent as any,
  defaultConfig: {
    words: ['CHROME', 'METAL', 'SHINE', 'REFLECT'],
    colors: ['#CCCCCC', '#DDDDDD', '#BBBBBB', '#EEEEEE'],
    bgColor: '#0A0A0C',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CHROME', 'METAL', 'SHINE', 'REFLECT'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CCCCCC', '#DDDDDD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0C', group: 'Style' },
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
