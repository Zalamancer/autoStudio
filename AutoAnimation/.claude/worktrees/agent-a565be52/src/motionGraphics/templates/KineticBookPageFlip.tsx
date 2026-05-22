import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BookPageFlipConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    // Book open background with left/right pages
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Left page */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            bottom: '8%',
            left: '5%',
            right: '52%',
            background: '#FFF9F0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1), inset -2px 0 6px rgba(0,0,0,0.05)',
            borderRadius: '2px 0 0 2px',
          }}
        >
          {/* Page lines */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${15 + i * 10}%`,
                left: '10%',
                right: '10%',
                height: 1,
                background: 'rgba(0,0,0,0.08)',
              }}
            />
          ))}
        </div>
        {/* Right page */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            bottom: '8%',
            left: '52%',
            right: '5%',
            background: '#FFFEF8',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.08), inset 2px 0 6px rgba(0,0,0,0.05)',
            borderRadius: '0 2px 2px 0',
          }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${15 + i * 10}%`,
                left: '10%',
                right: '10%',
                height: 1,
                background: 'rgba(0,0,0,0.06)',
              }}
            />
          ))}
        </div>
        {/* Spine shadow */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            bottom: '8%',
            left: '50%',
            width: 4,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.05), rgba(0,0,0,0.15))',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 83 + 17

    if (phase === 'enter') {
      // Page flip reveal: text appears as if a page is being turned from left
      // Simulate with perspective rotateY: left edge comes forward, right edge swings in
      const flipAngle = (1 - enterProgress) * -80   // -80° → 0°
      const opacity = Math.min(1, enterProgress * 3)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`,
            opacity,
            perspective: 800,
          }}
        >
          <div
            style={{
              transform: `rotateY(${flipAngle}deg)`,
              transformOrigin: '0% 50%',
              fontFamily: "'Georgia', 'Palatino Linotype', serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: 4,
              color,
              textShadow: `0 2px 6px rgba(0,0,0,0.15)`,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      const bobY = Math.sin(holdProgress * Math.PI * 2 + seed) * 2

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${bobY}px))`,
            opacity: 1,
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 4,
            color,
            textShadow: `0 2px 6px rgba(0,0,0,0.15)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: page flips away to the right
    const flipAngle = exitProgress * 80   // 0° → 80°
    const opacity = 1 - exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          opacity,
          perspective: 800,
        }}
      >
        <div
          style={{
            transform: `rotateY(${flipAngle}deg)`,
            transformOrigin: '100% 50%',
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 4,
            color,
            textShadow: `0 2px 6px rgba(0,0,0,0.15)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function BookPageFlipComponent(props: MotionGraphicProps<BookPageFlipConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-book-page-flip',
  title: 'Kinetic Book Page Flip',
  description: 'Text appears on an open book background with CSS 3D page-flip transitions on entry and exit',
  tags: ['kinetic', 'typography', 'book', 'page', 'flip', 'paper', '3d', 'literature'],
  category: 'captions',
  component: BookPageFlipComponent as any,
  defaultConfig: {
    words: ['CHAPTER', 'ONE', 'THE', 'BEGINNING'],
    colors: ['#4A3728', '#5D3A1A', '#2C1810', '#3D2B1F'],
    bgColor: '#D4C4A0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHAPTER', 'ONE', 'THE', 'BEGINNING'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4A3728', '#5D3A1A', '#2C1810', '#3D2B1F'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#D4C4A0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
