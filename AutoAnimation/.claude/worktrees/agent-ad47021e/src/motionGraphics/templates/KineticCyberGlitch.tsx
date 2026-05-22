import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CyberGlitchConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    const scanY = (frame * 2.5) % 100
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,128,0.02) 2px, rgba(255,0,128,0.02) 4px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 2,
            background: 'rgba(255,0,128,0.1)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    const seed = index * 173 + 59

    if (phase === 'enter') {
      opacity = enterProgress > 0.3 ? 1 : enterProgress / 0.3
      translateX = enterProgress < 0.6 ? ((seed % 30) - 15) * (1 - enterProgress / 0.6) : 0

      const barCount = 5
      const bars = Array.from({ length: barCount }, (_, i) => {
        const top = (i / barCount) * 100
        const height = 100 / barCount
        const show = enterProgress > i / barCount * 0.8
        return show ? (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${top}%`,
              left: 0,
              right: 0,
              height: `${height}%`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: `-${top}%`,
                left: 0,
                right: 0,
                height: `${100 / height * 100}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateX(${((seed + i * 31) % 10) - 5}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 11vw, 160px)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 6,
                  color,
                  textShadow: `0 0 10px ${color}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {word}
              </span>
            </div>
          </div>
        ) : null
      })

      return (
        <div style={{ position: 'absolute', inset: 0, opacity }}>
          {bars}
          {enterProgress < 0.5 && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% - 3px), -50%)`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 11vw, 160px)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 6,
                  color: 'rgba(255,0,0,0.4)',
                  whiteSpace: 'nowrap',
                  mixBlendMode: 'screen',
                }}
              >
                {word}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + 3px), -50%)`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 11vw, 160px)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 6,
                  color: 'rgba(0,0,255,0.4)',
                  whiteSpace: 'nowrap',
                  mixBlendMode: 'screen',
                }}
              >
                {word}
              </div>
            </>
          )}
        </div>
      )
    } else if (phase === 'hold') {
      opacity = 1
      const glitchBurst = holdProgress > 0.4 && holdProgress < 0.5
      const burstOffset = glitchBurst ? ((seed * 7) % 8) - 4 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${burstOffset}px), -50%)`,
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: glitchBurst
              ? `3px 0 ${color}, -3px 0 rgba(255,0,128,0.5), 0 0 15px ${color}`
              : `0 0 10px ${color}`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    } else {
      opacity = 1 - exitProgress
      translateX = exitProgress * ((seed % 2 === 0) ? 40 : -40)

      return (
        <>
          {exitProgress > 0.3 && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${translateX - 4}px), -50%)`,
                  opacity: opacity * 0.5,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 11vw, 160px)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 6,
                  color: 'rgba(255,0,0,0.4)',
                  whiteSpace: 'nowrap',
                  mixBlendMode: 'screen',
                }}
              >
                {word}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${translateX + 4}px), -50%)`,
                  opacity: opacity * 0.5,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 11vw, 160px)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 6,
                  color: 'rgba(0,0,255,0.4)',
                  whiteSpace: 'nowrap',
                  mixBlendMode: 'screen',
                }}
              >
                {word}
              </div>
            </>
          )}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${translateX}px), -50%)`,
              opacity,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 160px)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 6,
              color,
              textShadow: `0 0 10px ${color}`,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </>
      )
    }
  },
}

function CyberGlitchComponent(props: MotionGraphicProps<CyberGlitchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cyber-glitch',
  title: 'Kinetic Cyber Glitch',
  description: 'Cyberpunk glitch distortion with horizontal slicing, RGB split, and scan lines',
  tags: ['kinetic', 'typography', 'cyberpunk', 'glitch', 'digital'],
  category: 'captions',
  component: CyberGlitchComponent as any,
  defaultConfig: {
    words: ['CYBER', 'PUNK', 'HACK', 'CODE'],
    colors: ['#FF0080', '#00FF80', '#8000FF', '#FF8000'],
    bgColor: '#0d0015',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CYBER', 'PUNK', 'HACK', 'CODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF0080', '#00FF80', '#8000FF', '#FF8000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0015', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
