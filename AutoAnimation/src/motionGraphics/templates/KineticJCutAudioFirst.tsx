import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JCutAudioFirstConfig extends KineticBaseConfig {
  audioLeadMs: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // J-Cut: audio from next scene "leaks" in before the picture cut
    // Visualized as audio waveform bleeding in ahead of the visual

    // Timeline indicator — horizontal scrub bar
    const scrubPos = (time * 0.3) % 1.0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Scene A — outgoing (left side of split edit) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '48%',
            background: 'rgba(255,255,255,0.02)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />
        {/* Scene B — incoming (right side) */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '48%',
            background: 'rgba(255,180,0,0.03)',
            borderLeft: '1px solid rgba(255,180,0,0.12)',
            pointerEvents: 'none',
          }}
        />
        {/* Audio waveform — Scene B audio (J-cut lead-in) */}
        {Array.from({ length: 20 }, (_, i) => {
          const x = (i / 20) * 100
          const h = 4 + Math.sin(time * 8 + i * 0.7) * 3 + Math.sin(time * 3.1 + i * 1.3) * 2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: '50%',
                width: '3%',
                height: h,
                transform: 'translateY(-50%)',
                background: x > 52
                  ? `rgba(255,180,0,0.35)` // Scene B audio — highlighted
                  : `rgba(255,255,255,0.12)`, // Scene A audio
                borderRadius: 1,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* J-cut indicator line — where audio starts before picture */}
        <div
          style={{
            position: 'absolute',
            left: '52%',
            top: '30%',
            bottom: '30%',
            width: 2,
            background: 'rgba(255,180,0,0.5)',
            pointerEvents: 'none',
          }}
        />
        {/* J-cut label */}
        <div
          style={{
            position: 'absolute',
            left: '54%',
            top: '28%',
            fontFamily: 'monospace',
            fontSize: 8,
            color: 'rgba(255,180,0,0.6)',
            letterSpacing: 1,
            pointerEvents: 'none',
          }}
        >
          J-CUT
        </div>
        {/* Timeline scrub line */}
        <div
          style={{
            position: 'absolute',
            left: `${scrubPos * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,100,100,0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // J-Cut feel: text appears to "hear" the next word before it's shown
    // Current word slightly anticipates exit, next word arrives early
    let opacity = 1
    let translateX = 0
    let blur = 0

    if (phase === 'enter') {
      // Slips in from right — next scene incoming
      const ease = 1 - Math.pow(1 - enterProgress, 2)
      translateX = (1 - ease) * 15
      opacity = ease
      blur = (1 - ease) * 3
    } else if (phase === 'hold') {
      // Stable — audio is locked to picture
      translateX = Math.sin(t * 0.5 + index) * 0.5
    } else {
      // Lingers slightly — L-cut feel on exit (picture holds past audio)
      const ease = Math.pow(exitProgress, 1.5)
      translateX = -ease * 12
      opacity = 1 - exitProgress * 0.85
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%)`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(40px, 10.5vw, 145px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 10,
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        {word}
      </div>
    )
  },
}

function JCutAudioFirstComponent(props: MotionGraphicProps<JCutAudioFirstConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-jcut-audio-first',
  title: 'Kinetic J-Cut Audio First',
  description: 'J-cut editing technique visualized — audio waveform from next scene bleeds in before picture cut, with timeline split-edit visualization and horizontal slip transitions',
  tags: ['kinetic', 'typography', 'j-cut', 'editing', 'audio', 'timeline', 'transition', 'film'],
  category: 'captions',
  component: JCutAudioFirstComponent as any,
  defaultConfig: {
    words: ['LISTEN', 'AHEAD', 'LEAD', 'CUT'],
    colors: ['#FFB800', '#FFFFFF', '#FFB800', '#F0F0F0'],
    bgColor: '#0d0d14',
    cycleDuration: 1.4,
    audioLeadMs: 250,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LISTEN', 'AHEAD', 'LEAD', 'CUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB800', '#FFFFFF', '#FFB800', '#F0F0F0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'audioLeadMs', label: 'Audio Lead (ms)', type: 'number', defaultValue: 250, min: 50, max: 1000, group: 'Animation' },
  ],
})
