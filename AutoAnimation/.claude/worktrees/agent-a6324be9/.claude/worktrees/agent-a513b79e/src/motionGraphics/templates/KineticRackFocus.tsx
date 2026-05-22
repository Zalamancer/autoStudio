import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RackFocusConfig extends KineticBaseConfig {
  maxBlur: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle depth-of-field vignette — emulates a shallow-focus background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Warm amber lens cast — cinematic colour grade */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(255,200,80,0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53 + 17

    // Easing: ease-out cubic for the focus pull-in
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    let blurPx: number
    let opacity: number
    let scale: number

    const maxBlur = 28 // px — mimics a fast lens going out of focus

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      blurPx = maxBlur * (1 - ep)
      opacity = 0.3 + ep * 0.7
      scale = 1.06 - ep * 0.06  // slight scale-in as focus lands
    } else if (phase === 'hold') {
      blurPx = 0
      opacity = 1
      scale = 1
    } else {
      // Rack back out — pull focus away
      const ep = easeOut(exitProgress)
      blurPx = maxBlur * ep
      opacity = 1 - exitProgress * 0.6
      scale = 1 + ep * 0.04
    }

    // Chromatic aberration hint while out of focus
    const aberration = blurPx * 0.12

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Red channel offset — chromatic aberration during blur */}
        {aberration > 0.3 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${aberration}px), -50%)`,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 700,
              color: 'rgba(255,60,60,0.5)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              filter: `blur(${blurPx * 0.6}px)`,
              opacity: opacity * 0.5,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Cyan channel offset */}
        {aberration > 0.3 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% - ${aberration}px), -50%)`,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 700,
              color: 'rgba(0,220,255,0.5)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              filter: `blur(${blurPx * 0.6}px)`,
              opacity: opacity * 0.5,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Main text — the focus plane */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            filter: `blur(${blurPx}px)`,
            opacity,
            textShadow: blurPx < 2 ? `0 2px 24px rgba(255,200,80,0.18)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RackFocusComponent(props: MotionGraphicProps<RackFocusConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rack-focus',
  title: 'Kinetic Rack Focus',
  description: 'Mimics a cinema rack focus: text transitions from deep blur with chromatic aberration to razor-sharp focus as the lens lands',
  tags: ['kinetic', 'typography', 'film', 'camera', 'focus', 'rack focus', 'blur', 'cinematic', 'lens'],
  category: 'captions',
  component: RackFocusComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'SHARP', 'CRISP', 'CLEAR'],
    colors: ['#F5E6C8', '#E8D5A0', '#FFFFFF', '#F0E0B0'],
    bgColor: '#0D0B08',
    cycleDuration: 1.4,
    maxBlur: 28,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'SHARP', 'CRISP', 'CLEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6C8', '#E8D5A0', '#FFFFFF', '#F0E0B0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0B08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'maxBlur', label: 'Max Blur (px)', type: 'number', defaultValue: 28, min: 8, max: 60, group: 'Animation' },
  ],
})
