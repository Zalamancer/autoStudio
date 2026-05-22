import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PlasmaBurnConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow phosphor warm pulse
    const pulseAlpha = 0.02 + Math.sin(time * 0.8) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Plasma panel cell structure - faint grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,180,120,0.02) 0px, rgba(255,180,120,0.02) 1px, transparent 1px, transparent 6px), ' +
              'repeating-linear-gradient(0deg, rgba(255,180,120,0.02) 0px, rgba(255,180,120,0.02) 1px, transparent 1px, transparent 6px)',
            pointerEvents: 'none',
          }}
        />
        {/* Warm phosphor ambient glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, rgba(255,160,100,${pulseAlpha}) 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Screen heat gradient - warmer at center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(80,40,20,0.06) 0%, transparent 80%)',
            pointerEvents: 'none',
          }}
        />
        {/* Edge darkening from burn pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Ghost image materializes: phosphor cells activate with warm glow
      // Start with a faint burn-in ghost, then brighten to full
      const ghostOpacity = enterProgress * 0.3
      const mainOpacity = Math.max(0, (enterProgress - 0.3) / 0.7)
      const burnSpread = (1 - enterProgress) * 8

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Ghost burn-in shadow (permanent retention artifact) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 800,
              color: 'rgba(180,100,60,0.15)',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              opacity: ghostOpacity + 0.4,
              filter: `blur(${burnSpread}px)`,
              textShadow: '0 0 20px rgba(255,140,80,0.2)',
            }}
          >
            {word}
          </div>
          {/* Main text - phosphor activation */}
          <div
            style={{
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              opacity: mainOpacity,
              textShadow: `0 0 6px ${color}, 0 0 20px rgba(255,140,80,0.4), 0 0 40px rgba(255,100,50,0.15)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Full phosphor glow with subtle warm pulsing
      const pulse = Math.sin(f * 0.06) * 0.06
      const heatShimmer = Math.sin(f * 0.1) * 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Burn-in ghost always present behind */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 800,
              color: 'rgba(180,100,60,0.12)',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              filter: 'blur(4px)',
              textShadow: '0 0 16px rgba(255,140,80,0.15)',
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              opacity: 0.94 + pulse,
              textShadow: `0 0 6px ${color}, 0 0 18px rgba(255,140,80,0.35), 0 0 ${35 + heatShimmer}px rgba(255,100,50,0.12)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: text fades but leaves a permanent burn-in ghost image
      const mainFade = 1 - exitProgress
      const ghostIntensity = 0.4 + exitProgress * 0.1 // ghost stays even as main fades
      const degradation = exitProgress * 3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Permanent burn-in residue */}
          <div
            style={{
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 800,
              color: 'rgba(180,100,60,0.18)',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              opacity: ghostIntensity,
              filter: `blur(${2 + degradation}px)`,
              textShadow: '0 0 12px rgba(255,140,80,0.15)',
            }}
          >
            {word}
          </div>
          {/* Fading main phosphor */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              opacity: mainFade,
              textShadow: `0 0 6px ${color}, 0 0 16px rgba(255,140,80,0.3)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function PlasmaBurnComponent(props: MotionGraphicProps<PlasmaBurnConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-plasma-burn',
  title: 'Kinetic Plasma Burn',
  description:
    'Plasma display burn-in effect with phosphor degradation ghost images, warm orange-pink glow, cell grid, and static retention',
  tags: ['kinetic', 'typography', 'plasma', 'burn-in', 'phosphor', 'display', 'warm', 'retro'],
  category: 'captions',
  component: PlasmaBurnComponent as any,
  defaultConfig: {
    words: ['BURN', 'GLOW', 'FADE', 'HOLD'],
    colors: ['#ffaa66', '#ff8844', '#ffcc88', '#ff9955'],
    bgColor: '#0c0806',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BURN', 'GLOW', 'FADE', 'HOLD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#ffaa66', '#ff8844', '#ffcc88', '#ff9955'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0806', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
