import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BossIntroConfig extends KineticBaseConfig {
  subtitle: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark ominous gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(80,0,0,${0.1 + Math.sin(time * 1.5) * 0.04}) 0%, transparent 60%)`,
          }}
        />

        {/* Distortion / glitch lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const y = ((i * 97 + time * 40) % height)
          const w = 30 + Math.sin(time * 5 + i * 2) * 20
          const x = Math.sin(time * 3 + i * 1.5) * width * 0.3 + width * 0.5 - w / 2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: 1,
                background: `rgba(255,0,0,${0.08 + Math.sin(time * 6 + i) * 0.04})`,
              }}
            />
          )
        })}

        {/* Darkening pillars on edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Bottom fog */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '25%',
            background: `linear-gradient(180deg, transparent, rgba(0,0,0,0.5))`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Boss name = word, subtitle extracted from pattern
    const bossName = word.split('|')[0] || word
    const subtitle = word.includes('|') ? word.split('|')[1] : 'Lord of Shadows'

    let opacity = 0
    let nameScale = 1
    let nameY = 0
    let slamProgress = 0
    let shakeX = 0
    let shakeY = 0
    let healthBarWidth = 0
    let subtitleOpacity = 0
    let lineWidth = 0

    if (phase === 'enter') {
      const t = enterProgress
      opacity = Math.min(1, t * 3)

      // Name slams down from above
      if (t < 0.25) {
        slamProgress = t / 0.25
        nameY = -100 * (1 - slamProgress * slamProgress)
        nameScale = 0.8 + slamProgress * 0.5
      } else if (t < 0.4) {
        // Impact shake
        const shakeT = (t - 0.25) / 0.15
        nameY = 0
        nameScale = 1.3 - shakeT * 0.1
        shakeX = Math.sin(f * 2) * 6 * (1 - shakeT)
        shakeY = Math.cos(f * 2.5) * 4 * (1 - shakeT)
      } else {
        nameY = 0
        nameScale = 1.2
      }

      // Decorative lines extend outward
      lineWidth = Math.max(0, (t - 0.3) / 0.3)
      subtitleOpacity = Math.max(0, (t - 0.5) / 0.3)
      healthBarWidth = Math.max(0, (t - 0.7) / 0.3)
    } else if (phase === 'hold') {
      opacity = 1
      nameScale = 1.2 + Math.sin(holdProgress * Math.PI * 2) * 0.02
      lineWidth = 1
      subtitleOpacity = 1
      healthBarWidth = 1
      // Subtle menacing pulse
      nameY = Math.sin(holdProgress * Math.PI * 3) * 2
    } else {
      const t = exitProgress
      opacity = 1 - t * t
      nameScale = 1.2
      nameY = -t * 30
      lineWidth = 1 - t
      subtitleOpacity = 1 - t * 2
      healthBarWidth = 1 - t * 1.5
    }

    const lineMaxWidth = width * 0.35

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Impact flash on slam */}
        {phase === 'enter' && enterProgress > 0.2 && enterProgress < 0.35 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 45%, rgba(255,50,0,${0.1 * (1 - (enterProgress - 0.2) / 0.15)}) 0%, transparent 50%)`,
            }}
          />
        )}

        {/* Left decorative line */}
        <div
          style={{
            position: 'absolute',
            top: '49%',
            right: `calc(50% + ${80}px)`,
            width: Math.max(0, lineWidth) * lineMaxWidth,
            height: 2,
            background: `linear-gradient(270deg, ${color}, transparent)`,
            opacity: opacity * 0.6,
            transformOrigin: 'right center',
          }}
        />

        {/* Right decorative line */}
        <div
          style={{
            position: 'absolute',
            top: '49%',
            left: `calc(50% + ${80}px)`,
            width: Math.max(0, lineWidth) * lineMaxWidth,
            height: 2,
            background: `linear-gradient(90deg, ${color}, transparent)`,
            opacity: opacity * 0.6,
            transformOrigin: 'left center',
          }}
        />

        {/* Boss name — main text slam */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '42%',
            transform: `translate(-50%, calc(-50% + ${nameY}px)) scale(${nameScale})`,
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: 8,
            textShadow: `0 0 20px rgba(255,50,0,0.3), 0 0 40px rgba(255,0,0,0.15), 0 4px 0 rgba(80,0,0,0.5)`,
            whiteSpace: 'nowrap',
          }}
        >
          {bossName}
        </div>

        {/* Subtitle / title */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '55%',
            transform: 'translate(-50%, 0)',
            opacity: Math.max(0, subtitleOpacity) * opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(12px, 3vw, 22px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'rgba(255,200,150,0.7)',
            letterSpacing: 4,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </div>

        {/* Health bar hint at bottom */}
        <div
          style={{
            position: 'absolute',
            left: '15%',
            right: '15%',
            bottom: '12%',
            opacity: Math.max(0, healthBarWidth) * opacity * 0.8,
          }}
        >
          {/* Boss name above bar */}
          <div
            style={{
              fontFamily: "'Segoe UI', sans-serif",
              fontSize: 'clamp(9px, 2vw, 13px)',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 4,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {bossName}
          </div>
          {/* Bar background */}
          <div
            style={{
              width: '100%',
              height: 8,
              background: 'rgba(40,0,0,0.6)',
              borderRadius: 4,
              border: '1px solid rgba(255,50,0,0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Health fill */}
            <div
              style={{
                width: `${Math.max(0, healthBarWidth) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FF2222, #FF4444, #FF2222)',
                borderRadius: 3,
                boxShadow: '0 0 8px rgba(255,0,0,0.3)',
              }}
            />
          </div>
        </div>
      </div>
    )
  },
}

function BossIntroComponent(props: MotionGraphicProps<BossIntroConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-boss-intro',
  title: 'Kinetic Boss Intro',
  description:
    'Dramatic boss name slam with decorative lines, subtitle title, health bar hint, impact shake, and ominous atmosphere',
  tags: ['kinetic', 'typography', 'boss', 'intro', 'game', 'dark', 'souls', 'dramatic', 'slam'],
  category: 'captions',
  component: BossIntroComponent as any,
  defaultConfig: {
    words: ['MALENIA|Blade of Miquella', 'NAMELESS|The Forgotten King', 'SEPHIROTH|One-Winged Angel', 'GANONDORF|Demon King'],
    colors: ['#FF4444', '#CC88FF', '#88CCFF', '#FFAA44'],
    bgColor: '#080408',
    cycleDuration: 2.5,
    subtitle: 'Lord of Shadows',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Boss Names (Name|Subtitle)',
      type: 'text-array',
      defaultValue: ['MALENIA|Blade of Miquella', 'NAMELESS|The Forgotten King'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Name Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#CC88FF', '#88CCFF', '#FFAA44'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080408', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 1,
      max: 8,
      group: 'Timing',
    },
    {
      key: 'subtitle',
      label: 'Default Subtitle',
      type: 'text',
      defaultValue: 'Lord of Shadows',
      group: 'Content',
    },
  ],
})
