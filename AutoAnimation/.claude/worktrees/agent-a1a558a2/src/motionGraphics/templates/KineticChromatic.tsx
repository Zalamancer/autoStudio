import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChromaticConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Lens distortion — barrel distortion hotspot
    const hotspotX = 50 + Math.sin(time * 0.3) * 10
    const hotspotY = 50 + Math.cos(time * 0.4) * 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Lens element internal reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${hotspotX}% ${hotspotY}%, rgba(255,255,255,0.02), transparent 40%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Chromatic fringe at edges — colored rings at periphery */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(100,0,255,0.03), inset 0 0 120px rgba(255,0,50,0.02)',
            pointerEvents: 'none',
          }}
        />
        {/* Barrel distortion vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle lens flare streak */}
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '10%',
            right: '10%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)',
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 59 + 43

    // RGB channel separation amounts
    let redX = 0, redY = 0
    let greenX = 0, greenY = 0
    let blueX = 0, blueY = 0
    let mainOpacity = 0

    if (phase === 'enter') {
      // Channels fly in from different directions and converge
      const spread = (1 - enterProgress) * 25
      redX = -spread * 1.2
      redY = -spread * 0.3
      greenX = 0
      greenY = spread * 0.5
      blueX = spread * 1.2
      blueY = -spread * 0.3
      mainOpacity = enterProgress
    } else if (phase === 'hold') {
      // Subtle chromatic breathing — channels slightly misaligned then reconverge
      const breathe = Math.sin(f * 0.08 + seed)
      const microShift = breathe * 3
      redX = -microShift
      redY = -microShift * 0.3
      greenX = 0
      greenY = microShift * 0.2
      blueX = microShift
      blueY = -microShift * 0.3
      mainOpacity = 1
    } else {
      // Channels split apart as text exits
      const spread = exitProgress * 30
      redX = -spread * 0.8
      redY = spread * 0.5
      greenX = spread * 0.4
      greenY = -spread * 0.6
      blueX = spread * 0.6
      blueY = spread * 0.4
      mainOpacity = 1 - exitProgress
    }

    const fontSize = 'clamp(40px, 10vw, 140px)'
    const fontStyle = {
      fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
      fontSize,
      fontWeight: 800 as const,
      whiteSpace: 'nowrap' as const,
      letterSpacing: 3,
      textTransform: 'uppercase' as const,
    }

    return (
      <>
        {/* Red channel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${redX}px), calc(-50% + ${redY}px))`,
            ...fontStyle,
            color: 'rgba(255,30,30,0.7)',
            opacity: mainOpacity * 0.8,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Green channel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${greenX}px), calc(-50% + ${greenY}px))`,
            ...fontStyle,
            color: 'rgba(30,255,30,0.7)',
            opacity: mainOpacity * 0.8,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Blue channel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${blueX}px), calc(-50% + ${blueY}px))`,
            ...fontStyle,
            color: 'rgba(60,60,255,0.7)',
            opacity: mainOpacity * 0.8,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Converged main text — visible when channels align */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            ...fontStyle,
            color,
            opacity: mainOpacity * Math.max(0, 1 - (Math.abs(redX) + Math.abs(blueX)) / 20),
            textShadow: '0 0 4px rgba(255,255,255,0.2)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ChromaticComponent(props: MotionGraphicProps<ChromaticConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chromatic',
  title: 'Kinetic Chromatic',
  description: 'Chromatic aberration: text splits into RGB channels that misalign and reconverge with lens distortion fringing',
  tags: ['kinetic', 'typography', 'chromatic', 'aberration', 'rgb', 'lens', 'distortion', 'optical'],
  category: 'captions',
  component: ChromaticComponent as any,
  defaultConfig: {
    words: ['PRISM', 'SPLIT', 'SHIFT', 'FOCUS'],
    colors: ['#ffffff', '#f0f0f0', '#e8e8e8', '#ffffff'],
    bgColor: '#080808',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRISM', 'SPLIT', 'SHIFT', 'FOCUS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#f0f0f0', '#e8e8e8', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
