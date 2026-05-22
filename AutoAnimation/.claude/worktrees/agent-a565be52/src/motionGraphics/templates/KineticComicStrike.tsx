import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ComicStrikeConfig extends KineticBaseConfig {
  replacementWords: string[]
}

// Comic strike-through: original word slams in, then a thick black line
// scrawls across it dramatically, and a new replacement word pops in beneath.
// The strikethrough IS the transition — the cross-out line is thick, inky, gestural.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const shift = (time * 6) % 14
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Ruled notebook lines — editorial correction feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 27px,
              rgba(0,0,80,0.06) 27px,
              rgba(0,0,80,0.06) 28px
            )`,
            backgroundPosition: `0 ${shift}px`,
          }}
        />
        {/* Subtle halftone */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 41 + 23

    // Phase breakdown within the word cycle:
    // enter 0..1   → original word slams in (0..0.5), strike draws (0.5..1)
    // hold  0..1   → replacement appears (0..0.4), both hold (0.4..1)
    // exit  0..1   → everything fades

    let origOpacity = 0
    let origScale = 1
    let strikeWidth = 0     // 0..1 fraction of text width
    let strikeOpacity = 0
    let replOpacity = 0
    let replScale = 1

    // The strike line draws from left to right
    const strikeColor = '#000000'
    const strikeThickness = 10 + (seed % 4) * 2   // 10–16px thick inky stroke
    const tilt = -3 + (seed % 6) - 2              // slight tilt on strike

    if (phase === 'enter') {
      if (enterProgress < 0.45) {
        // Original word slams in
        const t = enterProgress / 0.45
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        origOpacity = Math.min(1, t * 3)
        origScale = 0.5 + eased * 0.5
        strikeWidth = 0
        strikeOpacity = 0
      } else {
        // Strike scrawls across
        const t = (enterProgress - 0.45) / 0.55
        origOpacity = 1
        origScale = 1
        strikeWidth = t          // line grows left → right
        strikeOpacity = Math.min(1, t * 2)
      }
      replOpacity = 0
    } else if (phase === 'hold') {
      origOpacity = 1
      origScale = 1
      strikeWidth = 1
      strikeOpacity = 1
      if (holdProgress < 0.35) {
        // Replacement pops in
        const t = holdProgress / 0.35
        const bounce = t < 0.7 ? t / 0.7 : 1 + Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.15 * (1 - t)
        replOpacity = Math.min(1, t * 4)
        replScale = 0.6 + bounce * 0.4
      } else {
        replOpacity = 1
        replScale = 1
      }
    } else {
      // Slide the whole assembly off
      origOpacity = Math.max(0, 1 - exitProgress * 2)
      strikeOpacity = Math.max(0, 1 - exitProgress * 2)
      replOpacity = Math.max(0, 1 - exitProgress * 2)
      origScale = 1
      replScale = 1
    }

    const blockWidth = Math.min(width * 0.85, 600)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {/* Original word with strike overlay */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '3px #000000',
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
              whiteSpace: 'nowrap',
              opacity: Math.max(0, origOpacity),
              transform: `scale(${origScale})`,
              transformOrigin: 'center center',
              userSelect: 'none',
              letterSpacing: 2,
            }}
          >
            {word}
          </div>

          {/* Dramatic strikethrough line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: `${strikeWidth * 100}%`,
              height: `${strikeThickness}px`,
              background: strikeColor,
              transform: `translateY(-50%) rotate(${tilt}deg)`,
              transformOrigin: 'left center',
              opacity: strikeOpacity,
              boxShadow: `0 2px 0 rgba(0,0,0,0.3)`,
              borderRadius: '0 3px 3px 0',
            }}
          />

          {/* Second overlapping strike line — makes it look like a fast scrawl */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: `${strikeWidth * 100}%`,
              height: `${Math.floor(strikeThickness * 0.5)}px`,
              background: strikeColor,
              transform: `translateY(calc(-50% + ${strikeThickness * 0.7}px)) rotate(${tilt - 1}deg)`,
              transformOrigin: 'left center',
              opacity: strikeOpacity * 0.7,
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>

        {/* Replacement word — pops in below */}
        <div
          style={{
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            // Replacement uses high-contrast inverted color for drama
            color: '#FFFF00',
            WebkitTextStroke: '4px #000000',
            textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
            whiteSpace: 'nowrap',
            opacity: Math.max(0, replOpacity),
            transform: `scale(${replScale})`,
            transformOrigin: 'center center',
            userSelect: 'none',
            letterSpacing: 4,
          }}
        >
          {/* The replacement is the NEXT word in the sequence */}
          WRONG!
        </div>
      </div>
    )
  },
}

function ComicStrikeComponent(props: MotionGraphicProps<ComicStrikeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-comic-strike',
  title: 'Kinetic Comic Strike',
  description: 'Comic strike-through correction — word slams in, thick inky line scrawls across it dramatically, then replacement pops in — editorial redline meets comic panel energy',
  tags: ['kinetic', 'typography', 'comic', 'strikethrough', 'correction', 'editorial', 'ink', 'cross-out', 'redline'],
  category: 'captions',
  component: ComicStrikeComponent as any,
  defaultConfig: {
    words: ['STOP', 'WRONG', 'FAIL', 'WEAK'],
    colors: ['#FF0000', '#0000FF', '#FF6600', '#CC0099'],
    bgColor: '#FFFDE7',
    cycleDuration: 1.5,
    replacementWords: ['GO!', 'RIGHT!', 'WIN!', 'STRONG!'],
  },
  configSchema: [
    { key: 'words', label: 'Strike Words', type: 'text-array', defaultValue: ['STOP', 'WRONG', 'FAIL', 'WEAK'], group: 'Content' },
    { key: 'colors', label: 'Strike Colors', type: 'text-array', defaultValue: ['#FF0000', '#0000FF', '#FF6600', '#CC0099'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFDE7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.6, max: 6, group: 'Timing' },
  ],
})
