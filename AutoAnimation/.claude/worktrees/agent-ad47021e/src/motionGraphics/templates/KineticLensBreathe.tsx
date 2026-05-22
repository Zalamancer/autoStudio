import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LensBreatheConfig extends KineticBaseConfig {
  breatheAmount: number
}

// Lens breathing: as a lens changes focus it physically changes its focal length
// slightly, causing the image to subtly zoom in/out. This is a known optical
// artifact in many cinema lenses (e.g. the Canon CN-E series breathes noticeably).
// The effect: gentle, rhythmic scale shift tied to the focus cycle — as if the
// lens is inhaling and exhaling with each focus pull.

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Very slow, subtle background scale pulse — matches the breathing
    const breathe = 1 + Math.sin(time * 0.9) * 0.008

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          overflow: 'hidden',
          transform: `scale(${breathe})`,
        }}
      >
        {/* Depth-of-field rings — concentric circles that scale with breath */}
        {[20, 35, 50, 65, 80].map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${r * 2}%`,
              height: `${r * 2}%`,
              marginLeft: `-${r}%`,
              marginTop: `-${r}%`,
              borderRadius: '50%',
              border: `1px solid rgba(255,255,255,${0.015 + i * 0.008})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Breathing vignette — slightly tighter on exhale */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent ${25 + Math.sin(time * 0.9) * 3}%, rgba(0,0,0,0.7) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, index }: WordRenderProps) => {
    const f = frame ?? 0

    // Breathing oscillation — continuous gentle scale pulse
    // Deterministic: tied to frame number, not wall time
    const breathFreq = 0.06  // cycles per frame at 30fps ≈ 1.8Hz — slow, organic
    const breathAmp = 0.012
    const breathOffset = index * 0.8  // each word has slightly different phase
    const breathe = 1 + Math.sin(f * breathFreq + breathOffset) * breathAmp

    let opacity: number
    let focusBlur: number  // blur increases when out of focus (breathing cycle extremes)
    let enterScale: number

    if (phase === 'enter') {
      const ep = easeOutCubic(enterProgress)
      opacity = ep
      focusBlur = (1 - ep) * 6   // comes into focus as it enters
      enterScale = 0.97 + ep * 0.03
    } else if (phase === 'hold') {
      opacity = 1
      // During hold: blur gently pulses with the breath — lens refocuses slightly
      focusBlur = Math.abs(Math.sin(holdProgress * Math.PI * 1.5)) * 1.2
      enterScale = 1
    } else {
      const ep = easeInOutSine(exitProgress)
      opacity = 1 - ep
      focusBlur = ep * 5
      enterScale = 1
    }

    const combinedScale = enterScale * breathe

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${combinedScale})`,
          whiteSpace: 'nowrap',
          opacity,
          filter: focusBlur > 0.15 ? `blur(${focusBlur}px)` : 'none',
        }}
      >
        {/* Soft glow that intensifies at breath extremes */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(38px, 9vw, 130px)',
            fontWeight: 700,
            color: 'rgba(180,210,255,0.15)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            filter: `blur(${8 + focusBlur * 1.5}px)`,
          }}
        >
          {word}
        </div>
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(38px, 9vw, 130px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textShadow: focusBlur < 0.5 ? `0 0 24px rgba(180,210,255,0.2)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LensBreatheComponent(props: MotionGraphicProps<LensBreatheConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lens-breathe',
  title: 'Kinetic Lens Breathe',
  description: 'Lens breathing artifact: text gently scales in and out in sync with a focus-pull cycle — the subtle optical inhale/exhale of a cinema lens refocusing',
  tags: ['kinetic', 'typography', 'film', 'camera', 'lens breathing', 'focus', 'depth of field', 'cinematic', 'subtle', 'lens'],
  category: 'captions',
  component: LensBreatheComponent as any,
  defaultConfig: {
    words: ['BREATHE', 'INHALE', 'FOCUS', 'EXHALE'],
    colors: ['#C8E0FF', '#E8F4FF', '#FFFFFF', '#D0E8FF'],
    bgColor: '#060810',
    cycleDuration: 1.8,
    breatheAmount: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREATHE', 'INHALE', 'FOCUS', 'EXHALE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8E0FF', '#E8F4FF', '#FFFFFF', '#D0E8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 6, group: 'Timing' },
    { key: 'breatheAmount', label: 'Breathe Amount', type: 'number', defaultValue: 12, min: 4, max: 30, group: 'Animation' },
  ],
})
