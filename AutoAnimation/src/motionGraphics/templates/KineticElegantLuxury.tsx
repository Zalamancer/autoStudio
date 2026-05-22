import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ElegantLuxuryConfig extends KineticBaseConfig {
  goldHue: number
}

// Elegant / luxury mood: thin serif typography, gold accents, slow deliberate
// reveals like a perfume ad. A horizontal gold rule expands to reveal text,
// letters appear one by one with precise timing. Background has faint marble
// veining and golden dust motes.

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Marble veining — subtle diagonal lines that shift slowly
    const veins = Array.from({ length: 6 }, (_, i) => {
      const angle = 25 + rand(i * 31) * 30
      const x = rand(i * 47) * 100
      const drift = Math.sin(t * 0.05 + i * 1.2) * 3

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${angle + drift}deg, transparent ${x - 1}%, rgba(180,160,130,0.04) ${x}%, transparent ${x + 1}%)`,
          }}
        />
      )
    })

    // Golden dust motes — tiny floating particles
    const motes = Array.from({ length: 10 }, (_, i) => {
      const baseX = rand(i * 23 + 3) * 100
      const baseY = rand(i * 41 + 7) * 100
      const driftX = Math.sin(t * 0.1 + i * 0.8) * 8
      const driftY = Math.cos(t * 0.08 + i * 1.1) * 6
      const size = 2 + rand(i * 17) * 3
      const shimmer = 0.15 + Math.sin(t * 0.6 + i * 2.1) * 0.1

      return (
        <div
          key={`m${i}`}
          style={{
            position: 'absolute',
            left: `${baseX + driftX}%`,
            top: `${baseY + driftY}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(212,175,55,${shimmer})`,
            filter: `blur(${size * 0.3}px)`,
            mixBlendMode: 'screen',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {veins}
        {motes}
        {/* Subtle warm gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(180,150,80,0.03) 0%, transparent 60%)',
            mixBlendMode: 'overlay',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    // Horizontal gold rule that expands to frame the text
    let ruleWidth = 0
    let ruleOpacity = 0
    let textRevealProgress = 0

    if (phase === 'enter') {
      // Rule expands first (0-60%), then text reveals (30-100%)
      ruleWidth = easeInOutCubic(Math.min(1, enterProgress / 0.6)) * 100
      ruleOpacity = easeInOutCubic(Math.min(1, enterProgress / 0.4))
      textRevealProgress = Math.max(0, (enterProgress - 0.3) / 0.7)
    } else if (phase === 'hold') {
      ruleWidth = 100
      ruleOpacity = 1
      textRevealProgress = 1
    } else {
      // Text fades first, rule contracts
      ruleWidth = (1 - easeInOutCubic(Math.min(1, exitProgress / 0.8))) * 100
      ruleOpacity = 1 - easeInOutCubic(exitProgress)
      textRevealProgress = 1 - easeInOutCubic(Math.min(1, exitProgress / 0.6))
    }

    const chars = word.split('').map((ch, ci) => {
      const total = word.length || 1
      // Staggered reveal — each letter precisely timed
      const delay = (ci / total) * 0.5
      const p = Math.max(0, Math.min(1, (textRevealProgress - delay) / 0.5))
      const ep = easeInOutCubic(p)

      const charOpacity = ep
      // Letters rise slightly from below
      const yOff = (1 - ep) * 12

      // Hold: subtle tracking expansion
      let letterSpacingExtra = 0
      if (phase === 'hold') {
        letterSpacingExtra = Math.sin(holdProgress * Math.PI * 2 + ci * 0.4) * 0.5
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px)`,
            marginRight: letterSpacingExtra,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Top gold rule */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - 40px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${ruleWidth}%`,
            maxWidth: '70%',
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(212,175,55,${ruleOpacity * 0.8}), transparent)`,
          }}
        />
        {/* Bottom gold rule */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 40px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${ruleWidth}%`,
            maxWidth: '70%',
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(212,175,55,${ruleOpacity * 0.8}), transparent)`,
          }}
        />
        {/* Gold shimmer reflection behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 100,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: 'rgba(212,175,55,0.15)',
            opacity: textRevealProgress,
            filter: 'blur(8px)',
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 100,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function ElegantLuxuryComponent(props: MotionGraphicProps<ElegantLuxuryConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-elegant-luxury',
  title: 'Kinetic Elegant Luxury',
  description: 'Thin serif typography with gold horizontal rules, marble veining background, golden dust motes, and precisely staggered letter reveals like a perfume ad.',
  tags: ['kinetic', 'typography', 'elegant', 'luxury', 'gold', 'serif', 'perfume', 'mood', 'atmosphere'],
  category: 'captions',
  component: ElegantLuxuryComponent as any,
  defaultConfig: {
    words: ['ALLURE', 'OPAQUE', 'NOIR', 'VELVET'],
    colors: ['#F0E6D3', '#D4AF37', '#F0E6D3', '#D4AF37'],
    bgColor: '#0D0B09',
    cycleDuration: 1.3,
    goldHue: 43,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ALLURE', 'OPAQUE', 'NOIR', 'VELVET'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0E6D3', '#D4AF37', '#F0E6D3', '#D4AF37'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0B09', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'goldHue', label: 'Gold Hue', type: 'number', defaultValue: 43, min: 20, max: 60, group: 'Animation' },
  ],
})
