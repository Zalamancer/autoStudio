import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PageTurnConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let pageRotateY = 0
    let opacity = 1
    let shadowSpread = 0

    if (phase === 'enter') {
      // Page turns from right to flat
      const eased = easeOutCubic(enterProgress)
      pageRotateY = -120 * (1 - eased)
      opacity = enterProgress > 0.2 ? 1 : enterProgress / 0.2
      shadowSpread = eased * 20
    } else if (phase === 'hold') {
      // Page lies flat with subtle breathing
      pageRotateY = Math.sin(holdProgress * Math.PI * 2) * 1.5
      shadowSpread = 20 + Math.sin(holdProgress * Math.PI * 2) * 3
    } else {
      // Page turns away to the left
      const eased = easeInQuad(exitProgress)
      pageRotateY = 120 * eased
      opacity = exitProgress < 0.8 ? 1 : (1 - exitProgress) / 0.2
      shadowSpread = 20 * (1 - eased)
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1400,
          perspectiveOrigin: '30% 50%',
        }}
      >
        {/* Page */}
        <div
          style={{
            position: 'relative',
            width: '70%',
            height: '60%',
            transformOrigin: 'left center',
            transform: `rotateY(${pageRotateY}deg)`,
            transformStyle: 'preserve-3d',
            opacity,
          }}
        >
          {/* Front of page */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #f5f0e8, #e8e0d0)',
              borderRadius: '2px 8px 8px 2px',
              backfaceVisibility: 'hidden',
              boxShadow: `${shadowSpread}px 0 ${shadowSpread * 2}px rgba(0,0,0,0.3), -2px 0 8px rgba(0,0,0,0.1)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10%',
            }}
          >
            {/* Page texture lines */}
            <div
              style={{
                position: 'absolute',
                inset: '15% 10%',
                opacity: 0.08,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, #666 28px, #666 29px)',
              }}
            />
            {/* Page fold shadow */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 30,
                background: 'linear-gradient(90deg, rgba(0,0,0,0.1), transparent)',
              }}
            />
            <div
              style={{
                fontSize: 'clamp(36px, 9vw, 130px)',
                fontWeight: 800,
                color: color,
                whiteSpace: 'nowrap',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                textShadow: `0 2px 4px rgba(0,0,0,0.1)`,
                letterSpacing: '0.02em',
              }}
            >
              {word}
            </div>
          </div>

          {/* Back of page */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #e0d8c8, #d5cdb8)',
              borderRadius: '8px 2px 2px 8px',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          />
        </div>

        {/* Book spine shadow */}
        <div
          style={{
            position: 'absolute',
            left: '15%',
            top: '20%',
            bottom: '20%',
            width: 4,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },
}

function PageTurnComponent(props: MotionGraphicProps<PageTurnConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-page-turn',
  title: 'Kinetic Page Turn',
  description: 'Book page turn effect with 3D rotateY, transform-origin at left edge, and shadow',
  tags: ['kinetic', 'typography', '3d', 'page', 'turn', 'book', 'perspective'],
  category: 'captions',
  component: PageTurnComponent as any,
  defaultConfig: {
    words: ['ONCE', 'UPON', 'A', 'TIME'],
    colors: ['#7C3AED', '#2563EB', '#DC2626', '#059669'],
    bgColor: '#1a1814',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ONCE', 'UPON', 'A', 'TIME'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#7C3AED', '#2563EB', '#DC2626', '#059669'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1814', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
