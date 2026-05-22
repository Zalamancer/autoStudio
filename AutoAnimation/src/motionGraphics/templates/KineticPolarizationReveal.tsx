import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PolarizationRevealConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Polarization: rotating polarizer filter reveals hidden text
// Malus's law: I = I₀ cos²(θ) — intensity varies as cosine-squared of angle
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Polarizer grid pattern — fine diagonal lines
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(${time * 8}deg, transparent, transparent 5px, rgba(255,255,255,0.018) 5px, rgba(255,255,255,0.018) 6px)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Polarizer angle — sweeps from 90° (crossed, dark) to 0° (aligned, bright)
    const polAngle =
      phase === 'enter'
        ? (1 - eased) * 90 // starts at 90° (blocked), rotates to 0° (pass)
        : phase === 'hold'
          ? Math.sin(time * 0.9) * 15 // gentle oscillation showing polarization
          : exitProgress * 90 // re-crosses to block on exit

    // Malus's law: cos²(θ)
    const angleRad = (polAngle * Math.PI) / 180
    const malus = Math.cos(angleRad) ** 2

    // At crossed polarizers: text is dark; at aligned: text is bright
    const textOpacity = malus

    // Birefringent color: phase difference creates color fringing at partial angles
    const birefringenceHue =
      phase === 'hold'
        ? Math.abs(Math.sin(time * 0.9)) * 60 // hue shift near 45° — max birefringence
        : Math.sin((polAngle * Math.PI) / 180) * 60
    const birefColor = `hsl(${200 + birefringenceHue}, 80%, 70%)`

    // Extinction cross at 90°: dark bands appear crossing perpendicular axes
    const extinctionCross = 1 - malus

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Extinction — dark version (what's blocked by crossed polarizers) */}
        {extinctionCross > 0.05 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${polAngle * 0.5}deg)`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 800,
              color: birefColor,
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              opacity: extinctionCross * 0.3,
              filter: `blur(${extinctionCross * 3}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}

        {/* Main polarized text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            textShadow: phase === 'hold' && malus > 0.7 ? `0 0 20px ${color}30` : 'none',
          }}
        >
          {word}
        </div>

        {/* Polarizer angle indicator line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 60,
            height: 1,
            background: `rgba(255,255,255,${0.15 * (1 - malus)})`,
            transform: `translate(-50%, -50%) rotate(${polAngle}deg)`,
            transformOrigin: 'center',
          }}
        />
      </div>
    )
  },
}

function PolarizationRevealComponent(props: MotionGraphicProps<PolarizationRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-polarization-reveal',
  title: 'Kinetic Polarization Reveal',
  description:
    "Rotating polarizer filter reveals text — Malus's law drives opacity from darkness to full brightness, with birefringent color fringing at intermediate angles",
  tags: ['kinetic', 'typography', 'polarization', 'interference', 'malus', 'optical', 'reveal', 'filter'],
  category: 'captions',
  component: PolarizationRevealComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'ALIGN', 'POLAR', 'WAVE'],
    colors: ['#D0E8FF', '#B0D0FF', '#E8F4FF', '#90BCFF'],
    bgColor: '#03050A',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REVEAL', 'ALIGN', 'POLAR', 'WAVE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D0E8FF', '#B0D0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#03050A', group: 'Style' },
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
