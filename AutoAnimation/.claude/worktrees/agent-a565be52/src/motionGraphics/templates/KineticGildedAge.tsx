import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GildedAgeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle shimmer on gold elements
    const shimmer = Math.sin(time * 2) * 0.5 + 0.5

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #1A0F05 0%, ${bgColor} 40%, #1A0F05 100%)`,
        }}
      >
        {/* Ornate corner flourishes — top left */}
        <div style={{ position: 'absolute', top: '5%', left: '5%', opacity: 0.3 }}>
          <div style={{ width: 'clamp(40px, 8vw, 80px)', height: 2, background: 'linear-gradient(90deg, #C9A84C, transparent)', marginBottom: 4 }} />
          <div style={{ width: 2, height: 'clamp(40px, 8vw, 80px)', background: 'linear-gradient(180deg, #C9A84C, transparent)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderRadius: '50%', background: '#C9A84C40' }} />
        </div>
        {/* Top right */}
        <div style={{ position: 'absolute', top: '5%', right: '5%', opacity: 0.3 }}>
          <div style={{ width: 'clamp(40px, 8vw, 80px)', height: 2, background: 'linear-gradient(270deg, #C9A84C, transparent)', marginBottom: 4, marginLeft: 'auto' }} />
          <div style={{ width: 2, height: 'clamp(40px, 8vw, 80px)', background: 'linear-gradient(180deg, #C9A84C, transparent)', marginLeft: 'auto' }} />
        </div>
        {/* Bottom left */}
        <div style={{ position: 'absolute', bottom: '5%', left: '5%', opacity: 0.3 }}>
          <div style={{ width: 2, height: 'clamp(40px, 8vw, 80px)', background: 'linear-gradient(0deg, #C9A84C, transparent)', marginBottom: 4 }} />
          <div style={{ width: 'clamp(40px, 8vw, 80px)', height: 2, background: 'linear-gradient(90deg, #C9A84C, transparent)' }} />
        </div>
        {/* Bottom right */}
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', opacity: 0.3, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ width: 2, height: 'clamp(40px, 8vw, 80px)', background: 'linear-gradient(0deg, #C9A84C, transparent)', marginBottom: 4 }} />
          <div style={{ width: 'clamp(40px, 8vw, 80px)', height: 2, background: 'linear-gradient(270deg, #C9A84C, transparent)' }} />
        </div>
        {/* Center ornamental divider lines */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '15%',
            right: '15%',
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(201,168,76,${0.15 + shimmer * 0.1}), transparent)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '65%',
            left: '15%',
            right: '15%',
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(201,168,76,${0.15 + shimmer * 0.1}), transparent)`,
            pointerEvents: 'none',
          }}
        />
        {/* Diamond ornament at center top */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(35% - 6px)',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 12,
            height: 12,
            border: '1px solid #C9A84C40',
            pointerEvents: 'none',
          }}
        />
        {/* Velvety vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10,5,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle fabric texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(201,168,76,0.01) 3px, rgba(201,168,76,0.01) 4px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const seed = index * 71 + 29
    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      // Elegant fade with gold shimmer reveal
      const eased = 1 - Math.pow(1 - enterProgress, 2.5)
      opacity = eased
      translateY = (1 - eased) * 25
      scale = 0.9 + eased * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle gold shimmer pulse
      translateY = Math.sin(f * 0.05 + seed) * 1.5
    } else {
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateY = eased * -20
      scale = 1 + eased * 0.05
    }

    // Gold gradient shift for shimmer
    const shimmerOffset = Math.sin(time * 3 + seed) * 15

    return (
      <div
        style={{
          position: 'absolute',
          top: '46%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Playfair Display', serif",
          fontSize: 'clamp(40px, 11vw, 145px)',
          fontWeight: 900,
          letterSpacing: 8,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: 'transparent',
          backgroundImage: `linear-gradient(135deg, #8B6914 ${shimmerOffset}%, #C9A84C ${30 + shimmerOffset}%, #FFD700 ${50 + shimmerOffset}%, #C9A84C ${70 + shimmerOffset}%, #8B6914 ${100 + shimmerOffset}%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 2px 4px rgba(139,105,20,0.5)) drop-shadow(0 0 15px rgba(201,168,76,0.2))`,
        }}
      >
        {word}
        {/* Emboss line below */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            left: '5%',
            right: '5%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, #C9A84C60, transparent)',
            opacity: phase === 'enter' ? enterProgress : phase === 'exit' ? 1 - exitProgress : 1,
          }}
        />
      </div>
    )
  },
}

function GildedAgeComponent(props: MotionGraphicProps<GildedAgeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gilded-age',
  title: 'Kinetic Gilded Age',
  description: 'Ornate gilded gold embossed text with shimmer gradient, corner flourishes, decorative dividers, and elegant entrance',
  tags: ['kinetic', 'typography', 'gilded', 'gold', 'vintage', 'ornate', 'luxury', 'embossed', 'elegant'],
  category: 'captions',
  component: GildedAgeComponent as any,
  defaultConfig: {
    words: ['GRAND', 'OPULENT', 'GILDED', 'ERA'],
    colors: ['#C9A84C', '#D4AF37', '#B8960C', '#C9A84C'],
    bgColor: '#1A0F05',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GRAND', 'OPULENT', 'GILDED', 'ERA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C9A84C', '#D4AF37', '#B8960C', '#C9A84C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0F05', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
