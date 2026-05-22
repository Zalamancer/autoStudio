import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DocumentaryLowerThirdConfig extends KineticBaseConfig {
  barThickness: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Documentary lower third: Ken Burns-style, PBS Frontline, Netflix docs
    // Clean typographic bar at bottom, usually on interview subject
    // Horizontal rule wipe, name + title/role structure

    const barProgress = Math.min(1, time * 0.8) // bar wipes in

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Interview background gradient — typical doc bokeh feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 45% 40%, rgba(255,255,255,0.04) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        {/* Lower third bar — primary rule */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: '18%',
            width: `${barProgress * 55}%`,
            height: 3,
            background: 'rgba(255,255,255,0.85)',
            pointerEvents: 'none',
          }}
        />
        {/* Lower third secondary rule — thinner, below */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: '12%',
            width: `${barProgress * 42}%`,
            height: 1,
            background: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle doc texture — grain from interview footage */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0,0,0,${0.03 + Math.sin(time * 0.5) * 0.01})`,
            pointerEvents: 'none',
          }}
        />
        {/* Left accent — documentary authority bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: '10%',
            width: 4,
            height: `${barProgress * 12}%`,
            background: 'rgba(255,255,255,0.6)',
            pointerEvents: 'none',
          }}
        />
        {/* Top fade — cinematic frame context */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '25%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Timecode micro-text — archive documentary feel */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            fontFamily: 'monospace',
            fontSize: 8,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: 1,
            pointerEvents: 'none',
          }}
        >
          {`${String(Math.floor(time / 3600)).padStart(2, '0')}:${String(Math.floor((time % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(2, '0')}:${String(Math.floor((time % 1) * 24)).padStart(2, '0')}`}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let translateX = 0

    if (phase === 'enter') {
      // Wipe left to right — bar draws across then text resolves
      const ease = 1 - Math.pow(1 - enterProgress, 2)
      translateX = (1 - ease) * -20
      opacity = ease * ease
    } else if (phase === 'hold') {
      // Documentary stillness — authoritative, locked
      translateX = Math.sin(t * 0.25 + index) * 0.3
      opacity = 1
    } else {
      // Wipe back out — lower third retracts
      const ease = Math.pow(exitProgress, 2)
      translateX = ease * 15
      opacity = 1 - ease
    }

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '3%',
          transform: `translateX(${translateX}px)`,
          opacity,
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(24px, 6vw, 80px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 4,
          textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        }}
      >
        {word}
      </div>
    )
  },
}

function DocumentaryLowerThirdComponent(props: MotionGraphicProps<DocumentaryLowerThirdConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-documentary-lower-third',
  title: 'Kinetic Documentary Lower Third',
  description: 'PBS/Netflix documentary lower third — horizontal rule wipe-in, double rule structure, left accent bar, timecode overlay, bottom-anchored text with authority positioning',
  tags: ['kinetic', 'typography', 'documentary', 'lower third', 'title design', 'journalism', 'interview', 'clean'],
  category: 'captions',
  component: DocumentaryLowerThirdComponent as any,
  defaultConfig: {
    words: ['DIRECTOR', 'SUBJECT', 'EXPERT', 'WITNESS'],
    colors: ['#FFFFFF', '#F0F0F0', '#FFFFFF', '#E8E8E8'],
    bgColor: '#101010',
    cycleDuration: 1.8,
    barThickness: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DIRECTOR', 'SUBJECT', 'EXPERT', 'WITNESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0F0F0', '#FFFFFF', '#E8E8E8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#101010', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 6, group: 'Timing' },
    { key: 'barThickness', label: 'Bar Thickness (px)', type: 'number', defaultValue: 3, min: 1, max: 8, group: 'Animation' },
  ],
})
