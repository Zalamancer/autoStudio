import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const angle = 135 + Math.sin(time * 0.3) * 10
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#000000'
            ? `linear-gradient(${angle}deg, #FF71CE 0%, #01CDFE 50%, #05FFA1 100%)`
            : bgColor,
        }}
      >
        {/* Scan lines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let glitchOffset = 0

    const seed = index * 83 + 29

    if (phase === 'enter') {
      // Glitch slide in with chromatic aberration
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateX = (1 - eased) * ((seed % 2 === 0) ? 100 : -100)
      glitchOffset = (1 - enterProgress) * 6
    } else if (phase === 'hold') {
      opacity = 1
      // Slow wave motion + slight horizontal glitch offset
      translateX = Math.sin(Date.now() * 0.002 + seed) * 3
      glitchOffset = Math.abs(Math.sin(Date.now() * 0.008 + seed * 5)) < 0.1 ? 4 : 0
    } else {
      // Dissolve with scan lines
      opacity = 1 - exitProgress
      glitchOffset = exitProgress * 3
    }

    const shadowColors = ['#FF71CE', '#01CDFE', '#05FFA1', '#B967FF']
    const s1 = shadowColors[index % shadowColors.length]
    const s2 = shadowColors[(index + 1) % shadowColors.length]

    return (
      <>
        {/* RGB split layers during enter/glitch */}
        {glitchOffset > 0.5 && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${translateX - glitchOffset}px), -50%)`,
                fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 900,
                letterSpacing: 8,
                color: 'rgba(255,113,206,0.5)',
                whiteSpace: 'nowrap',
                mixBlendMode: 'screen',
                opacity: opacity * 0.6,
              }}
            >
              {word}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${translateX + glitchOffset}px), -50%)`,
                fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 900,
                letterSpacing: 8,
                color: 'rgba(1,205,254,0.5)',
                whiteSpace: 'nowrap',
                mixBlendMode: 'screen',
                opacity: opacity * 0.6,
              }}
            >
              {word}
            </div>
          </>
        )}
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%)`,
            opacity,
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            letterSpacing: 8,
            color,
            textShadow: `3px 3px 0 ${s1}, -2px -2px 0 ${s2}, 0 0 20px rgba(185,103,255,0.4)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function VaporwaveComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vaporwave',
  title: 'Kinetic Vaporwave',
  description: 'Vaporwave 80s/90s retro aesthetic with gradient background, glitch chromatic aberration, and scan lines',
  tags: ['kinetic', 'typography', 'vaporwave', 'retro', '80s', 'aesthetic', 'glitch'],
  category: 'captions',
  component: VaporwaveComponent as any,
  defaultConfig: {
    words: ['DREAM', 'WAVE', 'RETRO', 'VIBE'],
    colors: ['#FF71CE', '#01CDFE', '#05FFA1', '#B967FF'],
    bgColor: '#000000',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAM', 'WAVE', 'RETRO', 'VIBE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF71CE', '#01CDFE', '#05FFA1', '#B967FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
