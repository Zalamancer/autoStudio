import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SplitDiopterConfig extends KineticBaseConfig {
  splitAngle: number
}

// Split diopter lens: a half-lens attachment that lets the camera focus at
// two different distances simultaneously — one half of the frame is sharp
// near, the other half sharp far. Brian De Palma used it obsessively
// (Carrie, Dressed to Kill, Blow Out).
// Here: text is split horizontally — top half sharp, bottom half blurred
// (simulates the "near focus" half) with a subtle misalignment seam.

const SEAM_Y = 50  // percent — where the diopter splits

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Very slow horizontal drift to simulate handheld static shot
    const drift = Math.sin(time * 0.18) * 0.3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Split line — faint seam where the diopter halves meet */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${SEAM_Y + drift}%`,
            height: 1,
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'none',
          }}
        />
        {/* Bottom half gets a slight blur overlay — far-focus half */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${SEAM_Y}%`,
            bottom: 0,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            background: 'rgba(0,0,0,0.12)',
            pointerEvents: 'none',
          }}
        />
        {/* Cinematic vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeIn  = (t: number) => Math.pow(t, 2)

    let opacity: number
    let sharpBlur: number   // top (sharp) half blur
    let softBlur: number    // bottom (soft) half blur
    let splitOffset: number // vertical misalignment of the two halves

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      opacity = 0.3 + ep * 0.7
      sharpBlur = (1 - ep) * 12     // top half focuses in
      softBlur = 14 - ep * 6        // bottom half stays soft, eases slightly
      splitOffset = (1 - ep) * 4    // halves converge as focus settles
    } else if (phase === 'hold') {
      opacity = 1
      sharpBlur = 0
      softBlur = 8
      splitOffset = 0
    } else {
      const ep = easeIn(exitProgress)
      opacity = 1 - ep * 0.85
      sharpBlur = ep * 10
      softBlur = 8 + ep * 6
      splitOffset = ep * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
          opacity,
        }}
      >
        {/* Top half — sharp focus (clip to upper 50%) */}
        <div
          style={{
            position: 'absolute',
            top: `${-splitOffset}px`,
            left: 0,
            clipPath: 'inset(0 0 50% 0)',
            filter: sharpBlur > 0.1 ? `blur(${sharpBlur}px)` : 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 700,
              color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textShadow: sharpBlur < 1 ? `0 0 20px rgba(200,220,255,0.25)` : 'none',
            }}
          >
            {word}
          </div>
        </div>

        {/* Bottom half — soft focus (clip to lower 50%) */}
        <div
          style={{
            position: 'absolute',
            top: `${splitOffset}px`,
            left: 0,
            clipPath: 'inset(50% 0 0 0)',
            filter: `blur(${softBlur}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 700,
              color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function SplitDiopterComponent(props: MotionGraphicProps<SplitDiopterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-split-diopter',
  title: 'Kinetic Split Diopter',
  description: 'De Palma split diopter lens: text is split at the frame centre — top half sharp near-focus, bottom half in soft far-focus blur, with a faint seam where the halves meet',
  tags: ['kinetic', 'typography', 'film', 'camera', 'split diopter', 'de palma', 'depth of field', 'cinematic', 'lens'],
  category: 'captions',
  component: SplitDiopterComponent as any,
  defaultConfig: {
    words: ['SPLIT', 'FOCUS', 'DIOPTER', 'SHARP'],
    colors: ['#E8F4FF', '#FFFFFF', '#D0E8FF', '#F0F8FF'],
    bgColor: '#080810',
    cycleDuration: 1.6,
    splitAngle: 0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPLIT', 'FOCUS', 'DIOPTER', 'SHARP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8F4FF', '#FFFFFF', '#D0E8FF', '#F0F8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'splitAngle', label: 'Split Angle (°)', type: 'number', defaultValue: 0, min: -15, max: 15, group: 'Animation' },
  ],
})
