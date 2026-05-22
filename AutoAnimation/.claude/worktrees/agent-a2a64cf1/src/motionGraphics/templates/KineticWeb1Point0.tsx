import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface Web1Point0Config extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Blinking text indicator
    const blink = Math.floor(time * 1.5) % 2 === 0
    // Hit counter slowly incrementing
    const hits = 1337 + Math.floor(time * 0.3)
    const hitsStr = String(hits).padStart(7, '0')

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          fontFamily: "'Times New Roman', Times, serif",
          overflow: 'hidden',
        }}
      >
        {/* Horizontal rule — separator line */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(30px, 8vw, 55px)',
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, #808080 10%, #808080 90%, transparent)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 'clamp(33px, 8.5vw, 58px)',
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #FFFFFF 10%, #FFFFFF 90%, transparent)',
          }}
        />

        {/* Page title / H1 at top */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(4px, 1.5vw, 10px)',
            left: 'clamp(8px, 2vw, 20px)',
            fontFamily: "'Times New Roman', serif",
            fontSize: 'clamp(12px, 3.5vw, 22px)',
            fontWeight: 700,
            color: '#000080',
            textDecoration: 'underline',
          }}
        >
          Welcome to My Web Page!
        </div>

        {/* Bottom horizontal rule */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(30px, 8vw, 55px)',
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, #808080 10%, #808080 90%, transparent)',
          }}
        />

        {/* Hit counter */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(6px, 2vw, 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: "'Times New Roman', serif",
              fontSize: 'clamp(9px, 2vw, 13px)',
              color: '#000080',
            }}
          >
            You are visitor #
          </span>
          {/* Segmented LCD-style counter */}
          <div
            style={{
              display: 'flex',
              border: '1px inset #808080',
              background: '#000040',
              padding: '1px 3px',
              gap: 1,
            }}
          >
            {hitsStr.split('').map((d, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(9px, 2vw, 14px)',
                  color: '#FF6600',
                  fontWeight: 700,
                  minWidth: 'clamp(7px, 1.6vw, 11px)',
                  textAlign: 'center',
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* NEW! Blinking text — early web staple */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(40px, 10vw, 65px)',
            right: 'clamp(8px, 3vw, 24px)',
            fontFamily: "'Times New Roman', serif",
            fontSize: 'clamp(10px, 2.5vw, 16px)',
            color: '#FF0000',
            fontWeight: 700,
            opacity: blink ? 1 : 0,
          }}
        >
          NEW!
        </div>

        {/* Navigation links row */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(38px, 9vw, 60px)',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(6px, 2vw, 16px)',
            padding: '2px 0',
          }}
        >
          {['Home', 'About Me', 'My Pics', 'Links', 'Guestbook'].map((link, i) => (
            <span
              key={i}
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: 'clamp(9px, 2vw, 13px)',
                color: '#0000EE',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              {link}
            </span>
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Web 1.0: text appears in default browser rendering — no animation, just appears
    let opacity = 1
    let translateY = 0

    if (phase === 'enter') {
      // Appears top-to-bottom like a page loading
      opacity = enterProgress
      translateY = (1 - enterProgress) * 15
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      opacity = 1 - exitProgress
    }

    // Blinking cursor-like effect during hold
    const showUnderline = phase === 'hold' && Math.floor(holdProgress * 10) % 3 !== 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* H1 tag indicator */}
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.8vw, 12px)',
            color: '#808080',
            textAlign: 'left',
            marginBottom: 2,
            opacity: 0.7,
          }}
        >
          &lt;h1&gt;
        </div>
        {/* Main text — Times New Roman, dark blue H1 like real browsers */}
        <div
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 'clamp(36px, 11vw, 140px)',
            fontWeight: 700,
            color: '#000080',
            whiteSpace: 'nowrap',
            textDecoration: showUnderline ? 'underline' : 'none',
            textDecorationColor: '#0000EE',
          }}
        >
          {word}
        </div>
        {/* Closing tag */}
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.8vw, 12px)',
            color: '#808080',
            textAlign: 'right',
            marginTop: 2,
            opacity: 0.7,
          }}
        >
          &lt;/h1&gt;
        </div>
        {/* Blue underline link style */}
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Times New Roman', serif",
            fontSize: 'clamp(9px, 2vw, 14px)',
            color: '#0000EE',
            textDecoration: 'underline',
            whiteSpace: 'nowrap',
            opacity: phase === 'hold' ? 0.8 : 0,
          }}
        >
          Click here to learn more!
        </div>
      </div>
    )
  },
}

function Web1Point0Component(props: MotionGraphicProps<Web1Point0Config>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-web-1-point-0',
  title: 'Kinetic Web 1.0',
  description:
    'Early web 1.0 aesthetic: Times New Roman H1 tags, gray background, blue links, hit counter, horizontal rules, and blinking NEW! text',
  tags: [
    'kinetic',
    'typography',
    'web1.0',
    'html',
    'times-new-roman',
    'nostalgia',
    '90s',
    'internet',
    'geocities',
    'retro',
  ],
  category: 'captions',
  component: Web1Point0Component as any,
  defaultConfig: {
    words: ['WELCOME', 'UNDER CONSTRUCTION', 'CLICK HERE', 'HOME PAGE'],
    colors: ['#000080', '#000080', '#0000EE', '#000080'],
    bgColor: '#C0C0C0',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WELCOME', 'UNDER CONSTRUCTION', 'CLICK HERE', 'HOME PAGE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#000080', '#000080', '#0000EE', '#000080'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C0C0C0', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 6,
      group: 'Timing',
    },
  ],
})
