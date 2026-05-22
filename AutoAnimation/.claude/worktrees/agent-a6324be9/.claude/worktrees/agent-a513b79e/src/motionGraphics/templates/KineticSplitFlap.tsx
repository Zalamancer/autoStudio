import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// -- Split-Flap Display -------------------------------------------------------
// Each character flips down like an airport departure board split-flap mechanism.
// Top half stays, bottom half rotates down via rotateX with perspective origin at center.

interface SplitFlapConfig extends KineticBaseConfig {
  flapColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInBack(t: number): number {
  const c = 1.70158
  return (c + 1) * t * t * t - c * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Riveted metal panel lines */}
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${15 + i * 14}%`,
            height: 1,
            background: `rgba(255,255,255,${0.025 + Math.sin(time * 0.4 + i * 1.2) * 0.01})`,
          }} />
        ))}
        {/* Subtle scanning light */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 80% 40% at 50% ${48 + Math.sin(time * 0.6) * 4}%, rgba(255,200,100,0.04), transparent)`,
          mixBlendMode: 'screen',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')

    const charElements = chars.map((ch, ci) => {
      const stagger = ci * 0.12
      const totalChars = chars.length

      // Per-character staggered progress
      const charEnter = Math.max(0, Math.min(1, (enterProgress - stagger) / Math.max(0.01, 1 - stagger * (totalChars - 1) / totalChars)))
      const charExit = Math.max(0, Math.min(1, (exitProgress - stagger * 0.5) / Math.max(0.01, 1 - stagger * 0.5 * (totalChars - 1) / totalChars)))

      // Flap rotation: top half is stationary, bottom half flips from -180 to 0
      let flapRotation = -180 // start face-up (hidden)
      let flapOpacity = 0
      let holdWobble = 0

      if (phase === 'enter') {
        const e = easeOutExpo(charEnter)
        flapRotation = -180 + e * 180 // flip from -180 to 0
        flapOpacity = charEnter > 0.1 ? 1 : 0
      } else if (phase === 'hold') {
        flapRotation = 0
        flapOpacity = 1
        // Subtle mechanical vibration
        holdWobble = Math.sin(holdProgress * Math.PI * 6 + ci * 1.8) * 1.5
      } else {
        const e = easeInBack(charExit)
        flapRotation = e * 180 // flip forward and away
        flapOpacity = 1 - charExit * 0.8
      }

      const fontSize = 'clamp(40px, 12vw, 160px)'

      return (
        <div key={ci} style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 2px',
          perspective: '600px',
        }}>
          {/* Character housing */}
          <div style={{
            position: 'relative',
            width: '0.75em',
            height: '1.1em',
            fontSize,
            fontFamily: "'Courier New', 'Consolas', monospace",
            fontWeight: 700,
            overflow: 'hidden',
            borderRadius: 4,
            background: 'rgba(20,20,25,0.9)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            {/* Top half -- always shows the settled character */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              color,
              fontSize,
              lineHeight: '1.1em',
            }}>
              <span style={{ opacity: flapOpacity }}>{ch}</span>
            </div>

            {/* Center divider line */}
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              top: '50%',
              height: 1,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 3,
            }} />

            {/* Bottom half -- the flipping flap */}
            <div style={{
              position: 'absolute',
              top: '50%', left: 0, right: 0,
              height: '50%',
              overflow: 'hidden',
              transformOrigin: 'center top',
              transform: `rotateX(${flapRotation + holdWobble}deg)`,
              backfaceVisibility: 'hidden',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              color,
              fontSize,
              lineHeight: '1.1em',
              background: 'rgba(25,25,30,0.95)',
              opacity: flapOpacity,
            }}>
              <span style={{ transform: 'translateY(55%)' }}>{ch}</span>
            </div>
          </div>
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
        }}>
          {charElements}
        </div>
      </div>
    )
  },
}

function SplitFlapComponent(props: MotionGraphicProps<SplitFlapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-split-flap',
  title: 'Kinetic Split Flap',
  description: 'Airport departure board split-flap display -- each character flips down via rotateX with staggered timing, mechanical wobble on hold, and a forward-flip exit.',
  tags: ['kinetic', 'typography', '3d', 'flip', 'split-flap', 'airport', 'mechanical', 'perspective', 'rotation'],
  category: 'captions',
  component: SplitFlapComponent as any,
  defaultConfig: {
    words: ['DEPART', 'ARRIVE', 'GATE', 'DELAY'],
    colors: ['#F5E642', '#FFFFFF', '#42F5A0', '#FF6B6B'],
    bgColor: '#0a0a0f',
    cycleDuration: 1.2,
    flapColor: '#1a1a24',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPART', 'ARRIVE', 'GATE', 'DELAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E642', '#FFFFFF', '#42F5A0', '#FF6B6B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'flapColor', label: 'Flap Color', type: 'color', defaultValue: '#1a1a24', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
