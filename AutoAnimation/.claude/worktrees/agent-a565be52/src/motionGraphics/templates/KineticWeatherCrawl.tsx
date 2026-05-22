import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeatherCrawlConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dramatic weather gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
            opacity: 0.7,
          }}
        />

        {/* Bottom warning crawl bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '18%',
            background: 'linear-gradient(180deg, #D4A800, #B8960A)',
            borderTop: '3px solid #FFD700',
          }}
        >
          {/* Scrolling alert text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(9px, 2.2vw, 15px)',
              fontWeight: 900,
              color: '#1a1a1a',
              letterSpacing: 1,
              left: `${width - ((frame * 1.8) % (width * 4))}px`,
            }}
          >
            &#x26A0; SEVERE WEATHER WARNING &#x2022; TORNADO WATCH IN EFFECT &#x2022; SEEK SHELTER IMMEDIATELY &#x2022; FLASH FLOOD ADVISORY &#x2022; HIGH WIND WARNING &#x2022; SEVERE WEATHER WARNING &#x2022; TORNADO WATCH IN EFFECT
          </div>
        </div>

        {/* Top bar: location and timestamp */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '12%',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4%',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: 'clamp(8px, 1.8vw, 13px)',
              fontWeight: 700,
              color: '#FFD700',
              letterSpacing: 1,
            }}
          >
            WEATHER ALERT
          </span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(7px, 1.5vw, 11px)',
              color: '#AAAAAA',
            }}
          >
            {Math.floor(time) % 24}:{String(Math.floor((time * 10) % 60)).padStart(2, '0')} CST
          </span>
        </div>

        {/* Pulsing warning triangle */}
        <div
          style={{
            position: 'absolute',
            top: '16%',
            left: '4%',
            fontSize: 'clamp(16px, 4vw, 36px)',
            opacity: 0.5 + Math.sin(time * 4) * 0.5,
          }}
        >
          &#x26A0;
        </div>

        {/* Temperature readout */}
        <div
          style={{
            position: 'absolute',
            bottom: '22%',
            right: '4%',
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 'clamp(14px, 4vw, 32px)',
            fontWeight: 900,
            color: '#FFD700',
            opacity: 0.4,
          }}
        >
          {Math.floor(72 + Math.sin(time * 0.3) * 5)}&deg;F
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Drop down from top with urgency
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      translateY = -height * 0.3 * (1 - eased)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.8 + eased * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      // Slight horizontal shake for urgency
      translateY = Math.sin(Date.now() * 0.01) * 1.5
    } else {
      // Fade down and shrink
      opacity = 1 - exitProgress
      translateY = height * 0.15 * exitProgress
      scale = 1 - exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(28px, 9vw, 110px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 30px rgba(255,215,0,0.2)',
            lineHeight: 1.1,
          }}
        >
          {word}
        </div>
        {/* Severity bar below text */}
        <div
          style={{
            marginTop: 8,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #FFD700, #FF8C00, #FFD700, transparent)',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },
}

function WeatherCrawlComponent(props: MotionGraphicProps<WeatherCrawlConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-weather-crawl',
  title: 'Weather Crawl',
  description: 'Weather channel alert bar with yellow warning crawl, temperature readout, pulsing warning triangle, and urgent drop-in text',
  tags: ['kinetic', 'typography', 'broadcast', 'weather', 'alert', 'warning', 'crawl', 'television'],
  category: 'captions',
  component: WeatherCrawlComponent as any,
  defaultConfig: {
    words: ['TORNADO', 'WARNING', 'SEVERE', 'ALERT'],
    colors: ['#FFD700', '#FF8C00', '#FFD700', '#FF4444'],
    bgColor: '#0a0e1a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TORNADO', 'WARNING', 'SEVERE', 'ALERT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF8C00', '#FFD700', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
