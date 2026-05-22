import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InkBleedConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Wet paper texture via SVG noise */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let bleedRadius = 0
    let scale = 1

    if (phase === 'enter') {
      // Ink drops onto paper: start super blurry and over-spread, sharpen to crisp
      // The spread parameter simulates ink fibres soaking outward then settling
      opacity = Math.min(1, enterProgress * 1.8)
      // Spread expands fast then contracts as ink dries
      const spreadPeak = enterProgress < 0.5
        ? enterProgress * 2             // 0 → 1 in first half
        : 2 - enterProgress * 2         // 1 → 0 in second half
      bleedRadius = spreadPeak * 28
      scale = 1 + spreadPeak * 0.12
    } else if (phase === 'hold') {
      opacity = 1
      bleedRadius = 3 + Math.sin(holdProgress * Math.PI * 5) * 1
      scale = 1
    } else {
      // Ink fades like it's being washed away
      opacity = 1 - exitProgress
      bleedRadius = exitProgress * 20
      scale = 1 + exitProgress * 0.05
    }

    // Build multi-shadow to simulate ink fibre bleeding
    const shadows = [
      `0 0 ${bleedRadius}px ${color}`,
      `${bleedRadius * 0.3}px ${bleedRadius * 0.2}px ${bleedRadius * 1.5}px ${color}66`,
      `-${bleedRadius * 0.2}px ${bleedRadius * 0.3}px ${bleedRadius * 1.2}px ${color}44`,
      `0 ${bleedRadius * 0.4}px ${bleedRadius * 2}px ${color}33`,
    ].join(', ')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          letterSpacing: 2,
          color,
          textShadow: shadows,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function InkBleedComponent(props: MotionGraphicProps<InkBleedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ink-bleed',
  title: 'Kinetic Ink Bleed',
  description: 'Ink dropped on wet paper — letters bloom with fibre-spread bleed then dry to a sharp reveal',
  tags: ['kinetic', 'typography', 'ink', 'bleed', 'paper', 'wet', 'organic'],
  category: 'captions',
  component: InkBleedComponent as any,
  defaultConfig: {
    words: ['INK', 'WRITE', 'SIGN', 'MARK'],
    colors: ['#1a1a1a', '#2C3E50', '#1B2631', '#17202A'],
    bgColor: '#F0E8D8',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INK', 'WRITE', 'SIGN', 'MARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2C3E50', '#1B2631', '#17202A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0E8D8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 6, group: 'Timing' },
  ],
})
