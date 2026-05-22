import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GeoCitiesConfig extends KineticBaseConfig {}

// GeoCities rainbow colors — all 7 cycle positions
const RAINBOW = ['#FF0000', '#FF7700', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF', '#FF00FF']

// Tiled star background — deterministic positions
const BG_STARS = Array.from({ length: 25 }, (_, i) => ({
  x: ((i * 37 + 11) % 97) + 1.5,
  y: ((i * 53 + 19) % 93) + 3.5,
  color: RAINBOW[i % RAINBOW.length],
}))

// "Under construction" bar stripes count
const STRIPE_COUNT = 20

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Marquee offset — scrolling right to left
    const marqueeOffset = -(time * 60) % 400

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          overflow: 'hidden',
          fontFamily: "'Times New Roman', Times, serif",
        }}
      >
        {/* Tiled stars — like GeoCities animated GIF backgrounds */}
        {BG_STARS.map((star, i) => {
          const twinkle = (Math.sin(time * 2.5 + i * 1.3) + 1) / 2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                fontSize: 'clamp(8px, 2vw, 14px)',
                color: star.color,
                opacity: 0.4 + twinkle * 0.5,
                transform: `scale(${0.7 + twinkle * 0.6})`,
                userSelect: 'none',
              }}
            >
              ★
            </div>
          )
        })}

        {/* Construction stripes bar at bottom — classic "under construction" */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 'clamp(12px, 3vw, 22px)',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {Array.from({ length: STRIPE_COUNT }, (_, i) => (
            <div
              key={i}
              style={{
                flex: '0 0 5%',
                background: i % 2 === 0 ? '#FFFF00' : '#000000',
              }}
            />
          ))}
        </div>

        {/* Scrolling rainbow marquee text at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'clamp(16px, 4vw, 28px)',
            background: '#000000',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              whiteSpace: 'nowrap',
              left: marqueeOffset,
              fontFamily: "'Times New Roman', serif",
              fontSize: 'clamp(10px, 2.5vw, 18px)',
              display: 'flex',
            }}
          >
            {[
              'W',
              'E',
              'L',
              'C',
              'O',
              'M',
              'E',
              ' ',
              'T',
              'O',
              ' ',
              'M',
              'Y',
              ' ',
              'H',
              'O',
              'M',
              'E',
              'P',
              'A',
              'G',
              'E',
              ' ',
              '★',
              ' ',
            ]
              .concat([
                'P',
                'L',
                'E',
                'A',
                'S',
                'E',
                ' ',
                'S',
                'I',
                'G',
                'N',
                ' ',
                'M',
                'Y',
                ' ',
                'G',
                'U',
                'E',
                'S',
                'T',
                'B',
                'O',
                'O',
                'K',
                ' ',
                '★',
                ' ',
              ])
              .map((ch, i) => (
                <span key={i} style={{ color: RAINBOW[i % RAINBOW.length] }}>
                  {ch}
                </span>
              ))}
          </div>
        </div>

        {/* Visitor counter badge — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(18px, 4vw, 30px)',
            right: 'clamp(6px, 2vw, 16px)',
            background: '#000080',
            border: '2px inset #808080',
            padding: '2px 6px',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.8vw, 13px)',
            color: '#00FF00',
            letterSpacing: 1,
          }}
        >
          visitors: 000{(Math.floor(time * 3) % 100) + 1337}
        </div>
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Enter: rainbow letters fly in from left like marquee
    let opacity = 1
    let translateX = 0
    let translateY = 0

    if (phase === 'enter') {
      // Slide in from left — marquee style
      translateX = (1 - enterProgress) * -120
      opacity = enterProgress
    } else if (phase === 'hold') {
      // Blink effect — classic HTML blink tag
      const blinkCycle = Math.floor(holdProgress * 8)
      opacity = blinkCycle % 2 === 0 ? 1 : 0.85
      // Slight bob
      translateY = Math.sin(holdProgress * Math.PI * 4) * 3
    } else {
      // Scroll off to right
      translateX = exitProgress * 120
      opacity = 1 - exitProgress
    }

    // Rainbow gradient across letters
    const rainbowGrad = `linear-gradient(90deg, ${RAINBOW.join(', ')})`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Shadow / outline — GeoCities loved beveled text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 'clamp(40px, 12vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            color: '#000000',
            transform: 'translate(3px, 3px)',
            opacity: 0.6,
          }}
        >
          {word}
        </div>
        {/* Main text with rainbow gradient */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 'clamp(40px, 12vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            background: rainbowGrad,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.8))',
          }}
        >
          {word}
        </div>
        {/* Under-text web ring link style */}
        <div
          style={{
            position: 'absolute',
            bottom: -24,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Times New Roman', serif",
            fontSize: 'clamp(9px, 2vw, 14px)',
            color: '#FFFF00',
            whiteSpace: 'nowrap',
            textDecoration: 'underline',
            opacity: phase === 'hold' ? 0.9 : phase === 'enter' ? enterProgress : 1 - exitProgress,
          }}
        >
          [click here to enter]
        </div>
      </div>
    )
  },
}

function GeoCitiesComponent(props: MotionGraphicProps<GeoCitiesConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-geo-cities',
  title: 'Kinetic GeoCities',
  description:
    'GeoCities era web: rainbow marquee text, twinkling stars, construction stripes, visitor counter, and blinking Times New Roman',
  tags: ['kinetic', 'typography', 'geocities', 'web1.0', 'rainbow', 'marquee', 'nostalgia', '90s', 'internet'],
  category: 'captions',
  component: GeoCitiesComponent as any,
  defaultConfig: {
    words: ['WELCOME', 'SIGN MY', 'GUESTBOOK', 'CLICK HERE'],
    colors: ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF'],
    bgColor: '#000080',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WELCOME', 'SIGN MY', 'GUESTBOOK', 'CLICK HERE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000080', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
