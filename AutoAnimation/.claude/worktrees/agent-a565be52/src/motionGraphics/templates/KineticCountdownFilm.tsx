import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CountdownFilmConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Classic film countdown sweep line — rotates around center each second
    const sweepAngle = (time * 360) % 360
    // Pip flash at top — fires once per rotation
    const pipFlash = sweepAngle < 15 ? 1 - sweepAngle / 15 : 0
    // Film grain flicker
    const grain = 0.85 + 0.1 * Math.sin(time * 127.3) + 0.05 * Math.sin(time * 311.7)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Film frame — warm aged white */}
        <div style={{ position: 'absolute', inset: 0, background: `rgba(245,240,225,${0.97 * grain})` }} />
        {/* Outer circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70%',
            paddingBottom: '70%',
            borderRadius: '50%',
            border: '3px solid rgba(30,20,10,0.7)',
          }}
        />
        {/* Inner circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50%',
            paddingBottom: '50%',
            borderRadius: '50%',
            border: '2px solid rgba(30,20,10,0.5)',
          }}
        />
        {/* Sweep line — the rotating arm of the countdown */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '35%',
            height: 2,
            background: 'rgba(30,20,10,0.8)',
            transformOrigin: '0% 50%',
            transform: `translateY(-50%) rotate(${sweepAngle}deg)`,
          }}
        />
        {/* Corner crosshairs — classic film registration marks */}
        {[
          { top: '8%', left: '8%' },
          { top: '8%', right: '8%' },
          { bottom: '8%', left: '8%' },
          { bottom: '8%', right: '8%' },
        ].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', ...pos, width: 20, height: 20 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(30,20,10,0.5)', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(30,20,10,0.5)', transform: 'translateX(-50%)' }} />
          </div>
        ))}
        {/* Top pip flash */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `rgba(30,20,10,${0.6 + pipFlash * 0.4})`,
            boxShadow: pipFlash > 0.3 ? `0 0 8px rgba(30,20,10,0.8)` : 'none',
          }}
        />
        {/* Film sprocket holes — left side */}
        {[20, 40, 60, 80].map((y, i) => (
          <div
            key={`sp-l-${i}`}
            style={{
              position: 'absolute',
              left: '2%',
              top: `${y}%`,
              width: 10,
              height: 14,
              borderRadius: 2,
              background: 'rgba(30,20,10,0.4)',
              transform: 'translateY(-50%)',
            }}
          />
        ))}
        {/* Film sprocket holes — right side */}
        {[20, 40, 60, 80].map((y, i) => (
          <div
            key={`sp-r-${i}`}
            style={{
              position: 'absolute',
              right: '2%',
              top: `${y}%`,
              width: 10,
              height: 14,
              borderRadius: 2,
              background: 'rgba(30,20,10,0.4)',
              transform: 'translateY(-50%)',
            }}
          />
        ))}
        {/* Scratches — vertical film grain lines */}
        <div
          style={{
            position: 'absolute',
            left: '23%',
            top: 0,
            bottom: 0,
            width: 1,
            background: `rgba(30,20,10,${0.08 * grain})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '67%',
            top: 0,
            bottom: 0,
            width: 1,
            background: `rgba(30,20,10,${0.05 * grain})`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 24

    // Gate flash on word entrance — bright white flash as new frame gates
    let opacity = 0
    let brightness = 1
    let grain = 0.9 + 0.08 * Math.sin(time * 97.3) + 0.04 * Math.sin(time * 211.7)

    if (phase === 'enter') {
      if (enterProgress < 0.15) {
        // Gate flash: burst of white then snap to text
        const p = enterProgress / 0.15
        opacity = p
        brightness = 3 - p * 2  // flash white → normal
      } else {
        opacity = 1
        brightness = 1
      }
    } else if (phase === 'hold') {
      opacity = 1
      brightness = grain
    } else {
      // Hard cut out — film gate to black
      opacity = exitProgress < 0.1 ? 1 - exitProgress / 0.1 : 0
      brightness = 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Impact', 'Arial Narrow', sans-serif",
          fontSize: 'clamp(60px, 18vw, 200px)',
          fontWeight: 900,
          color: color,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          filter: `brightness(${brightness})`,
          mixBlendMode: 'multiply',
          textShadow: '2px 2px 0 rgba(30,20,10,0.15)',
        }}
      >
        {word}
      </div>
    )
  },
}

function CountdownFilmComponent(props: MotionGraphicProps<CountdownFilmConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-countdown-film',
  title: 'Kinetic Countdown Film',
  description: 'Classic film countdown leader with rotating sweep arm, registration crosses, sprocket holes, pip flash, and gate flash on word entrance',
  tags: ['kinetic', 'typography', 'countdown', 'film', 'leader', 'cinema', 'classic', 'vintage', 'reel'],
  category: 'captions',
  component: CountdownFilmComponent as any,
  defaultConfig: {
    words: ['5', '4', '3', '2', '1', 'ACTION'],
    colors: ['#1e140a', '#1e140a', '#1e140a', '#1e140a', '#1e140a', '#c0392b'],
    bgColor: '#f5f0e1',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['5', '4', '3', '2', '1', 'ACTION'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1e140a', '#1e140a', '#1e140a', '#1e140a', '#1e140a', '#c0392b'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0e1', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 4, group: 'Timing' },
  ],
})
