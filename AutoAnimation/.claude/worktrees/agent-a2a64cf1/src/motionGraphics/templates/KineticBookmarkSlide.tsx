import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BookmarkSlideConfig extends KineticBaseConfig {}

// Deterministic bookmark decorations
const BOOKMARKS = Array.from({ length: 6 }).map((_, i) => ({
  x: 8 + i * 16,
  height: 50 + (i % 3) * 15,
  hue: (i * 45 + 20) % 360,
  delay: i * 0.15,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, #1e1610 0%, ${bgColor} 60%, #261c12 100%)`,
        }}
      >
        {/* Book page edge lines */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '3%',
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(245,235,220,0.04) 3px, rgba(245,235,220,0.04) 4px)',
          }}
        />
        {/* Hanging bookmarks in background */}
        {BOOKMARKS.map((bm, i) => {
          const sway = Math.sin(time * 0.7 + i * 1.2) * 3
          const slideDown = Math.sin(time * 0.3 + i) * 2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${bm.x}%`,
                top: 0,
                width: 'clamp(14px, 2.5vw, 24px)',
                height: `${bm.height}%`,
                background: `linear-gradient(180deg, hsla(${bm.hue}, 35%, 35%, 0.2), hsla(${bm.hue}, 35%, 25%, 0.1))`,
                borderRadius: '0 0 2px 2px',
                transform: `rotate(${sway}deg) translateY(${slideDown}px)`,
                transformOrigin: 'top center',
              }}
            >
              {/* Bookmark notch */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 'clamp(6px, 1vw, 10px)',
                  clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                  background: `hsla(${bm.hue}, 35%, 25%, 0.15)`,
                }}
              />
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    holdProgress,
    height: canvasHeight,
  }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scaleX = 1

    if (phase === 'enter') {
      // Bookmark slides down from top
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 2)
      translateY = (1 - eased) * -canvasHeight * 0.5
      scaleX = 0.9 + eased * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle bookmark sway
      translateY = Math.sin(holdProgress * Math.PI * 3) * 3
    } else {
      // Slides back up
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateY = -eased * canvasHeight * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX})`,
          opacity,
        }}
      >
        {/* Bookmark ribbon shape */}
        <div
          style={{
            position: 'absolute',
            inset: '-30% -12%',
            background: `linear-gradient(180deg, ${color}12, ${color}06)`,
            borderRadius: '4px 4px 0 0',
            border: `1px solid ${color}15`,
            borderBottom: 'none',
          }}
        />
        {/* Bookmark V-notch at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '-32%',
            left: '-12%',
            right: '-12%',
            height: 'clamp(8px, 2vw, 18px)',
            clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
            background: `${color}10`,
          }}
        />
        {/* Ribbon line at top */}
        <div
          style={{
            position: 'absolute',
            top: '-32%',
            left: '-12%',
            right: '-12%',
            height: 3,
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Lora', 'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textShadow: '1px 2px 4px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function BookmarkSlideComponent(props: MotionGraphicProps<BookmarkSlideConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bookmark-slide',
  title: 'Kinetic Bookmark Slide',
  description:
    'Text slides in from above like a ribbon bookmark with V-notch bottom, hanging bookmark decorations sway in the background',
  tags: ['kinetic', 'typography', 'bookmark', 'ribbon', 'book', 'reading', 'literary', 'literature'],
  category: 'captions',
  component: BookmarkSlideComponent as any,
  defaultConfig: {
    words: ['MARK', 'YOUR', 'PAGE', 'HERE'],
    colors: ['#B8483F', '#C9A96E', '#7B4B3A', '#A0845C'],
    bgColor: '#140f0a',
    cycleDuration: 1.1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MARK', 'YOUR', 'PAGE', 'HERE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#B8483F', '#C9A96E', '#7B4B3A', '#A0845C'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#140f0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.1,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
