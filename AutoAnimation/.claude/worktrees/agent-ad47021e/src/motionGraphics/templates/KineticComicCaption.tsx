import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ComicCaptionConfig extends KineticBaseConfig {}

// Comic narration caption box — yellow rectangle in corner with typewriter text
// Like "MEANWHILE..." or "THE NEXT DAY..." boxes in classic comics
// Box slides in from left, text typewriters in, box slides out

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle animated crosshatch — old comic printing feel
    const shift = (time * 4) % 12
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Crosshatch texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent 0px,
                transparent 10px,
                rgba(0,0,0,0.03) 10px,
                rgba(0,0,0,0.03) 11px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent 0px,
                transparent 10px,
                rgba(0,0,0,0.03) 10px,
                rgba(0,0,0,0.03) 11px
              )
            `,
            backgroundPosition: `${shift}px ${shift}px`,
          }}
        />
        {/* Ben-Day dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.04) 1.5px, transparent 1.5px)',
            backgroundSize: '12px 12px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 31 + 17

    let slideX = 0
    let opacity = 1
    // Typewriter reveal: number of visible characters
    let visibleChars = word.length

    if (phase === 'enter') {
      // Box slides in from left
      const slideT = Math.min(1, enterProgress / 0.35)
      const eased = slideT < 0.5 ? 2 * slideT * slideT : 1 - Math.pow(-2 * slideT + 2, 2) / 2
      slideX = -(width * 0.6) * (1 - eased)
      opacity = Math.min(1, enterProgress * 4)
      // Typewriter starts after box arrives
      const typeT = Math.max(0, (enterProgress - 0.3) / 0.7)
      visibleChars = Math.ceil(typeT * word.length)
    } else if (phase === 'hold') {
      slideX = 0
      opacity = 1
      visibleChars = word.length
    } else {
      // Slide out to the right
      const outT = exitProgress
      const eased = outT * outT
      slideX = width * 0.65 * eased
      opacity = 1 - exitProgress * 1.5
      visibleChars = word.length
    }

    // Caption box dimensions
    const boxH = 52
    const boxPadW = 24
    const boxPadH = 10
    const textStr = word.substring(0, visibleChars)

    // Corner position: top-left, slight inset
    // The box is positioned near top-left of the frame
    const cornerVariants = [
      { top: '8%', left: '4%' },
      { top: '8%', right: '4%' },
      { bottom: '8%', left: '4%' },
      { bottom: '8%', right: '4%' },
    ]
    const corner = cornerVariants[seed % cornerVariants.length]

    return (
      <div
        style={{
          position: 'absolute',
          ...corner,
          transform: `translateX(${slideX}px)`,
          opacity: Math.max(0, opacity),
        }}
      >
        {/* Yellow caption box with black border */}
        <div
          style={{
            background: '#FFEE00',
            border: '3px solid #000000',
            boxShadow: '3px 3px 0 #000000',
            padding: `${boxPadH}px ${boxPadW}px`,
            display: 'inline-block',
            position: 'relative',
          }}
        >
          {/* Halftone on box */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '5px 5px',
              pointerEvents: 'none',
            }}
          />
          {/* Caption text — typewriter style */}
          <div
            style={{
              position: 'relative',
              fontFamily: "'Courier New', 'Courier', monospace",
              fontSize: 'clamp(14px, 3vw, 42px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#000000',
              letterSpacing: 1.5,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {textStr}
            {/* Typewriter cursor blink during enter */}
            {phase === 'enter' && visibleChars < word.length && (
              <span
                style={{
                  display: 'inline-block',
                  width: '0.5em',
                  height: '1em',
                  background: '#000000',
                  verticalAlign: 'text-bottom',
                  marginLeft: 2,
                }}
              />
            )}
          </div>
        </div>

        {/* Bold label strip above — "CAPTION" header like narration boxes */}
        <div
          style={{
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            background: color,
            border: '3px solid #000000',
            borderBottom: 'none',
            padding: '1px 8px',
            fontSize: 'clamp(9px, 1.5vw, 18px)',
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontWeight: 900,
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: 1,
            transform: 'translateY(-100%)',
            whiteSpace: 'nowrap',
          }}
        >
          NARRATOR
        </div>
      </div>
    )
  },
}

function ComicCaptionComponent(props: MotionGraphicProps<ComicCaptionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-comic-caption',
  title: 'Kinetic Comic Caption',
  description: 'Narration caption box slides in from left, text typewriters in character by character — classic yellow comic narration box with NARRATOR label header',
  tags: ['kinetic', 'typography', 'comic', 'caption', 'narration', 'typewriter', 'yellow-box', 'meanwhile', 'narrator'],
  category: 'captions',
  component: ComicCaptionComponent as any,
  defaultConfig: {
    words: ['MEANWHILE...', 'LATER...', 'SUDDENLY!', 'THE NEXT DAY...'],
    colors: ['#FF0000', '#0000FF', '#FF6600', '#009900'],
    bgColor: '#E8D5A3',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MEANWHILE...', 'LATER...', 'SUDDENLY!', 'THE NEXT DAY...'], group: 'Content' },
    { key: 'colors', label: 'Label Colors', type: 'text-array', defaultValue: ['#FF0000', '#0000FF', '#FF6600', '#009900'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8D5A3', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 6, group: 'Timing' },
  ],
})
