import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RimLightEdgeConfig extends KineticBaseConfig {
  rimColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Strong backlight source — shifts slightly as if a studio light drifts
    const lightX = 48 + Math.sin(time * 0.6) * 8
    const lightY = 80 + Math.sin(time * 0.4) * 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Backlight source bloom — behind and below center */}
        <div
          style={{
            position: 'absolute',
            left: `${lightX}%`,
            top: `${lightY}%`,
            width: 300,
            height: 200,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse at center, rgba(255,255,255,${0.06 + Math.sin(time * 2) * 0.01}) 0%, rgba(200,220,255,0.03) 40%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
        />
        {/* Camera-side dark — blocks front fill */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 70% at 50% 20%, rgba(0,0,0,0.35) 0%, transparent 60%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let scale = 1
    let rimWidth = 0
    let rimGlowBlur = 0
    let rimOpacity = 0
    let bodyOpacity = 0

    if (phase === 'enter') {
      // Rim light sweeps around the edges first, then the dark body solidifies
      const pExpo = easeOutExpo(enterProgress)
      const pBack = easeOutBack(Math.min(1, enterProgress * 1.1))
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.8 + pBack * 0.2
      rimWidth = 1 + (1 - pExpo) * 5 // starts thick, narrows to crisp rim
      rimGlowBlur = (1 - pExpo) * 20 + 4
      rimOpacity = pExpo
      bodyOpacity = Math.max(0, (enterProgress - 0.3) / 0.7)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Rim breathes gently — light intensity pulses
      rimWidth = 1.5 + Math.sin(holdProgress * Math.PI * 3) * 0.5
      rimGlowBlur = 6 + Math.sin(holdProgress * Math.PI * 2.5) * 2
      rimOpacity = 1
      bodyOpacity = 1
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.08
      rimWidth = 1.5 + p * 6
      rimGlowBlur = 6 + p * 25
      rimOpacity = 1 - exitProgress * 0.7
      bodyOpacity = 1 - exitProgress
    }

    // Rim light shifts slightly with camera drift
    const rimShiftX = Math.sin(time * 0.6) * 2
    const rimShiftY = -2 + Math.sin(time * 0.4) * 1

    return (
      <>
        {/* Outer rim glow bloom */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${rimShiftX * 0.5}px), calc(-50% + ${rimShiftY * 0.5}px)) scale(${scale * 1.06})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'transparent',
            WebkitTextStroke: `${rimWidth + 8}px rgba(255,255,255,${rimOpacity * 0.12})`,
            filter: `blur(${rimGlowBlur * 1.5}px)`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Mid rim glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${rimShiftX}px), calc(-50% + ${rimShiftY}px)) scale(${scale * 1.02})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'transparent',
            WebkitTextStroke: `${rimWidth + 2}px rgba(200,230,255,${rimOpacity * 0.5})`,
            filter: `blur(${rimGlowBlur * 0.6}px)`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Crisp rim — the true edge highlight */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'transparent',
            WebkitTextStroke: `${rimWidth}px rgba(230,245,255,${rimOpacity * 0.95})`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Dark body fill — the backlit subject */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(8,10,15,0.92)',
            opacity: bodyOpacity * opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function RimLightEdgeComponent(props: MotionGraphicProps<RimLightEdgeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rim-light-edge',
  title: 'Kinetic Rim Light Edge',
  description: 'Studio rim lighting traces the silhouette of each letter — a cold backlight traces crisp edges around dark letterforms with a subtle glow bloom',
  tags: ['kinetic', 'typography', 'rim', 'light', 'backlit', 'silhouette', 'studio', 'cinematic', 'edge'],
  category: 'captions',
  component: RimLightEdgeComponent as any,
  defaultConfig: {
    words: ['EDGE', 'LIT', 'BACK', 'GLOW'],
    colors: ['#0a0c12', '#080a10', '#0a0c12', '#080a10'],
    bgColor: '#060810',
    cycleDuration: 1.4,
    rimColor: '#C8E0FF',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EDGE', 'LIT', 'BACK', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0a0c12', '#080a10', '#0a0c12', '#080a10'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'rimColor', label: 'Rim Light Color', type: 'color', defaultValue: '#C8E0FF', group: 'Animation' },
  ],
})
