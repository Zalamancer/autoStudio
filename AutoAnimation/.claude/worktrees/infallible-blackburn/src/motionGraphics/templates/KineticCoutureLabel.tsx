import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CoutureLabelConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Woven textile texture via repeating thin lines
    const lineSpacing = 14
    const lineCount = Math.ceil(Math.max(width, height) / lineSpacing) + 2
    const weaveShift = Math.sin(time * 0.5) * 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal weave lines */}
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: i * lineSpacing + weaveShift,
              left: 0,
              right: 0,
              height: 0.5,
              background: 'rgba(255,255,255,0.025)',
            }}
          />
        ))}
        {/* Vertical weave lines */}
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: i * lineSpacing - weaveShift,
              top: 0,
              bottom: 0,
              width: 0.5,
              background: 'rgba(255,255,255,0.018)',
            }}
          />
        ))}
        {/* Stitched border rectangle */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            bottom: '15%',
            left: '12%',
            right: '12%',
            border: '1px dashed rgba(212,175,55,0.15)',
            borderRadius: 1,
          }}
        >
          {/* Inner border -- double stitch effect */}
          <div
            style={{
              position: 'absolute',
              inset: 5,
              border: '0.5px solid rgba(212,175,55,0.08)',
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let clipRight = 100 // percentage to clip from right
    let stitchProgress = 0

    if (phase === 'enter') {
      // Text stitches in from left to right
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = Math.min(1, enterProgress * 4)
      clipRight = (1 - eased) * 100
      stitchProgress = eased
    } else if (phase === 'hold') {
      opacity = 1
      clipRight = 0
      stitchProgress = 1
    } else {
      // Unstitch from right to left
      const eased = exitProgress * exitProgress
      opacity = 1 - exitProgress
      clipRight = eased * 100
      stitchProgress = 1 - eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity,
        }}
      >
        {/* Small "MADE IN" label above */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 'clamp(7px, 1.5vw, 11px)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.6em',
            color,
            opacity: 0.35,
            marginBottom: 10,
          }}
        >
          Haute Couture
        </div>
        {/* Main brand name with stitch clip */}
        <div
          style={{
            fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            clipPath: `inset(0 ${clipRight}% 0 0)`,
          }}
        >
          {word}
        </div>
        {/* Stitch line under text -- dashed */}
        <div
          style={{
            width: `${stitchProgress * 80}%`,
            maxWidth: 180,
            height: 0,
            borderTop: `1px dashed ${color}`,
            opacity: 0.25,
            margin: '12px auto 0',
          }}
        />
        {/* Small size/collection text below */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 'clamp(7px, 1.5vw, 11px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: '0.5em',
            color,
            opacity: 0.3 * stitchProgress,
            marginTop: 10,
          }}
        >
          Paris
        </div>
        {/* Corner stitch marks */}
        {[
          { top: -20, left: -20 },
          { top: -20, right: -20 },
          { bottom: -20, left: -20 },
          { bottom: -20, right: -20 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 8,
              height: 8,
              opacity: stitchProgress * 0.3,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 0,
                borderTop: `0.5px dashed ${color}`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 0,
                borderLeft: `0.5px dashed ${color}`,
              }}
            />
          </div>
        ))}
      </div>
    )
  },
}

function KineticCoutureLabelComponent(props: MotionGraphicProps<CoutureLabelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-couture-label',
  title: 'Couture Label',
  description: 'Fashion label/tag text with stitched dashed border, woven texture background, and left-to-right stitch reveal animation.',
  tags: ['kinetic', 'typography', 'fashion', 'couture', 'label', 'stitch', 'texture', 'luxury'],
  category: 'captions',
  component: KineticCoutureLabelComponent as any,
  defaultConfig: {
    words: ['CHANEL', 'DIOR', 'GIVENCHY', 'BALENCIAGA'],
    colors: ['#E8DCC8', '#E8DCC8', '#E8DCC8', '#E8DCC8'],
    bgColor: '#1A1814',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHANEL', 'DIOR', 'GIVENCHY', 'BALENCIAGA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8DCC8', '#E8DCC8', '#E8DCC8', '#E8DCC8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1814', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
