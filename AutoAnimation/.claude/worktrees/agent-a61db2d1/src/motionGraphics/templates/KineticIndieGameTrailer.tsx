import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Brand Aesthetic: Indie Game Trailer (Hollow Knight / Celeste / Hades)
// Deep atmospheric dark bg with particle dust motes. Words pixel-draw
// in letter by letter with a scan-line shimmer, then glow on hold.
// Each character has a subtle chromatic aberration split during enter.
// Exit: dissolve into floating particles drifting up.

interface IndieGameTrailerConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Atmospheric dust motes
    const motes = Array.from({ length: 20 }, (_, i) => {
      const seed = i * 71 + 37
      const x = ((seed * 13 + 500) % 95) + 2
      const baseY = ((seed * 7 + 200) % 90) + 5
      const y = baseY - (time * 3 + i * 5) % 100
      const size = 1 + (seed % 2)
      const moteOp = 0.1 + (seed % 4) * 0.05

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${((y + 100) % 100)}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#8888ff',
            opacity: moteOp,
            filter: 'blur(0.5px)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#0d0a1a'
            ? 'radial-gradient(ellipse at 50% 60%, #1a1030 0%, #0d0a1a 70%)'
            : bgColor,
        }}
      >
        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }}
        />
        {motes}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let glowIntensity = 0

    if (phase === 'enter') {
      const charsVisible = Math.ceil(enterProgress * word.length)
      opacity = Math.min(enterProgress / 0.2, 1)
      glowIntensity = 0

      // Chromatic aberration on enter
      const aberration = (1 - enterProgress) * 3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            position: 'absolute' as any,
          }}
        >
          {/* Red channel offset */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% - ${aberration}px), -50%)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              color: '#ff4444',
              opacity: aberration > 0.5 ? 0.5 : 0,
              mixBlendMode: 'screen',
            }}
          >
            {word.substring(0, charsVisible)}
          </div>
          {/* Blue channel offset */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${aberration}px), -50%)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              color: '#4444ff',
              opacity: aberration > 0.5 ? 0.5 : 0,
              mixBlendMode: 'screen',
            }}
          >
            {word.substring(0, charsVisible)}
          </div>
          {/* Main text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 4,
              whiteSpace: 'nowrap',
              color,
            }}
          >
            {word.substring(0, charsVisible)}
            <span style={{ opacity: 0.7, color: '#8888ff' }}>_</span>
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      glowIntensity = 1
      opacity = 1
      translateY = Math.sin(Date.now() * 0.001 + index) * 3
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 30
      glowIntensity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 9vw, 130px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 4,
          whiteSpace: 'nowrap',
          color,
          textShadow: glowIntensity > 0
            ? `0 0 ${20 * glowIntensity}px ${color}, 0 0 ${40 * glowIntensity}px ${color}44`
            : 'none',
        }}
      >
        {word}
      </div>
    )
  },
}

function IndieGameTrailerComponent(props: MotionGraphicProps<IndieGameTrailerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-indie-game-trailer',
  title: 'Kinetic Indie Game Trailer',
  description: 'Hollow Knight/Celeste atmosphere — pixel draw-in with chromatic aberration, dust motes, scan lines, glow hold',
  tags: ['kinetic', 'typography', 'indie', 'game', 'trailer', 'atmospheric', 'glow', 'brand'],
  category: 'captions',
  component: IndieGameTrailerComponent as any,
  defaultConfig: {
    words: ['AWAKEN', 'EXPLORE', 'SURVIVE', 'ASCEND'],
    colors: ['#a0a0ff', '#80d4ff', '#ffaa44', '#ff8080'],
    bgColor: '#0d0a1a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AWAKEN', 'EXPLORE', 'SURVIVE', 'ASCEND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#a0a0ff', '#80d4ff', '#ffaa44', '#ff8080'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
