import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BollywoodTitleConfig extends KineticBaseConfig {}

// Bollywood: ornate gold/jewel tones, decorative borders, starburst sparkle,
// dramatic entrance with scale + glow, Devanagari-inspired decorative flourishes
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Starburst / mandala-like radial background
    const rot = time * 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Decorative radial gradient burst */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '140%',
            height: '140%',
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
            backgroundImage: `repeating-conic-gradient(
              from 0deg,
              rgba(255,215,0,0.06) 0deg,
              rgba(255,215,0,0.06) 10deg,
              transparent 10deg,
              transparent 20deg
            )`,
          }}
        />
        {/* Jewel-tone border frame */}
        <div
          style={{
            position: 'absolute',
            inset: '8px',
            border: '3px solid rgba(255,215,0,0.3)',
            borderRadius: '4px',
            boxShadow: 'inset 0 0 30px rgba(255,140,0,0.1)',
          }}
        />
        {/* Inner decorative frame */}
        <div
          style={{
            position: 'absolute',
            inset: '14px',
            border: '1px solid rgba(255,215,0,0.15)',
            borderRadius: '2px',
          }}
        />
        {/* Corner sparkles (top-left, top-right, bottom-left, bottom-right) */}
        {[
          { top: '12px', left: '12px' },
          { top: '12px', right: '12px' },
          { bottom: '12px', left: '12px' },
          { bottom: '12px', right: '12px' },
        ].map((pos, i) => {
          const sparkle = 0.5 + Math.abs(Math.sin(time * 3 + i * 1.5)) * 0.5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                ...pos,
                opacity: sparkle,
              }}
            >
              <svg viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
                <path
                  d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z"
                  fill="rgba(255,215,0,0.8)"
                />
              </svg>
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let blur = 0
    const seed = index * 53 + 11

    if (phase === 'enter') {
      // Dramatic "filmi" reveal: bloom from center with golden glow
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 2)
      scale = 0.6 + ease * 0.4
      blur = (1 - enterProgress) * 8
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Sparkle breathing
      const glow = 0.8 + Math.sin(Date.now() * 0.004 + seed) * 0.2
      opacity = glow
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.2
      blur = exitProgress * 6
    }

    const goldGlow = `
      0 0 10px rgba(255,215,0,0.8),
      0 0 30px rgba(255,165,0,0.5),
      0 0 60px rgba(255,100,0,0.3),
      3px 3px 0 rgba(139,69,19,0.6)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: Math.max(0, opacity),
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(44px, 12vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: goldGlow,
            WebkitTextStroke: `2px rgba(139,69,19,0.6)`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function BollywoodTitleComponent(props: MotionGraphicProps<BollywoodTitleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bollywood-title',
  title: 'Kinetic Bollywood Title',
  description: 'Bollywood film title style with ornate gold jewel-tone glow, starburst mandala background, decorative frame, and dramatic bloom reveal',
  tags: ['kinetic', 'typography', 'bollywood', 'indian', 'gold', 'ornate', 'filmi', 'sparkle', 'hindi'],
  category: 'captions',
  component: BollywoodTitleComponent as any,
  defaultConfig: {
    words: ['DHOOM', 'DHADAK', 'ISHQ', 'ZINDAGI'],
    colors: ['#FFD700', '#FF6B35', '#FF1493', '#FFD700'],
    bgColor: '#1a0505',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DHOOM', 'DHADAK', 'ISHQ', 'ZINDAGI'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF6B35', '#FF1493', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
