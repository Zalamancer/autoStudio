import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrandRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow-moving gradient overlay for cinematic feel
    const gradAngle = 135 + Math.sin(time * 0.3) * 10
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Moving light beam */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: `${40 + Math.sin(time * 0.5) * 15}%`,
            width: '20%',
            height: '140%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
            transform: `rotate(${gradAngle - 135}deg)`,
            pointerEvents: 'none',
          }}
        />
        {/* Top decorative line */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '15%',
            right: '15%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          }}
        />
        {/* Bottom decorative line */}
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '15%',
            right: '15%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 0
    let letterSpacing = 40
    let clipX = 0
    let scale = 1

    if (phase === 'enter') {
      // Cinematic reveal: letters spread and converge
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      letterSpacing = 40 - eased * 30
      // Mask reveal from center
      clipX = eased * 50
      scale = 0.95 + eased * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      letterSpacing = 10
      clipX = 50
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.008
    } else {
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      letterSpacing = 10 + eased * 20
      clipX = 50 - eased * 50
      scale = 1 - eased * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          textAlign: 'center',
          clipPath: `inset(0 ${50 - clipX}% 0 ${50 - clipX}%)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 800,
            color,
            letterSpacing: `${letterSpacing}px`,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            lineHeight: 1.1,
          }}
        >
          {word}
        </div>
        {/* Tagline line */}
        <div
          style={{
            marginTop: 'clamp(8px, 2vw, 20px)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(10px, 2vw, 16px)',
            fontWeight: 400,
            color: `${color}70`,
            textTransform: 'uppercase',
            letterSpacing: '0.35em',
            opacity: phase === 'enter' ? Math.max(0, (enterProgress - 0.6) / 0.4) : phase === 'exit' ? 1 - exitProgress : 1,
          }}
        >
          ESTABLISHED BRAND
        </div>
        {/* Decorative side lines */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 'clamp(6px, 1.5vw, 14px)' }}>
          <div style={{ width: 'clamp(20px, 5vw, 50px)', height: 1, background: `${color}40` }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: `${color}50` }} />
          <div style={{ width: 'clamp(20px, 5vw, 50px)', height: 1, background: `${color}40` }} />
        </div>
      </div>
    )
  },
}

function KineticBrandRevealComponent(props: MotionGraphicProps<BrandRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-brand-reveal',
  title: 'Brand Reveal',
  description: 'Cinematic brand name reveal with letter-spacing animation, clip-path mask unveil, and vignette background with moving light beam.',
  tags: ['kinetic', 'brand', 'reveal', 'logo', 'cinematic', 'marketing', 'luxury', 'corporate'],
  category: 'captions',
  component: KineticBrandRevealComponent as any,
  defaultConfig: {
    words: ['ACME', 'BRAND', 'STUDIO', 'CORP'],
    colors: ['#F5F5F5', '#E2E8F0', '#CBD5E1', '#F5F5F5'],
    bgColor: '#0f172a',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Brand Names', type: 'text-array', defaultValue: ['ACME', 'BRAND', 'STUDIO', 'CORP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5F5F5', '#E2E8F0', '#CBD5E1', '#F5F5F5'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
