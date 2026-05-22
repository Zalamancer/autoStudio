import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ContrailDissolveConfig extends KineticBaseConfig {}

// Contrails: appear sharp at the tip (newest air), spread and fade behind
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Horizon line — thin like 35,000ft sky */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent 100%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const isEnter = phase === 'enter'
    const isExit = phase === 'exit'

    const progress = isEnter ? enterProgress : isExit ? exitProgress : 1
    const eased = easeOutQuart(progress)

    // Enter: streaks in from left like a contrail being drawn across sky
    const translateXEnter = isEnter ? (1 - eased) * -60 : 0
    // Exit: drifts right and disperses like a contrail spreading in wind
    const translateXExit = isExit ? eased * 40 : 0
    const translateX = translateXEnter + translateXExit

    // Vertical drift: contrail slowly rises then disperses
    const translateYExit = isExit ? eased * -12 : 0

    // Contrail spreading: text stretches horizontally on exit
    const scaleXEnter = isEnter ? 0.7 + eased * 0.3 : 1
    const scaleXExit = isExit ? 1 + eased * 0.4 : 1
    const scaleX = scaleXEnter * scaleXExit

    const scaleYExit = isExit ? 1 - eased * 0.3 : 1

    // Opacity: sharp on enter, fades like ice crystals dispersing on exit
    const opacityEnter = isEnter ? Math.pow(eased, 0.5) : 1
    const opacityExit = isExit ? 1 - Math.pow(eased, 0.7) : 1
    const opacity = opacityEnter * opacityExit

    // Blur: contrail sharpens on enter, spreads/blurs on exit
    const blurEnter = isEnter ? (1 - eased) * 8 : 0
    const blurExit = isExit ? eased * 12 : 0
    const blurPx = blurEnter + blurExit

    // Contrail streak effect: a white-ish glow behind the text
    const glowOpacity = isExit ? 1 - eased : isEnter ? eased : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateYExit}px)) scaleX(${scaleX}) scaleY(${scaleYExit})`,
          opacity,
          filter: blurPx > 0.5 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
        }}
      >
        {/* Contrail streak behind the text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '-20%',
            right: '-20%',
            height: '40%',
            transform: 'translateY(-50%)',
            background: `linear-gradient(90deg, transparent 0%, ${color}18 30%, ${color}22 60%, transparent 100%)`,
            opacity: glowOpacity,
            borderRadius: '50%',
            filter: 'blur(6px)',
          }}
        />
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, 'Arial', sans-serif",
            fontSize: 'clamp(34px, 7.5vw, 112px)',
            fontWeight: 200,
            letterSpacing: '0.2em',
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            textShadow: `0 0 30px ${color}55`,
            position: 'relative',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ContrailDissolveComponent(props: MotionGraphicProps<ContrailDissolveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-contrail-dissolve',
  title: 'Contrail Dissolve',
  description:
    'Text streaks in from the left like a jet contrail being drawn across the sky, then spreads and dissolves into icy dispersal.',
  tags: ['kinetic', 'typography', 'aviation', 'contrail', 'flight', 'dissolve', 'sky'],
  category: 'captions',
  component: ContrailDissolveComponent as any,
  defaultConfig: {
    words: ['LIFT OFF', 'ASCENT', 'CRUISING', 'BEYOND'],
    colors: ['#e8f4ff', '#cce8ff', '#d6edff', '#e8f4ff'],
    bgColor: '#0d1b2e',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIFT OFF', 'ASCENT', 'CRUISING', 'BEYOND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8f4ff', '#cce8ff', '#d6edff', '#e8f4ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1b2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
