import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TickerTapeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const machineW = Math.min(width * 0.5, 280)
    const machineH = Math.min(height * 0.55, 320)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Warm office / trading floor ambience */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, #3a3020 0%, #1a1508 80%)',
          }}
        />
        {/* Ticker machine body — right side */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '8%',
            width: machineW,
            height: machineH,
          }}
        >
          {/* Glass dome */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              width: '80%',
              height: '60%',
              borderRadius: '50% 50% 10% 10%',
              background: 'linear-gradient(180deg, rgba(200,190,160,0.12), rgba(200,190,160,0.05))',
              border: '2px solid rgba(180,160,120,0.3)',
              boxShadow: 'inset 0 0 20px rgba(255,230,180,0.05)',
            }}
          />
          {/* Machine mechanism (visible through dome) */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '25%',
              width: '50%',
              height: '35%',
              background: 'linear-gradient(180deg, #8B7355, #6B5335)',
              borderRadius: 4,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {/* Gear wheels */}
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: '15%',
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px solid #A08060',
                transform: `rotate(${time * 90}deg)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '30%',
                right: '20%',
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid #A08060',
                transform: `rotate(${-time * 120}deg)`,
              }}
            />
          </div>
          {/* Base pedestal */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '5%',
              width: '90%',
              height: '35%',
              background: 'linear-gradient(180deg, #5a4430, #4a3620, #3a2810)',
              borderRadius: '4px 4px 8px 8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          />
          {/* Tape exit slot */}
          <div
            style={{
              position: 'absolute',
              top: '52%',
              left: '-5%',
              width: 20,
              height: 8,
              background: '#2a1a0a',
              borderRadius: 2,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, frame }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const f = frame ?? 0
    let opacity = 1
    let tapeExtend = 1

    if (phase === 'enter') {
      tapeExtend = enterProgress
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      tapeExtend = 1
    } else {
      opacity = 1 - exitProgress
      tapeExtend = 1
    }

    // Tape curls down slightly under gravity
    const tapeWidth = Math.min(width * 0.55, 500)
    const visibleChars = Math.floor(tapeExtend * chars.length)

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '10%',
          opacity,
        }}
      >
        {/* Paper tape strip */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(180deg, #f5f0d8, #e8e0c8, #f0ebd0)',
            height: 'clamp(36px, 8vw, 80px)',
            paddingLeft: 8,
            paddingRight: 12,
            borderRadius: '2px 4px 4px 2px',
            boxShadow: '0 3px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
            // Tape sags slightly at the end
            transform: `rotate(${tapeExtend > 0.5 ? (tapeExtend - 0.5) * 4 : 0}deg)`,
            transformOrigin: 'left center',
          }}
        >
          {/* Perforation holes along top and bottom edges */}
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: 0,
              right: 0,
              height: 4,
              display: 'flex',
              gap: 10,
              paddingLeft: 6,
            }}
          >
            {Array.from({ length: Math.min(20, Math.ceil(tapeWidth / 20)) }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </div>
          {/* Printed characters */}
          <div style={{ display: 'flex', gap: 1 }}>
            {chars.map((char, ci) => {
              const visible = ci < visibleChars
              // Typewriter strike effect — slight stamp impression
              const strikeProgress = visible
                ? Math.min(1, (tapeExtend * chars.length - ci) / 1)
                : 0

              return (
                <span
                  key={ci}
                  style={{
                    fontFamily: "'Courier New', 'Consolas', monospace",
                    fontSize: 'clamp(18px, 5vw, 52px)',
                    fontWeight: 700,
                    color: visible ? color : 'transparent',
                    opacity: strikeProgress,
                    transform: `scale(${0.8 + strikeProgress * 0.2})`,
                    letterSpacing: 1,
                    // Ink impression — slightly uneven
                    textShadow: visible ? '0 0 0.5px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {char}
                </span>
              )
            })}
          </div>
          {/* Torn/perforated right edge */}
          <div
            style={{
              position: 'absolute',
              right: -4,
              top: 0,
              bottom: 0,
              width: 6,
              background: 'linear-gradient(90deg, #f0ebd0, transparent)',
              clipPath: 'polygon(0 0, 100% 5%, 60% 15%, 100% 25%, 50% 35%, 100% 45%, 40% 55%, 100% 65%, 60% 75%, 100% 85%, 50% 95%, 0 100%)',
            }}
          />
        </div>
        {/* Ticker symbol dots (decorative) */}
        <div
          style={{
            marginTop: 4,
            display: 'flex',
            gap: 6,
            paddingLeft: 4,
          }}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'monospace',
                fontSize: 10,
                color: 'rgba(255,220,150,0.3)',
                letterSpacing: 2,
              }}
            >
              {['***', '---', '...'][i]}
            </span>
          ))}
        </div>
      </div>
    )
  },
}

function TickerTapeComponent(props: MotionGraphicProps<TickerTapeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ticker-tape',
  title: 'Stock Ticker Tape',
  description:
    'Old stock ticker tape machine printing text character by character onto a paper strip. Features a glass-dome machine, gear mechanism, perforated paper tape with torn edge.',
  tags: ['kinetic', 'typography', 'ticker', 'tape', 'stock', 'vintage', 'print', 'signage', 'financial'],
  category: 'captions',
  component: TickerTapeComponent as any,
  defaultConfig: {
    words: ['BUY', 'SELL', 'HOLD', 'RALLY'],
    colors: ['#1a1a0a', '#8B0000', '#1a1a0a', '#006400'],
    bgColor: '#1a1508',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BUY', 'SELL', 'HOLD', 'RALLY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a0a', '#8B0000', '#1a1a0a', '#006400'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1508', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
