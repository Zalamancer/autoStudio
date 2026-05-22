import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RearProjectConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Screen translucency ripple — slow horizontal undulation
    const ripple = Math.sin(time * 1.3) * 0.5 + Math.sin(time * 2.7) * 0.3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Deep dark studio backing */}
        <div style={{ position: 'absolute', inset: 0, background: '#050508' }} />
        {/* Back light source — warm pool behind screen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 70% 60% at 50% ${50 + ripple * 3}%, rgba(180,160,220,0.18) 0%, rgba(100,80,160,0.08) 50%, transparent 80%)`,
          }}
        />
        {/* Translucent screen material — frosted appearance */}
        <div
          style={{
            position: 'absolute',
            inset: '6% 8%',
            background: 'rgba(200,190,230,0.04)',
            backdropFilter: 'blur(0.5px)',
            border: '1px solid rgba(200,190,230,0.08)',
          }}
        />
        {/* Screen surface texture — fine grain */}
        <div
          style={{
            position: 'absolute',
            inset: '6% 8%',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,190,230,0.015) 2px, rgba(200,190,230,0.015) 3px)',
          }}
        />
        {/* Edge light bleed from rear */}
        <div
          style={{
            position: 'absolute',
            inset: '6% 8%',
            boxShadow: `inset 0 0 80px rgba(160,140,220,${0.06 + ripple * 0.01})`,
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 24

    // Rear projection: text materializes from behind screen
    // Starts as backlit silhouette (bright behind, dark in front), resolves to full color
    let opacity = 0
    let blurPx = 0
    let backglowOpacity = 0
    let translateZ = 0 // simulated depth via scale
    let scale = 1

    if (phase === 'enter') {
      // First half: ghostly backlit form emerges
      if (enterProgress < 0.5) {
        const p = enterProgress / 0.5
        opacity = p * 0.4   // stays dim — backlit silhouette
        backglowOpacity = p
        blurPx = (1 - p) * 10 + 2
        scale = 1.05 - p * 0.05  // slight shrink as it comes forward
        translateZ = (1 - p) * 8
      } else {
        // Second half: resolve to full color as light wraps around
        const p = (enterProgress - 0.5) / 0.5
        opacity = 0.4 + p * 0.6
        backglowOpacity = 1 - p * 0.6
        blurPx = 2 * (1 - p)
        scale = 1
        translateZ = 0
      }
    } else if (phase === 'hold') {
      opacity = 1
      backglowOpacity = 0.3 + 0.05 * Math.sin(time * 1.8)
      blurPx = 0
      scale = 1
    } else {
      opacity = 1 - exitProgress
      backglowOpacity = (1 - exitProgress) * 0.3
      blurPx = exitProgress * 4
      scale = 1 + exitProgress * 0.03
    }

    return (
      <>
        {/* Rear backglow — diffuse light coming through screen */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale + 0.12}) translateZ(${translateZ}px)`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(42px, 10.5vw, 145px)',
            fontWeight: 800,
            color: 'rgba(200,180,255,1)',
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            filter: `blur(18px)`,
            opacity: backglowOpacity,
          }}
        >
          {word}
        </div>
        {/* Screen diffusion halo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale + 0.04})`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(42px, 10.5vw, 145px)',
            fontWeight: 800,
            color: 'rgba(220,200,255,0.6)',
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            filter: `blur(6px)`,
            opacity: opacity * 0.5,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(42px, 10.5vw, 145px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            filter: `blur(${blurPx}px)`,
            textShadow: `0 0 20px rgba(200,180,255,${opacity * 0.4})`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function RearProjectComponent(props: MotionGraphicProps<RearProjectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rear-project',
  title: 'Kinetic Rear Projection',
  description: 'Rear projection effect: text materializes as a backlit silhouette through frosted screen, resolving from diffuse glow to sharp lettering',
  tags: ['kinetic', 'typography', 'rear-projection', 'cinema', 'film', 'screen', 'translucent', 'backlit'],
  category: 'captions',
  component: RearProjectComponent as any,
  defaultConfig: {
    words: ['BEHIND', 'THE', 'SCREEN'],
    colors: ['#e8e0ff', '#d0c8f8', '#e8e0ff'],
    bgColor: '#050508',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BEHIND', 'THE', 'SCREEN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8e0ff', '#d0c8f8', '#e8e0ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050508', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 6, group: 'Timing' },
  ],
})
