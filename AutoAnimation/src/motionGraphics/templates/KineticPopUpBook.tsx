import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PopUpBookConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Book page left half */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          right: '50%',
          top: '15%',
          bottom: '8%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRight: '2px solid rgba(255,255,255,0.14)',
          borderRadius: '8px 0 0 8px',
        }}
      />
      {/* Book page right half */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          right: '5%',
          top: '15%',
          bottom: '8%',
          background: 'linear-gradient(225deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '2px solid rgba(255,255,255,0.14)',
          borderRadius: '0 8px 8px 0',
        }}
      />
      {/* Spine line */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '15%',
          bottom: '8%',
          width: 3,
          background: 'rgba(255,255,255,0.2)',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 12px rgba(255,255,255,0.06)',
        }}
      />
      {/* Ruled lines on pages */}
      {[0.25, 0.4, 0.55, 0.7].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: `${15 + pos * 70}%`,
            height: 1,
            background: 'rgba(255,255,255,0.04)',
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    // 3D fold mechanics: two halves pivot from center spine
    // Left half rotates on Y axis (negative), right half rotates on Y (positive)
    // Together they form a V-shape rising from flat

    let foldAngle = 90   // 90 = flat, 0 = standing upright
    let opacity = 1
    let shadowHeight = 0
    let scaleY = 1

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      foldAngle = 90 * (1 - eased) // folds up to standing position (may overshoot to negative)
      opacity = Math.min(1, enterProgress * 2.5)
      shadowHeight = eased * 20
      scaleY = 1 + Math.max(0, -foldAngle / 90) * 0.1
    } else if (phase === 'hold') {
      // Gentle breathing sway
      foldAngle = Math.sin(holdProgress * Math.PI * 4) * 4
      shadowHeight = 20
      opacity = 1
    } else {
      const eased = easeInCubic(exitProgress)
      foldAngle = 90 * eased
      opacity = exitProgress < 0.6 ? 1 : (1 - exitProgress) / 0.4
      shadowHeight = 20 * (1 - eased)
    }

    // clamp foldAngle for display
    const clampedAngle = Math.max(-15, Math.min(90, foldAngle))

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 900,
          perspectiveOrigin: '50% 60%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            opacity,
          }}
        >
          {/* Left fold panel */}
          <div
            style={{
              transformOrigin: 'right center',
              transform: `rotateY(${clampedAngle}deg)`,
              transformStyle: 'preserve-3d',
              padding: '16px 0 16px 32px',
              background: `linear-gradient(90deg, ${color}10, ${color}20)`,
              borderLeft: `3px solid ${color}44`,
              borderTop: `2px solid ${color}33`,
              borderBottom: `2px solid ${color}33`,
              borderRadius: '8px 0 0 8px',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(40px, 10vw, 130px)',
                fontWeight: 900,
                color,
                whiteSpace: 'nowrap',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                textShadow: `2px 2px 0 rgba(0,0,0,0.3)`,
                overflow: 'hidden',
                maxWidth: '50vw',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              {/* Left half of text (clip overflow) */}
              <span style={{ display: 'inline-block' }}>{word}</span>
            </div>
          </div>

          {/* Right fold panel */}
          <div
            style={{
              transformOrigin: 'left center',
              transform: `rotateY(${-clampedAngle}deg)`,
              transformStyle: 'preserve-3d',
              padding: '16px 32px 16px 0',
              background: `linear-gradient(270deg, ${color}10, ${color}20)`,
              borderRight: `3px solid ${color}44`,
              borderTop: `2px solid ${color}33`,
              borderBottom: `2px solid ${color}33`,
              borderRadius: '0 8px 8px 0',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Fold crease shadow */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 20,
                background: 'linear-gradient(90deg, rgba(0,0,0,0.25), transparent)',
              }}
            />
          </div>
        </div>

        {/* Center text — sits at spine, full word rendered with perspective */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 130px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              textShadow: `2px 2px 0 rgba(0,0,0,0.4), 0 0 40px ${color}44`,
              transform: `scaleY(${scaleY})`,
              transformOrigin: 'center bottom',
            }}
          >
            {word}
          </div>
        </div>

        {/* Ground shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: `${shadowHeight}px`,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.4), transparent)',
            filter: 'blur(8px)',
            opacity: opacity * 0.6,
          }}
        />
      </div>
    )
  },
}

function PopUpBookComponent(props: MotionGraphicProps<PopUpBookConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pop-up-book',
  title: 'Pop-Up Book',
  description:
    'Text pops up from a flat book page with 3D fold mechanics — two panels pivot from the spine as the word rises upright.',
  tags: ['kinetic', 'typography', '3d', 'popup', 'book', 'fold', 'perspective', 'spring', 'mechanical'],
  category: 'captions',
  component: PopUpBookComponent as any,
  defaultConfig: {
    words: ['STORY', 'TALE', 'READ', 'MAGIC'],
    colors: ['#FF9F1C', '#2EC4B6', '#E71D36', '#CBF3F0'],
    bgColor: '#12100e',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STORY', 'TALE', 'READ', 'MAGIC'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF9F1C', '#2EC4B6', '#E71D36', '#CBF3F0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12100e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
