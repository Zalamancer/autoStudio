import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CTAFlashConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Radial pulse emanating from center
    const pulseRadius = (time * 40) % 100
    const pulseOpacity = Math.max(0, 0.08 - pulseRadius * 0.001)
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Pulsing ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${pulseRadius}%`,
            height: `${pulseRadius}%`,
            borderRadius: '50%',
            border: '2px solid rgba(59,130,246,0.08)',
            opacity: pulseOpacity * 10,
            pointerEvents: 'none',
          }}
        />
        {/* Second ring offset */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${(pulseRadius + 30) % 100}%`,
            height: `${(pulseRadius + 30) % 100}%`,
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.05)',
            opacity: Math.max(0, 0.06 - ((pulseRadius + 30) % 100) * 0.001) * 10,
            pointerEvents: 'none',
          }}
        />
        {/* Corner accents */}
        {[
          { top: '8%', left: '8%' },
          { top: '8%', right: '8%' },
          { bottom: '8%', left: '8%' },
          { bottom: '8%', right: '8%' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 'clamp(16px, 4vw, 32px)',
              height: 'clamp(16px, 4vw, 32px)',
              borderTop: i < 2 ? '2px solid rgba(59,130,246,0.12)' : 'none',
              borderBottom: i >= 2 ? '2px solid rgba(59,130,246,0.12)' : 'none',
              borderLeft: i % 2 === 0 ? '2px solid rgba(59,130,246,0.12)' : 'none',
              borderRight: i % 2 === 1 ? '2px solid rgba(59,130,246,0.12)' : 'none',
              pointerEvents: 'none',
            } as any}
          />
        ))}
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
    frame,
    fps,
  }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let glowIntensity = 0

    if (phase === 'enter') {
      // Flash in: bright flash then settle
      if (enterProgress < 0.15) {
        // Initial bright flash
        opacity = enterProgress / 0.15
        scale = 1.4
        glowIntensity = 1
      } else if (enterProgress < 0.3) {
        // Settle from flash
        opacity = 1
        const t = (enterProgress - 0.15) / 0.15
        scale = 1.4 - t * 0.4
        glowIntensity = 1 - t * 0.7
      } else {
        opacity = 1
        scale = 1
        glowIntensity = 0.3
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Attention-grabbing pulse
      const pulseT = holdProgress * 8
      const pulse = Math.abs(Math.sin(pulseT * Math.PI))
      scale = 1 + pulse * 0.06
      glowIntensity = 0.2 + pulse * 0.4
    } else {
      // Flash out
      if (exitProgress < 0.3) {
        // One last flash
        opacity = 1
        glowIntensity = exitProgress / 0.3
        scale = 1 + exitProgress * 0.3
      } else {
        opacity = 1 - (exitProgress - 0.3) / 0.7
        glowIntensity = 1 - (exitProgress - 0.3) / 0.7
        scale = 1.3 + (exitProgress - 0.3) * 0.2
      }
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
        }}
      >
        {/* Glow backdrop */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '150%',
            height: '200%',
            background: `radial-gradient(ellipse, ${color}${Math.round(glowIntensity * 15).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* CTA button shape */}
        <div
          style={{
            position: 'relative',
            padding: 'clamp(12px, 3vw, 28px) clamp(24px, 6vw, 56px)',
            background: `linear-gradient(135deg, ${color}, ${color}DD)`,
            borderRadius: 'clamp(8px, 2vw, 16px)',
            boxShadow: `0 0 ${20 + glowIntensity * 40}px ${color}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}, 0 8px 32px rgba(0,0,0,0.3)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 8vw, 100px)',
              fontWeight: 900,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {word}
          </div>
        </div>
        {/* Arrow indicator */}
        <div
          style={{
            marginTop: 'clamp(6px, 1.5vw, 12px)',
            fontSize: 'clamp(14px, 3vw, 24px)',
            color: `${color}`,
            opacity: phase === 'enter' ? Math.max(0, (enterProgress - 0.5) * 2) : phase === 'exit' ? 1 - exitProgress : 0.6 + Math.sin((holdProgress || 0) * Math.PI * 6) * 0.4,
            transform: `translateY(${phase === 'hold' ? Math.sin((holdProgress || 0) * Math.PI * 4) * 4 : 0}px)`,
          }}
        >
          {'\u25BC'}
        </div>
      </div>
    )
  },
}

function KineticCTAFlashComponent(props: MotionGraphicProps<CTAFlashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cta-flash',
  title: 'CTA Flash',
  description: 'Call-to-action with bright flash entrance, pulsing glow, button shape, and attention-grabbing scale animation.',
  tags: ['kinetic', 'cta', 'flash', 'marketing', 'button', 'action', 'conversion', 'attention'],
  category: 'captions',
  component: KineticCTAFlashComponent as any,
  defaultConfig: {
    words: ['BUY NOW', 'SIGN UP', 'GET IT', 'JOIN'],
    colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#3B82F6'],
    bgColor: '#0a0f1e',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'CTA Text', type: 'text-array', defaultValue: ['BUY NOW', 'SIGN UP', 'GET IT', 'JOIN'], group: 'Content' },
    { key: 'colors', label: 'Button Colors', type: 'text-array', defaultValue: ['#3B82F6', '#6366F1', '#8B5CF6', '#3B82F6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
