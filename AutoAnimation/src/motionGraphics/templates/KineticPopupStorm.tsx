import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PopupStormConfig extends KineticBaseConfig {}

function seededVal(seed: number): number {
  const x = Math.sin(seed * 9.301 + 49.45183) * 43758.5453
  return x - Math.floor(x)
}

const POPUP_DATA = [
  { title: 'YOU WON!!!', body: 'Click here to claim your prize!', width: 220, height: 70 },
  { title: 'FREE OFFER', body: 'Limited time — act now!', width: 200, height: 65 },
  { title: 'Warning', body: 'Your computer may be at risk', width: 230, height: 70 },
  { title: 'Congratulations!', body: 'You are our 1,000,000th visitor', width: 240, height: 70 },
  { title: 'Download Now', body: 'Get it FREE — no strings attached', width: 225, height: 65 },
  { title: 'Alert!', body: 'Security threat detected', width: 200, height: 65 },
]

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#008080' }}>
        {/* Cascading popup windows */}
        {POPUP_DATA.map((popup, i) => {
          // Each popup appears at a staggered time, deterministic positions
          const delay = i * 0.18
          const appearTime = time - delay
          if (appearTime < 0) return null

          const scaleProgress = Math.min(1, appearTime / 0.12)
          const scale = 0.3 + scaleProgress * 0.7

          const left = (seededVal(i * 3 + 1) * 0.55 + 0.05) * width
          const top = (seededVal(i * 3 + 2) * 0.55 + 0.08) * height
          const rotation = (seededVal(i * 3 + 3) - 0.5) * 12

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left,
                top,
                width: popup.width * 0.55,
                height: popup.height * 0.55,
                background: '#C0C0C0',
                borderTop: '2px solid #FFFFFF',
                borderLeft: '2px solid #FFFFFF',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'top left',
                opacity: 0.55,
                zIndex: i,
              }}
            >
              {/* Title bar */}
              <div
                style={{
                  height: 13,
                  background: 'linear-gradient(90deg, #000080 0%, #1084D0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: 3,
                  paddingRight: 3,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 7,
                    fontWeight: 700,
                    color: '#FFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {popup.title}
                </span>
                <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 7, color: '#FFF', fontWeight: 700 }}>x</span>
              </div>
              {/* Body */}
              <div
                style={{
                  padding: '3px 4px',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 6,
                  color: '#000',
                  lineHeight: 1.3,
                }}
              >
                {popup.body}
              </div>
            </div>
          )
        })}

        {/* Taskbar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 22,
            background: '#C0C0C0',
            borderTop: '2px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            gap: 4,
          }}
        >
          <div
            style={{
              height: 16,
              paddingLeft: 6,
              paddingRight: 8,
              background: '#C0C0C0',
              borderTop: '2px solid #FFFFFF',
              borderLeft: '2px solid #FFFFFF',
              borderRight: '2px solid #404040',
              borderBottom: '2px solid #404040',
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'Arial, sans-serif',
              fontSize: 9,
              fontWeight: 700,
              color: '#000',
              opacity: 0.7,
            }}
          >
            Start
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Enter: word bursts out from the chaos of popups — scale + fade in
    let scale = 1
    let opacity = 1
    let rotate = 0

    if (phase === 'enter') {
      // Slam in from small, slight overshoot
      const t = enterProgress
      const bounce = t < 0.7 ? t / 0.7 : 1 + Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.08
      scale = bounce
      opacity = Math.min(1, t * 3)
      rotate = (1 - t) * -5
    } else if (phase === 'exit') {
      // Minimize-style: shrink to taskbar bottom
      const t = exitProgress
      scale = 1 - t * 0.9
      opacity = 1 - t * 1.5
    }

    // Subtle shake in hold (like a flashing popup demanding attention)
    const shakeX = phase === 'hold' ? Math.sin(f * 0.4) * 1.5 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${shakeX}px), -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          zIndex: 50,
        }}
      >
        {/* Mini popup chrome around the word */}
        <div
          style={{
            background: '#C0C0C0',
            borderTop: '3px solid #FFFFFF',
            borderLeft: '3px solid #FFFFFF',
            borderRight: '3px solid #404040',
            borderBottom: '3px solid #404040',
            padding: '0 0 6px 0',
          }}
        >
          {/* Title bar */}
          <div
            style={{
              height: 'clamp(14px, 3vw, 26px)',
              background: 'linear-gradient(90deg, #000080 0%, #1084D0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: 6,
              paddingRight: 4,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: 'clamp(8px, 1.5vw, 13px)',
                fontWeight: 700,
                color: '#FFF',
              }}
            >
              Message
            </span>
            <span
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: 'clamp(8px, 1.5vw, 13px)',
                fontWeight: 700,
                padding: '0 4px',
                background: '#C0C0C0',
                borderTop: '1px solid #FFFFFF',
                borderLeft: '1px solid #FFFFFF',
                borderRight: '1px solid #404040',
                borderBottom: '1px solid #404040',
                color: '#000',
              }}
            >
              x
            </span>
          </div>
          {/* Word */}
          <div
            style={{
              paddingLeft: 'clamp(10px, 2.5vw, 24px)',
              paddingRight: 'clamp(10px, 2.5vw, 24px)',
              fontFamily: "'MS Sans Serif', 'Tahoma', Arial, sans-serif",
              fontSize: 'clamp(30px, 8vw, 110px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function PopupStormComponent(props: MotionGraphicProps<PopupStormConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-popup-storm',
  title: 'Kinetic Popup Storm',
  description:
    '90s internet popup cascade — cascading Win95-style dialog boxes rain down as background while the main word emerges framed in its own popup chrome',
  tags: ['kinetic', 'typography', 'popup', '90s', 'windows', 'internet', 'chaos', 'ui', 'digital'],
  category: 'captions',
  component: PopupStormComponent as any,
  defaultConfig: {
    words: ['URGENT', 'FREE', 'CLICK', 'NOW'],
    colors: ['#000080', '#CC0000', '#006600', '#000080'],
    bgColor: '#008080',
    cycleDuration: 2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['URGENT', 'FREE', 'CLICK', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#000080', '#CC0000', '#006600', '#000080'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#008080', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
