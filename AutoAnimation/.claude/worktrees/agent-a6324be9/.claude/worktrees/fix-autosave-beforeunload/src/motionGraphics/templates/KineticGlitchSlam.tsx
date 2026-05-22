import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GlitchSlamConfig extends KineticBaseConfig {
  scanLineOpacity: number
  rgbSplitAmount: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    const scanLineY = ((frame * 3) % 100)
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)',
          }}
        />
        {/* Moving scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanLineY}%`,
            height: 2,
            background: 'rgba(0,255,0,0.15)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scaleX = 1
    let translateX = 0
    let clipPath = 'none'

    // Deterministic pseudo-random from index
    const seed = index * 137 + 42

    if (phase === 'enter') {
      opacity = enterProgress > 0.3 ? 1 : enterProgress / 0.3
      scaleX = enterProgress < 0.4 ? 3 : 1 + (1 - enterProgress) * 0.2
      // Glitch offset
      translateX = enterProgress < 0.5 ? ((seed % 20) - 10) * (1 - enterProgress * 2) : 0
      if (enterProgress < 0.6) {
        const clipTop = ((seed * 7 + 12345) % 100)
        const clipBot = ((seed * 3 + 67890) % 100)
        clipPath = `inset(${Math.min(clipTop, clipBot)}% 0 ${100 - Math.max(clipTop, clipBot)}% 0)`
      }
    } else if (phase === 'hold') {
      opacity = 1
      scaleX = 1
    } else {
      opacity = 1 - exitProgress
      scaleX = 1 + exitProgress * 2
      translateX = exitProgress * ((seed % 2 === 0) ? 50 : -50)
    }

    return (
      <>
        {/* RGB split - red channel */}
        {phase === 'enter' && enterProgress < 0.7 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${translateX - 3}px), -50%) scaleX(${scaleX})`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'rgba(255,0,0,0.5)',
              whiteSpace: 'nowrap',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* RGB split - blue channel */}
        {phase === 'enter' && enterProgress < 0.7 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${translateX + 3}px), -50%) scaleX(${scaleX})`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'rgba(0,0,255,0.5)',
              whiteSpace: 'nowrap',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%) scaleX(${scaleX})`,
            opacity,
            clipPath: clipPath !== 'none' ? clipPath : undefined,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            textShadow: `0 0 10px ${color}`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function GlitchSlamComponent(props: MotionGraphicProps<GlitchSlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-glitch-slam',
  title: 'Kinetic Glitch Slam',
  description: 'Cyberpunk glitch text with RGB split, scan lines, text scramble, and digital noise',
  tags: ['kinetic', 'typography', 'glitch', 'cyber'],
  category: 'captions',
  component: GlitchSlamComponent as any,
  defaultConfig: {
    words: ['SYSTEM', 'ERROR', 'REBOOT', 'HACK'],
    colors: ['#00FF41', '#FF0040', '#00FFFF', '#FFFF00'],
    bgColor: '#0a0a0a',
    cycleDuration: 1,
    scanLineOpacity: 0.03,
    rgbSplitAmount: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SYSTEM', 'ERROR', 'REBOOT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF41', '#FF0040', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
