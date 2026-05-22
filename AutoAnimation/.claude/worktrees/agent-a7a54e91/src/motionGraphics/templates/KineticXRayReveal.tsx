import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface XRayRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // X-ray table scan: slowly sweeps left to right
    const scanX = ((time * 0.35) % 1.3 - 0.15) * 100

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* X-ray lightbox / negatoscope glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(80,130,200,0.08) 0%, transparent 70%)',
        }} />
        {/* Scan arc — X-ray source sweeping */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${scanX}%`, width: '4%',
          background: 'linear-gradient(90deg, transparent, rgba(140,190,255,0.07), rgba(160,210,255,0.12), rgba(140,190,255,0.07), transparent)',
          filter: 'blur(12px)',
        }} />
        {/* Film grain (faint dot noise) */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
        }} />
        {/* Exposure counter */}
        <div style={{
          position: 'absolute', top: 14, right: 18,
          fontFamily: 'monospace', fontSize: 11,
          color: 'rgba(120,180,255,0.4)',
          letterSpacing: 2,
        }}>
          kVp 80 · mAs 6.3
        </div>
        <div style={{
          position: 'absolute', bottom: 14, left: 18,
          fontFamily: 'monospace', fontSize: 11,
          color: 'rgba(120,180,255,0.4)',
          letterSpacing: 2,
        }}>
          DR PANEL
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // X-ray pass from left to right:
    // - Before scan: opaque surface (the body / material blocking X-rays)
    // - As scan passes: text appears in high-contrast white/blue-white (like bone on film)
    // - Hold: glowing X-ray text with bone-white sheen

    const scanPos = phase === 'enter' ? enterProgress
      : phase === 'hold' ? 1
      : 1

    const chars = word.split('')

    if (phase === 'enter') {
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', gap: 0 }}>
          {chars.map((ch, ci) => {
            const charFrac = (ci + 0.5) / chars.length
            const exposed = charFrac < scanPos

            // Pre-exposure: dark dense material (black/very dark)
            // Post-exposure: bright white/blue-white like bone structure
            const opacity = exposed ? 1 : 0.85
            const charColor = exposed
              ? `rgba(220,235,255,${0.8 + charFrac * 0.2})`
              : `rgba(15,20,30,0.9)`
            const shadow = exposed
              ? `0 0 18px rgba(160,200,255,0.7), 0 0 4px rgba(255,255,255,0.9)`
              : 'none'

            return (
              <span key={ci} style={{
                fontFamily: "'Arial Black', Impact, sans-serif",
                fontSize: 'clamp(42px, 11vw, 155px)',
                fontWeight: 900,
                color: charColor,
                letterSpacing: 4,
                opacity,
                textShadow: shadow,
                // Scan edge — bright flash at reveal boundary
                filter: Math.abs(charFrac - scanPos) < 0.08 ? 'brightness(2) blur(0.5px)' : 'none',
              }}>
                {ch}
              </span>
            )
          })}
          {/* Moving X-ray beam line */}
          <div style={{
            position: 'absolute', top: -20, bottom: -20,
            left: `${scanPos * 100}%`, width: 3,
            background: 'linear-gradient(180deg, transparent, rgba(180,220,255,0.8), rgba(220,240,255,1), rgba(180,220,255,0.8), transparent)',
            boxShadow: '0 0 16px 6px rgba(160,210,255,0.5)',
          }} />
        </div>
      )
    } else if (phase === 'hold') {
      // X-ray bone look: high contrast, slightly blue-white
      const flicker = 1 - Math.max(0, Math.sin(holdProgress * Math.PI * 8) - 0.9) * 0.3

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', Impact, sans-serif",
          fontSize: 'clamp(42px, 11vw, 155px)',
          fontWeight: 900,
          color: 'rgba(225,240,255,0.95)',
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textShadow: '0 0 20px rgba(160,200,255,0.65), 0 0 4px rgba(255,255,255,0.8)',
          opacity: flicker,
        }}>
          {word}
        </div>
      )
    } else {
      // Film exposure fades — dark overexposure wash
      const overexpose = exitProgress
      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', Impact, sans-serif",
          fontSize: 'clamp(42px, 11vw, 155px)',
          fontWeight: 900,
          color: `rgba(${Math.round(225 + overexpose * 30)},${Math.round(240 + overexpose * 15)},255,${1 - overexpose})`,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textShadow: `0 0 ${20 + overexpose * 40}px rgba(160,200,255,${0.65 + overexpose * 0.35})`,
          filter: `blur(${overexpose * 4}px) brightness(${1 + overexpose * 2})`,
        }}>
          {word}
        </div>
      )
    }
  },
}

function XRayRevealComponent(props: MotionGraphicProps<XRayRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-xray-reveal',
  title: 'Kinetic X-Ray Reveal',
  description: 'X-ray scan passes left to right: opaque surface exposes high-contrast bone-white text on dark radiographic film background',
  tags: ['kinetic', 'typography', 'xray', 'scan', 'medical', 'reveal', 'radiograph', 'bone'],
  category: 'captions',
  component: XRayRevealComponent as any,
  defaultConfig: {
    words: ['BONE', 'SCAN', 'CLEAR', 'NEXT'],
    colors: ['#DDEEFF', '#CCE8FF', '#DDEEFF', '#EEF4FF'],
    bgColor: '#030810',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BONE', 'SCAN', 'CLEAR', 'NEXT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DDEEFF', '#CCE8FF', '#DDEEFF', '#EEF4FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
