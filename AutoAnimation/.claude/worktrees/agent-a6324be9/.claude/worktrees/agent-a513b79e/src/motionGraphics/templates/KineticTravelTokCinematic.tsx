import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Community: TravelTok Cinematic
// Widescreen cinematic feel. Words drift in from the side like a
// location title card (think documentary/travel vlog). Thin
// GPS coordinate text appears below on hold. Letterbox bars.
// Color grades toward golden hour warmth.

interface TravelTokCinematicConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow parallax gradient shift — golden hour sky
    const angle = 170 + Math.sin(time * 0.2) * 10

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#1a1208'
            ? `linear-gradient(${angle}deg, #1a1208 0%, #2d1f08 50%, #1a1208 100%)`
            : bgColor,
        }}
      >
        {/* Warm golden-hour vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 80%, rgba(200,120,20,0.12) 0%, transparent 55%)',
            pointerEvents: 'none',
          }}
        />
        {/* Cinematic letterbox bars */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '10%',
            background: '#000',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '10%',
            background: '#000',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(enterProgress / 0.3, 1)
      translateX = (1 - eased) * (index % 2 === 0 ? -40 : 40)
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
    } else {
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      translateX = eased * 20
    }

    // Coordinate text appears after hold begins
    const coordOpacity = phase === 'hold'
      ? Math.min(holdProgress * 4, 1) * 0.5
      : phase === 'exit' ? (1 - exitProgress) * 0.5 : 0

    const coords = ['40.7128° N, 74.0060° W', '48.8566° N, 2.3522° E', '35.6762° N, 139.6503° E', '51.5074° N, 0.1278° W']

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px)`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(30px, 7.5vw, 105px)',
            fontWeight: 200,
            letterSpacing: 12,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color,
          }}
        >
          {word}
        </div>
        {/* GPS coordinate sub-text */}
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.8vw, 22px)',
            fontWeight: 400,
            letterSpacing: 2,
            color,
            opacity: coordOpacity,
            whiteSpace: 'nowrap',
          }}
        >
          {coords[index % coords.length]}
        </div>
      </div>
    )
  },
}

function TravelTokCinematicComponent(props: MotionGraphicProps<TravelTokCinematicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-traveltok-cinematic',
  title: 'Kinetic TravelTok Cinematic',
  description: 'TravelTok cinematic aesthetic — location title card drift-in, GPS coordinates reveal, golden-hour letterbox bars',
  tags: ['kinetic', 'typography', 'traveltok', 'cinematic', 'travel', 'location', 'golden-hour', 'community'],
  category: 'captions',
  component: TravelTokCinematicComponent as any,
  defaultConfig: {
    words: ['PARIS', 'TOKYO', 'NEW YORK', 'BALI'],
    colors: ['#e8c87a', '#e8c87a', '#e8c87a', '#e8c87a'],
    bgColor: '#1a1208',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PARIS', 'TOKYO', 'NEW YORK', 'BALI'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8c87a', '#e8c87a', '#e8c87a', '#e8c87a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1208', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
