import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Content Format: POV Story (TikTok POV viral format)
// Black bg, white words, first-person camera zoom — words enter with
// a slow push-in scale from 0.85 to 1 as if the camera is leaning in.
// "POV:" prefix in small muted text above the main word.
// Hold: a subtle cinematic letterbox bars (top/bottom black bars) appear.
// Exit: fast cut to black — like a scene edit.

interface POVStoryConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#0a0a0a' ? '#0a0a0a' : bgColor,
      }}
    >
      {/* Cinematic vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased
      scale = 0.85 + eased * 0.15
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      // Cut to black — fast
      opacity = exitProgress < 0.25 ? 1 - exitProgress / 0.25 : 0
      scale = 1
    }

    // Letterbox bars animate in during hold
    const lbProgress = phase === 'hold' ? 1 : phase === 'enter' ? enterProgress * 0.5 : 1 - exitProgress
    const barHeight = lbProgress * 8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* POV prefix */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(11px, 2.5vw, 34px)',
            fontWeight: 400,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          POV:
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(34px, 8.5vw, 120px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 2,
            whiteSpace: 'nowrap',
            color,
          }}
        >
          {word}
        </div>
        {/* Letterbox bar bottom */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${barHeight}%`,
            background: '#000',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: `${barHeight}%`,
            background: '#000',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },
}

function POVStoryComponent(props: MotionGraphicProps<POVStoryConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pov-story',
  title: 'Kinetic POV Story',
  description: 'TikTok POV format — camera push-in scale reveal, cinematic letterbox bars, fast cut-to-black exit',
  tags: ['kinetic', 'typography', 'pov', 'tiktok', 'story', 'cinematic', 'content-format'],
  category: 'captions',
  component: POVStoryComponent as any,
  defaultConfig: {
    words: ['YOU STAYED', 'TOO LATE', 'I CHOSE ME', 'NO MORE'],
    colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['YOU STAYED', 'TOO LATE', 'I CHOSE ME', 'NO MORE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
