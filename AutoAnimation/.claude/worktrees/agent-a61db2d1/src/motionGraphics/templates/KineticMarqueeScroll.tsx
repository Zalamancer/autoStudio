import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MarqueeScrollConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const bulbCount = 40
    const borderThickness = 24

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark theater facade */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #1a0a0a 0%, #0d0505 100%)',
          }}
        />
        {/* Marquee outer frame */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '5%',
            right: '5%',
            height: '60%',
            background: '#2a0a0a',
            border: '3px solid #8B6914',
            borderRadius: 6,
            boxShadow: '0 0 40px rgba(255,180,50,0.15), inset 0 0 20px rgba(0,0,0,0.5)',
          }}
        >
          {/* Top bulb row */}
          <div style={{ position: 'absolute', top: -10, left: 10, right: 10, height: 20, display: 'flex', justifyContent: 'space-around' }}>
            {Array.from({ length: Math.min(bulbCount, 30) }, (_, i) => {
              const on = Math.sin(time * 4 + i * 0.5) > -0.2
              return (
                <div
                  key={`t-${i}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: on ? '#FFE066' : '#553300',
                    boxShadow: on ? '0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.4)' : 'none',
                  }}
                />
              )
            })}
          </div>
          {/* Bottom bulb row */}
          <div style={{ position: 'absolute', bottom: -10, left: 10, right: 10, height: 20, display: 'flex', justifyContent: 'space-around' }}>
            {Array.from({ length: Math.min(bulbCount, 30) }, (_, i) => {
              const on = Math.sin(time * 4 + i * 0.5 + Math.PI) > -0.2
              return (
                <div
                  key={`b-${i}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: on ? '#FFE066' : '#553300',
                    boxShadow: on ? '0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.4)' : 'none',
                  }}
                />
              )
            })}
          </div>
          {/* Left bulb column */}
          <div style={{ position: 'absolute', top: 10, bottom: 10, left: -10, width: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            {Array.from({ length: 10 }, (_, i) => {
              const on = Math.sin(time * 4 + i * 0.7 + 2) > -0.2
              return (
                <div
                  key={`l-${i}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: on ? '#FFE066' : '#553300',
                    boxShadow: on ? '0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.4)' : 'none',
                    alignSelf: 'center',
                  }}
                />
              )
            })}
          </div>
          {/* Right bulb column */}
          <div style={{ position: 'absolute', top: 10, bottom: 10, right: -10, width: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            {Array.from({ length: 10 }, (_, i) => {
              const on = Math.sin(time * 4 + i * 0.7 + 4) > -0.2
              return (
                <div
                  key={`r-${i}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: on ? '#FFE066' : '#553300',
                    boxShadow: on ? '0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.4)' : 'none',
                    alignSelf: 'center',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    let translateX = 0
    let opacity = 1

    if (phase === 'enter') {
      // Scroll in from the right
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      translateX = (1 - eased) * (width * 0.6)
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'hold') {
      translateX = 0
      opacity = 1
    } else {
      // Scroll out to the left
      translateX = -exitProgress * (width * 0.6)
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%)`,
          opacity,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(32px, 9vw, 120px)',
          fontWeight: 900,
          color,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30, 0 2px 4px rgba(0,0,0,0.5)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function MarqueeScrollComponent(props: MotionGraphicProps<MarqueeScrollConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-marquee-scroll',
  title: 'Theater Marquee Scroll',
  description:
    'Classic theater marquee with chasing lightbulb border. Text scrolls in from the right and exits to the left, surrounded by golden flickering bulbs.',
  tags: ['kinetic', 'typography', 'marquee', 'theater', 'broadway', 'bulbs', 'signage', 'scroll'],
  category: 'captions',
  component: MarqueeScrollComponent as any,
  defaultConfig: {
    words: ['NOW PLAYING', 'SOLD OUT', 'TONIGHT', 'OVATION'],
    colors: ['#FFE066', '#FF4444', '#FFE066', '#FFD700'],
    bgColor: '#0d0505',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NOW PLAYING', 'SOLD OUT', 'TONIGHT', 'OVATION'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE066', '#FF4444', '#FFE066', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
