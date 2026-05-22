import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PopUpConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    // Flat surface with subtle perspective grid
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ground plane */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '45%',
            background: 'linear-gradient(0deg, rgba(255,255,255,0.04), transparent)',
            transformOrigin: 'center bottom',
          }}
        />
        {/* Fold line */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: '62%',
            height: 2,
            background: 'rgba(255,255,255,0.08)',
            boxShadow: '0 0 20px rgba(255,255,255,0.03)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let rotateX = 90
    let opacity = 1
    let shadowBlur = 0

    if (phase === 'enter') {
      // Pops up from flat surface
      const eased = easeOutBack(enterProgress)
      rotateX = 90 * (1 - eased)
      opacity = Math.min(1, enterProgress * 2)
      shadowBlur = eased * 30
    } else if (phase === 'hold') {
      // Subtle breathing
      rotateX = Math.sin(holdProgress * Math.PI * 3) * 2
      shadowBlur = 30 + Math.sin(holdProgress * Math.PI * 2) * 5
    } else {
      // Folds back flat
      const eased = easeInCubic(exitProgress)
      rotateX = 90 * eased
      opacity = 1 - exitProgress * 0.8
      shadowBlur = 30 * (1 - eased)
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1000,
          perspectiveOrigin: '50% 70%',
        }}
      >
        <div
          style={{
            transformOrigin: 'center bottom',
            transform: `rotateX(${rotateX}deg)`,
            opacity,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Pop-up card front */}
          <div
            style={{
              padding: '24px 48px',
              background: `linear-gradient(180deg, ${color}18, ${color}08)`,
              border: `2px solid ${color}33`,
              borderBottom: `4px solid ${color}55`,
              borderRadius: '12px 12px 0 0',
              position: 'relative',
            }}
          >
            {/* Fold crease at bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${color}22, transparent)`,
              }}
            />
            <div
              style={{
                fontSize: 'clamp(44px, 11vw, 150px)',
                fontWeight: 900,
                color,
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                textShadow: `0 0 ${shadowBlur}px ${color}55`,
              }}
            >
              {word}
            </div>
          </div>

          {/* Ground shadow */}
          <div
            style={{
              position: 'absolute',
              bottom: -10,
              left: '10%',
              right: '10%',
              height: 20,
              background: `radial-gradient(ellipse, rgba(0,0,0,${0.3 * (1 - rotateX / 90)}), transparent)`,
              filter: `blur(${8 + shadowBlur * 0.2}px)`,
              transform: 'rotateX(90deg)',
              transformOrigin: 'center top',
            }}
          />
        </div>
      </div>
    )
  },
}

function PopUpComponent(props: MotionGraphicProps<PopUpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pop-up',
  title: 'Kinetic Pop Up',
  description: 'Pop-up book style card that unfolds from a flat surface using rotateX with bottom origin',
  tags: ['kinetic', 'typography', '3d', 'popup', 'fold', 'card', 'perspective'],
  category: 'captions',
  component: PopUpComponent as any,
  defaultConfig: {
    words: ['POP', 'UP', 'MAGIC', 'WOW'],
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'],
    bgColor: '#12121a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POP', 'UP', 'MAGIC', 'WOW'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12121a', group: 'Style' },
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
