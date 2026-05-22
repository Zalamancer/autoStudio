import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DrawerSlideConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Drawer housing — recessed slot */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '82%',
          height: 'clamp(60px, 16vw, 180px)',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 6,
          boxShadow: 'inset 0 3px 12px rgba(0,0,0,0.6), inset 0 -1px 4px rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      />
      {/* Top guide rail */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% - clamp(30px, 8vw, 90px))',
          left: '9%',
          right: '9%',
          height: 3,
          background: 'linear-gradient(90deg, rgba(180,180,180,0.15), rgba(180,180,180,0.3), rgba(180,180,180,0.15))',
          borderRadius: 2,
        }}
      />
      {/* Bottom guide rail */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% + clamp(27px, 7.5vw, 87px))',
          left: '9%',
          right: '9%',
          height: 3,
          background: 'linear-gradient(90deg, rgba(180,180,180,0.15), rgba(180,180,180,0.3), rgba(180,180,180,0.15))',
          borderRadius: 2,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    let slideX = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // Drawer slides out from right
      slideX = (1 - eased) * width * 0.7
    } else if (phase === 'hold') {
      slideX = 0
      opacity = 1
    } else {
      const eased = easeInCubic(exitProgress)
      // Drawer slides back to the right
      slideX = eased * width * 0.7
      opacity = 1 - Math.pow(exitProgress, 3)
    }

    // Handle pull: leads slightly ahead of text
    const handleSlideX = phase === 'enter'
      ? (1 - easeOutCubic(Math.min(1, enterProgress * 1.1))) * width * 0.7
      : phase === 'exit'
      ? easeInCubic(Math.min(1, exitProgress * 1.1)) * width * 0.7
      : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${slideX}px)`,
          opacity,
        }}
      >
        {/* Drawer body */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 5,
            padding: '0 clamp(16px, 4vw, 48px)',
            height: 'clamp(52px, 13vw, 152px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Drawer handle — left side pull */}
          <div
            style={{
              position: 'absolute',
              left: 'clamp(-20px, -5vw, -56px)',
              top: '50%',
              transform: `translateY(-50%) translateX(${handleSlideX - slideX}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 'clamp(10px, 2.5vw, 30px)',
                height: 'clamp(28px, 7vw, 84px)',
                background: 'linear-gradient(90deg, #888, #bbb, #888)',
                borderRadius: 'clamp(3px, 1vw, 10px)',
                boxShadow: '2px 0 8px rgba(0,0,0,0.5)',
              }}
            />
            {/* Screw dots on handle */}
            <div style={{ position: 'absolute', top: '25%', width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.4)' }} />
            <div style={{ position: 'absolute', bottom: '25%', width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.4)' }} />
          </div>

          {/* Word text */}
          <span
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(36px, 9vw, 120px)',
              fontWeight: 800,
              color,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              textShadow: `0 2px 12px ${color}40`,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function DrawerSlideComponent(props: MotionGraphicProps<DrawerSlideConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drawer-slide',
  title: 'Kinetic Drawer Slide',
  description:
    'Text slides out from a recessed housing like a physical drawer being pulled open, complete with a metal handle that leads the motion. Reverses back in on exit.',
  tags: ['kinetic', 'typography', 'drawer', 'slide', 'mechanical', 'pull', 'housing', 'satisfying'],
  category: 'captions',
  component: DrawerSlideComponent as any,
  defaultConfig: {
    words: ['PULL', 'OPEN', 'SLIDE', 'DRAW'],
    colors: ['#E8D5A3', '#C9E4CA', '#C9D4E4', '#E4C9D4'],
    bgColor: '#1C1C1E',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PULL', 'OPEN', 'SLIDE', 'DRAW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D5A3', '#C9E4CA', '#C9D4E4', '#E4C9D4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1C1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
