import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AltimeterSpinConfig extends KineticBaseConfig {}

// Easing: fast-in, decelerate at end like a mechanical needle settling
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Altimeter bezel ring */}
      <div
        style={{
          position: 'absolute',
          width: '72vmin',
          height: '72vmin',
          borderRadius: '50%',
          border: '3px solid rgba(180,180,180,0.25)',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      />
      {/* Tick marks */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: '10px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '1px',
            transformOrigin: '1px 36vmin',
            transform: `rotate(${i * 36}deg) translateY(-26vmin)`,
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const eased =
      phase === 'enter'
        ? easeOutCubic(enterProgress)
        : phase === 'exit'
          ? easeInCubic(exitProgress)
          : 1

    // Altimeter needle effect: word sweeps in from bottom with a spin
    const rotationEnter = phase === 'enter' ? (1 - eased) * -180 : 0
    const rotationExit = phase === 'exit' ? eased * 90 : 0
    const rotation = rotationEnter + rotationExit

    // Scale: needle clicks into place
    const scaleEnter = phase === 'enter' ? 0.4 + eased * 0.6 : 1
    const scaleExit = phase === 'exit' ? 1 - eased * 0.3 : 1
    const scale = scaleEnter * scaleExit

    const opacity =
      phase === 'enter'
        ? eased
        : phase === 'exit'
          ? 1 - eased * 0.8
          : 1

    // Small needle-settle bounce at end of enter
    const bounce =
      phase === 'enter' && enterProgress > 0.85
        ? Math.sin((enterProgress - 0.85) / 0.15 * Math.PI * 3) * (1 - enterProgress) * 6
        : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${rotation + bounce}deg) scale(${scale})`,
          opacity,
        }}
      >
        {/* Altitude readout strip — monospace, instrument-style */}
        <div
          style={{
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(32px, 7vw, 108px)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color,
            whiteSpace: 'nowrap',
            textShadow: `0 0 20px ${color}66, 0 2px 0 rgba(0,0,0,0.6)`,
            borderBottom: `2px solid ${color}44`,
            paddingBottom: '4px',
          }}
        >
          {word}
        </div>
        {/* Needle indicator line underneath */}
        <div
          style={{
            width: '100%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            marginTop: '6px',
            opacity: 0.6,
          }}
        />
      </div>
    )
  },
}

function AltimeterSpinComponent(props: MotionGraphicProps<AltimeterSpinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-altimeter-spin',
  title: 'Altimeter Spin',
  description:
    'Text swings in like a cockpit altimeter needle settling on an altitude reading, with instrument bezel and tick-mark background.',
  tags: ['kinetic', 'typography', 'aviation', 'cockpit', 'instrument', 'altimeter', 'spin'],
  category: 'captions',
  component: AltimeterSpinComponent as any,
  defaultConfig: {
    words: ['FL350', 'CLIMB', '28000', 'CRUISE'],
    colors: ['#00e5ff', '#00e5ff', '#00e5ff', '#00e5ff'],
    bgColor: '#0a0e14',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FL350', 'CLIMB', '28000', 'CRUISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00e5ff', '#00e5ff', '#00e5ff', '#00e5ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
