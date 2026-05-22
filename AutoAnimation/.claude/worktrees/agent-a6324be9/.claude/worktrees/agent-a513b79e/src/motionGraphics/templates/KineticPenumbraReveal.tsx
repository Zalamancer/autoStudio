import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PenumbraRevealConfig extends KineticBaseConfig {
  softness: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Simulate a light source moving overhead — umbra / penumbra boundary shifts
    const lightX = 40 + Math.sin(time * 0.4) * 20
    const lightY = -30 + Math.sin(time * 0.3) * 10

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Penumbra gradient: soft light falloff from above */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 90% 80% at ${lightX}% ${lightY}%, rgba(220,210,195,0.08) 0%, rgba(180,170,155,0.04) 40%, transparent 70%)`,
          }}
        />
        {/* Umbra region — darker center to reinforce the shadow drama */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 70%, rgba(0,0,0,0.25) 0%, transparent 70%)',
          }}
        />
        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let blurAmount = 0
    let scale = 1
    let shadowSpread = 0
    let textBrightness = 1

    if (phase === 'enter') {
      // Penumbra sharpens: blur collapses inward, revealing crisp text
      const p = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 2)
      blurAmount = (1 - p) * 40 // starts at max blur (penumbra zone), sharpens
      scale = 0.9 + p * 0.1
      shadowSpread = (1 - p) * 30
      textBrightness = 0.4 + p * 0.6
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle penumbra drift — blur pulses very slightly as if light subtly moves
      blurAmount = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.8
      scale = 1
      shadowSpread = 2 + Math.sin(holdProgress * Math.PI * 2) * 1
      textBrightness = 1
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      blurAmount = p * 35 // returns to penumbra and dissolves
      scale = 1 + exitProgress * 0.05
      shadowSpread = p * 25
      textBrightness = 1 - p * 0.5
    }

    return (
      <>
        {/* Penumbra halo: outer diffuse blur layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale * 1.06})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'rgba(0,0,0,0.7)',
            filter: `blur(${blurAmount + shadowSpread}px)`,
            opacity: opacity * 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Penumbra mid layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale * 1.02})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'rgba(0,0,0,0.85)',
            filter: `blur(${blurAmount * 0.5}px)`,
            opacity: opacity * 0.7,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Sharp umbra / main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            opacity: opacity * textBrightness,
            filter: blurAmount > 2 ? `blur(${blurAmount * 0.15}px)` : 'none',
            whiteSpace: 'nowrap',
            textShadow: `0 0 ${shadowSpread + 4}px rgba(0,0,0,0.6)`,
          }}
        >
          {word}
        </div>
        {/* Surface light catch — bright rim on top */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'transparent',
            WebkitTextStroke: `1px rgba(230,220,200,${opacity * textBrightness * 0.35})`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function PenumbraRevealComponent(props: MotionGraphicProps<PenumbraRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-penumbra-reveal',
  title: 'Kinetic Penumbra Reveal',
  description: 'Text emerges from a blurred penumbra shadow zone as the light source sharpens — outer blur collapses inward to reveal crisp letterforms',
  tags: ['kinetic', 'typography', 'shadow', 'penumbra', 'umbra', 'light', 'blur', 'reveal', 'dramatic'],
  category: 'captions',
  component: PenumbraRevealComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'SHARP', 'EMERGE', 'CLEAR'],
    colors: ['#E8E0D0', '#D4C9B5', '#F0E8D8', '#C8C0B0'],
    bgColor: '#0e0d0b',
    cycleDuration: 1.5,
    softness: 40,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'SHARP', 'EMERGE', 'CLEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0D0', '#D4C9B5', '#F0E8D8', '#C8C0B0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e0d0b', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'softness', label: 'Penumbra Softness', type: 'number', defaultValue: 40, min: 10, max: 80, group: 'Animation' },
  ],
})
