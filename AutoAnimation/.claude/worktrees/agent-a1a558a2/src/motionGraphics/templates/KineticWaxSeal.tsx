import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaxSealConfig extends KineticBaseConfig {}

function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Parchment envelope texture
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper fold lines */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 1,
            height: '100%',
            background: 'linear-gradient(180deg, transparent 10%, rgba(139,115,85,0.06) 30%, rgba(139,115,85,0.06) 70%, transparent 90%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            width: '100%',
            height: 1,
            background: 'linear-gradient(90deg, transparent 10%, rgba(139,115,85,0.06) 30%, rgba(139,115,85,0.06) 70%, transparent 90%)',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(80,50,20,0.08) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 67 + 19

    // Wax seal colors
    const waxColor = color
    const darkWax = '#6B1515'
    const highlightWax = '#D44040'

    let waxSpread = 0 // 0..1 how much the wax has spread
    let waxOpacity = 0
    let stampDepth = 0 // how deep the stamp has pressed
    let textReveal = 0 // 0..1 text visibility
    let textEmboss = 0
    let sealScale = 0
    let dripsProgress = 0

    if (phase === 'enter') {
      const t = enterProgress
      if (t < 0.35) {
        // Wax melts and pools
        const melt = t / 0.35
        waxSpread = melt * 0.6
        waxOpacity = melt * 0.8
        sealScale = 0.3 + melt * 0.5
        dripsProgress = melt * 0.5
        textReveal = 0
      } else if (t < 0.6) {
        // Stamp presses into wax
        const press = (t - 0.35) / 0.25
        waxSpread = 0.6 + press * 0.4
        waxOpacity = 0.8 + press * 0.2
        sealScale = 0.8 + press * 0.2
        stampDepth = press
        textReveal = press * 0.5
        textEmboss = press
        dripsProgress = 0.5 + press * 0.3
      } else {
        // Stamp lifts, text fully revealed in wax
        const lift = (t - 0.6) / 0.4
        waxSpread = 1
        waxOpacity = 1
        sealScale = 1
        stampDepth = 1 - lift * 0.3
        textReveal = 0.5 + lift * 0.5
        textEmboss = 1
        dripsProgress = 0.8 + lift * 0.2
      }
    } else if (phase === 'hold') {
      waxSpread = 1
      waxOpacity = 1
      sealScale = 1
      stampDepth = 0.7
      textReveal = 1
      textEmboss = 1
      dripsProgress = 1
    } else {
      const t = exitProgress
      waxSpread = 1 - t * 0.2
      waxOpacity = 1 - t
      sealScale = 1 - t * 0.15
      stampDepth = 0.7 * (1 - t)
      textReveal = 1 - t
      textEmboss = 1 - t
      dripsProgress = 1 - t * 0.5
    }

    // Wax drips
    const drips: React.ReactNode[] = []
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * 360 + hash(seed + i * 53) * 40
      const dist = 60 + hash(seed + i * 37) * 30
      const dripLen = (15 + hash(seed + i * 71) * 25) * dripsProgress
      const rad = (angle * Math.PI) / 180
      const x = Math.cos(rad) * dist
      const y = Math.sin(rad) * dist
      drips.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 6 + hash(seed + i * 19) * 6,
            height: dripLen,
            background: `linear-gradient(180deg, ${waxColor}, ${darkWax})`,
            borderRadius: '3px 3px 50% 50%',
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle + 90}deg)`,
            opacity: waxOpacity * 0.7,
            transformOrigin: 'top center',
          }}
        />
      )
    }

    // Embossed text shadow
    const embossShadow = textEmboss > 0
      ? [
          `0 ${-textEmboss * 1.5}px ${textEmboss}px rgba(255,255,255,${textEmboss * 0.25})`,
          `0 ${textEmboss * 2}px ${textEmboss * 1.5}px rgba(0,0,0,${textEmboss * 0.4})`,
          `inset 0 ${textEmboss}px ${textEmboss * 2}px rgba(0,0,0,0.15)`,
        ].join(', ')
      : 'none'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${sealScale})`,
        }}
      >
        {/* Wax blob background */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 180 * waxSpread,
            height: 180 * waxSpread,
            transform: 'translate(-50%, -50%)',
            borderRadius: '45% 55% 48% 52% / 52% 48% 55% 45%',
            background: `radial-gradient(ellipse at 35% 35%, ${highlightWax}, ${waxColor} 50%, ${darkWax} 100%)`,
            opacity: waxOpacity,
            boxShadow: [
              `0 4px 12px rgba(0,0,0,${waxOpacity * 0.3})`,
              `inset 0 -3px 8px rgba(0,0,0,0.2)`,
              `inset 0 3px 6px rgba(255,255,255,0.1)`,
            ].join(', '),
          }}
        />
        {/* Drips */}
        {drips}
        {/* Text stamped into wax */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Trajan Pro', 'Palatino', 'Georgia', serif",
            fontSize: 'clamp(36px, 10vw, 120px)',
            fontWeight: 700,
            letterSpacing: 6,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            color: darkWax,
            opacity: textReveal,
            textShadow: embossShadow,
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function WaxSealComponent(props: MotionGraphicProps<WaxSealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wax-seal',
  title: 'Kinetic Wax Seal',
  description: 'Text emerges from melting wax seal press with drip and emboss — wax pools, stamp presses, letterforms reveal',
  tags: ['kinetic', 'typography', 'wax', 'seal', 'stamp', 'emboss', 'vintage', 'royal'],
  category: 'captions',
  component: WaxSealComponent as any,
  defaultConfig: {
    words: ['SEAL', 'MARK', 'CREST', 'ROYAL'],
    colors: ['#8B1A1A', '#8B1A1A', '#8B1A1A', '#6B2020'],
    bgColor: '#F5ECD7',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SEAL', 'MARK', 'CREST', 'ROYAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B1A1A', '#8B1A1A', '#8B1A1A', '#6B2020'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5ECD7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
