import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PolaroidCaptionConfig extends KineticBaseConfig {}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const polaroidW = Math.min(width, height) * 0.6
    const polaroidH = polaroidW * 1.2
    const borderPad = polaroidW * 0.06
    const bottomPad = polaroidW * 0.22

    // Photo "developing" — starts washed out, gradually reveals
    const developCycle = (time * 0.3) % 1
    const developAlpha = Math.min(1, developCycle * 2.5)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle cork board texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-conic-gradient(rgba(160,120,60,0.04) 0% 25%, transparent 0% 50%)`,
            backgroundSize: '16px 16px',
          }}
        />
        {/* Polaroid card */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: polaroidW,
            height: polaroidH,
            transform: `translate(-50%, -50%) rotate(${Math.sin(time * 0.5) * 1.2}deg)`,
            background: '#f5f0e8',
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {/* Photo area */}
          <div
            style={{
              position: 'absolute',
              top: borderPad,
              left: borderPad,
              right: borderPad,
              bottom: bottomPad,
              background: `rgba(40,35,30,${0.3 + developAlpha * 0.7})`,
              overflow: 'hidden',
            }}
          >
            {/* Developing wash effect — green/amber chemical tint fading */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(145deg,
                  rgba(180,200,140,${0.6 * (1 - developAlpha)}) 0%,
                  rgba(200,170,100,${0.5 * (1 - developAlpha)}) 50%,
                  rgba(160,180,130,${0.4 * (1 - developAlpha)}) 100%)`,
              }}
            />
            {/* Simulated image grain */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `repeating-linear-gradient(
                  0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px
                )`,
              }}
            />
          </div>
          {/* Polaroid bottom strip — slight yellowed aging */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: bottomPad,
              background: 'linear-gradient(180deg, #f5f0e8 0%, #ede6d8 100%)',
              borderRadius: '0 0 3px 3px',
            }}
          />
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
  }: WordRenderProps) => {
    const polaroidW = Math.min(width, height) * 0.6
    const bottomPad = polaroidW * 0.22

    // Text appears as if handwritten stroke by stroke
    let opacity = 0
    let clipPercent = 0
    let wobble = 0

    if (phase === 'enter') {
      // Pen stroke reveal — left to right clip
      const eased = easeOutQuad(enterProgress)
      clipPercent = eased * 100
      opacity = Math.min(1, enterProgress * 3)
      wobble = (1 - enterProgress) * 2
    } else if (phase === 'hold') {
      clipPercent = 100
      opacity = 1
      wobble = Math.sin(holdProgress * Math.PI * 3) * 0.3
    } else {
      clipPercent = 100
      opacity = 1 - easeOutQuad(exitProgress)
      wobble = exitProgress * -1
    }

    // Position text on the Polaroid bottom strip
    const textY = 50 + (bottomPad * 0.35) / height * 100

    return (
      <div
        style={{
          position: 'absolute',
          top: `${textY}%`,
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${wobble}deg)`,
          opacity,
          clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', 'Segoe Script', 'Comic Sans MS', cursive",
            fontSize: 'clamp(20px, 5vw, 50px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 1,
            textShadow: '0 1px 0 rgba(0,0,0,0.08)',
            // Slight handwritten tilt variation
            transform: `skewX(${-1.5}deg)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PolaroidCaptionComponent(props: MotionGraphicProps<PolaroidCaptionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-polaroid-caption',
  title: 'Kinetic Polaroid Caption',
  description:
    'Polaroid instant photo with chemical developing effect. Handwritten caption appears stroke-by-stroke on the white border below the image area.',
  tags: ['kinetic', 'typography', 'polaroid', 'photo', 'analog', 'handwritten', 'vintage', 'instant'],
  category: 'captions',
  component: PolaroidCaptionComponent as any,
  defaultConfig: {
    words: ['summer', 'memories', 'golden', 'days'],
    colors: ['#3a3530', '#3a3530', '#3a3530', '#3a3530'],
    bgColor: '#c4b9a0',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['summer', 'memories', 'golden', 'days'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3a3530', '#3a3530', '#3a3530', '#3a3530'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#c4b9a0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
