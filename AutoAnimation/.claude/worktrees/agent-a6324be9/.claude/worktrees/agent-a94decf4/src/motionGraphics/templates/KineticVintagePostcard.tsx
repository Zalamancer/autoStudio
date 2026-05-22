import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VintagePostcardConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Aged paper texture */}
        <div
          style={{
            position: 'absolute',
            inset: '6%',
            background: 'linear-gradient(135deg, #F5E6CC 0%, #EDD9B5 30%, #E8D1A8 60%, #F0DFC0 100%)',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 0 30px rgba(160,120,60,0.1)',
          }}
        >
          {/* Worn edge effect — darker borders */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 0 0 15px rgba(120,80,30,0.15), inset 0 0 40px rgba(80,50,20,0.08)',
              borderRadius: 4,
              pointerEvents: 'none',
            }}
          />
          {/* Decorative border — postcard frame */}
          <div
            style={{
              position: 'absolute',
              inset: 'clamp(10px, 2.5%, 20px)',
              border: '2px solid #C4A06A',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />
          {/* Inner decorative border */}
          <div
            style={{
              position: 'absolute',
              inset: 'clamp(14px, 3.5%, 28px)',
              border: '1px solid #D4B07A40',
              pointerEvents: 'none',
            }}
          />
          {/* Stamp area — top right */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(16px, 4%, 30px)',
              right: 'clamp(16px, 4%, 30px)',
              width: 'clamp(50px, 12%, 80px)',
              height: 'clamp(60px, 14%, 95px)',
              border: '2px dashed #B8956050',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6,
            }}
          >
            {/* Stamp interior circle */}
            <div
              style={{
                width: '60%',
                height: '50%',
                borderRadius: '50%',
                border: '1px solid #B89560',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(8px, 1.5vw, 12px)',
                color: '#8B6F47',
                fontFamily: "'Georgia', serif",
                fontWeight: 700,
              }}
            >
              5c
            </div>
          </div>
          {/* Postmark circle — overlapping stamp */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(8px, 2%, 20px)',
              right: 'clamp(8px, 2%, 20px)',
              width: 'clamp(70px, 16%, 110px)',
              height: 'clamp(70px, 16%, 110px)',
              borderRadius: '50%',
              border: '2px solid rgba(139,111,71,0.25)',
              transform: `rotate(${-15 + Math.sin(time * 0.3) * 2}deg)`,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 'clamp(6px, 1.2vw, 9px)',
                color: 'rgba(139,111,71,0.3)',
                fontFamily: "'Courier New', monospace",
                textAlign: 'center',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              1952
            </div>
          </div>
          {/* Age spots */}
          {Array.from({ length: 4 }, (_, i) => {
            const sx = 20 + ((i * 31) % 60)
            const sy = 30 + ((i * 23) % 40)
            return (
              <div
                key={`spot-${i}`}
                style={{
                  position: 'absolute',
                  left: `${sx}%`,
                  top: `${sy}%`,
                  width: 'clamp(15px, 3vw, 30px)',
                  height: 'clamp(15px, 3vw, 30px)',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(160,120,60,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 41 + 13
    let opacity = 0
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      // Stamp press effect — scale down with bounce
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      scale = enterProgress < 0.5 ? 1.8 - eased * 0.8 : 1 + Math.sin((enterProgress - 0.5) * Math.PI * 2) * 0.05
      rotate = (1 - eased) * (seed % 2 === 0 ? -8 : 8)
    } else if (phase === 'hold') {
      opacity = 1
      rotate = Math.sin(f * 0.03 + seed) * 0.5
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.2
      rotate = exitProgress * (seed % 2 === 0 ? 5 : -5)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontFamily: "'Georgia', 'Playfair Display', serif",
          fontSize: 'clamp(36px, 10vw, 130px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 8,
          textTransform: 'uppercase',
          textShadow: '1px 1px 0 rgba(139,111,71,0.2)',
        }}
      >
        {word}
      </div>
    )
  },
}

function VintagePostcardComponent(props: MotionGraphicProps<VintagePostcardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vintage-postcard',
  title: 'Kinetic Vintage Postcard',
  description: 'Postcard stamp typography on aged paper with decorative borders, postmark, stamp area, and press-down text animation',
  tags: ['kinetic', 'typography', 'vintage', 'postcard', 'retro', 'stamp', 'paper', 'mail', 'aged'],
  category: 'captions',
  component: VintagePostcardComponent as any,
  defaultConfig: {
    words: ['GREETINGS', 'WISH', 'HERE', 'LOVE'],
    colors: ['#6B4423', '#8B5E3C', '#7A4E2D', '#6B4423'],
    bgColor: '#3E2723',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GREETINGS', 'WISH', 'HERE', 'LOVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6B4423', '#8B5E3C', '#7A4E2D', '#6B4423'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3E2723', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
