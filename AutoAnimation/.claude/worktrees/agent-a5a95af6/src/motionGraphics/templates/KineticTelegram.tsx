import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TelegramConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const paperW = Math.min(width * 0.85, height * 0.7)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Telegram paper — goldenrod yellow */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: paperW,
            bottom: '10%',
            background: 'linear-gradient(180deg, #f5d96a 0%, #eece50 40%, #e8c63e 100%)',
            boxShadow: '3px 4px 12px rgba(0,0,0,0.2)',
            borderRadius: 2,
          }}
        >
          {/* Paper texture — aged grain */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.015) 4px, rgba(0,0,0,0.015) 5px)',
              borderRadius: 2,
            }}
          />

          {/* Western Union header band */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 50,
              background: 'linear-gradient(180deg, #c4960a 0%, #d4a818 100%)',
              borderRadius: '2px 2px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: Math.min(16, paperW * 0.04),
                fontWeight: 700,
                color: '#3a2800',
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}
            >
              WESTERN UNION TELEGRAM
            </div>
          </div>

          {/* Horizontal ruled lines */}
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`rule-${i}`}
              style={{
                position: 'absolute',
                top: 70 + i * 26,
                left: '6%',
                right: '6%',
                height: 1,
                background: 'rgba(120,90,20,0.12)',
              }}
            />
          ))}

          {/* Date / Time header fields */}
          <div
            style={{
              position: 'absolute',
              top: 56,
              left: '6%',
              right: '6%',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: 'rgba(80,60,10,0.35)',
            }}
          >
            <span>DATE: MAR 19 2026</span>
            <span>TIME: 12:00</span>
            <span>CLASS: URGENT</span>
          </div>

          {/* Bottom stamp area */}
          <div
            style={{
              position: 'absolute',
              bottom: 15,
              right: '6%',
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: 'rgba(80,60,10,0.2)',
              letterSpacing: 1,
            }}
          >
            NO. 48291 — COLLECT
          </div>
        </div>

        {/* Urgency indicator — blinking */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            right: '8%',
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            fontWeight: 700,
            color: '#cc3300',
            opacity: Math.sin(time * 6) > 0 ? 0.8 : 0.3,
            letterSpacing: 2,
          }}
        >
          URGENT
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0

    // Telegram text is always ALL CAPS with STOP formatting
    const telegramWord = word.toUpperCase()

    let opacity = 0
    let charReveal = 0
    let tickerJitter = 0

    if (phase === 'enter') {
      // Ticker tape printing — characters appear one by one with mechanical jitter
      charReveal = Math.floor(enterProgress * (telegramWord.length + 1))
      opacity = Math.min(1, enterProgress * 2.5)
      tickerJitter = (1 - enterProgress) * 2
    } else if (phase === 'hold') {
      charReveal = telegramWord.length
      opacity = 1
      tickerJitter = 0
    } else {
      charReveal = telegramWord.length
      opacity = 1 - exitProgress
      tickerJitter = exitProgress * 1.5
    }

    const displayChars = telegramWord.split('').map((ch, ci) => {
      if (ci >= charReveal) return null
      const jitterY = ci === charReveal - 1 ? Math.sin(f * 0.5) * tickerJitter : 0
      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${jitterY}px)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          zIndex: 10,
        }}
      >
        {/* Main telegram word */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(26px, 7vw, 76px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            textTransform: 'uppercase',
            textShadow: '0 1px 0 rgba(0,0,0,0.06)',
          }}
        >
          {displayChars}
        </div>

        {/* STOP marker below */}
        {phase !== 'enter' && (
          <div
            style={{
              textAlign: 'center',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(10px, 2vw, 18px)',
              fontWeight: 700,
              color: 'rgba(80,60,10,0.4)',
              letterSpacing: 6,
              marginTop: 8,
              opacity: phase === 'hold' ? 1 : 1 - exitProgress,
            }}
          >
            — STOP —
          </div>
        )}
      </div>
    )
  },
}

function TelegramComponent(props: MotionGraphicProps<TelegramConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-telegram',
  title: 'Kinetic Telegram',
  description:
    'Western Union telegram on yellow paper with ALL CAPS text typed by ticker, STOP markers, urgent header band, and mechanical character jitter.',
  tags: ['kinetic', 'typography', 'telegram', 'western-union', 'vintage', 'urgent', 'paper', 'message'],
  category: 'captions',
  component: TelegramComponent as any,
  defaultConfig: {
    words: ['SEND', 'WIRE', 'STOP', 'URGENT'],
    colors: ['#2a1800', '#2a1800', '#2a1800', '#2a1800'],
    bgColor: '#3a3428',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SEND', 'WIRE', 'STOP', 'URGENT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a1800', '#2a1800', '#2a1800', '#2a1800'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3a3428', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
