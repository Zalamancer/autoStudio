import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VHSTrackingConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Horizontal distortion bar position
    const barY = ((time * 25) % 120) - 10
    // Secondary bar
    const bar2Y = ((time * 18 + 40) % 120) - 10

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px)',
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal distortion bar 1 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${barY}%`,
            height: 8,
            background: 'linear-gradient(0deg, rgba(255,255,255,0.08), rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal distortion bar 2 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${bar2Y}%`,
            height: 4,
            background: 'linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
        {/* Color bleed overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(255,0,0,0.02) 0%, rgba(0,0,255,0.02) 50%, rgba(255,0,0,0.02) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* VHS tracking noise band */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${((time * 35 + 60) % 130) - 15}%`,
            height: 20,
            background: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 6px)',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const seed = index * 97 + 31
    const f = frame ?? 0
    let opacity = 0
    let translateX = 0

    if (phase === 'enter') {
      // Appear through static — rapid flicker with RGB offset
      if (enterProgress < 0.4) {
        const flicker = Math.sin(enterProgress * 80 + seed) > 0
        opacity = flicker ? enterProgress / 0.4 : enterProgress / 0.4 * 0.3
      } else {
        opacity = 0.7 + enterProgress * 0.3
      }
      // Horizontal tracking distortion
      translateX = (1 - enterProgress) * ((seed % 2 === 0) ? 12 : -12)
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle jitter
      translateX = Math.sin(f * 0.5 + seed) * 1.5
    } else {
      opacity = 1 - exitProgress
      translateX = exitProgress * ((seed % 2 === 0) ? 8 : -8)
    }

    // RGB offset amount
    const rgbShift = phase === 'enter' ? (1 - enterProgress) * 4 : phase === 'exit' ? exitProgress * 3 : 0.5

    return (
      <>
        {/* Red channel offset */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX - rgbShift}px), calc(-50% + ${rgbShift * 0.3}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(255,0,0,0.4)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 3,
            opacity: opacity * 0.6,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Blue channel offset */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX + rgbShift}px), calc(-50% - ${rgbShift * 0.3}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(0,100,255,0.4)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 3,
            opacity: opacity * 0.6,
            mixBlendMode: 'screen',
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
            transform: `translate(calc(-50% + ${translateX}px), -50%)`,
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 3,
            textShadow: `0 0 4px rgba(255,255,255,0.3)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function VHSTrackingComponent(props: MotionGraphicProps<VHSTrackingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vhs-tracking',
  title: 'Kinetic VHS Tracking',
  description: 'VHS tape tracking effect with scan lines, color bleed, horizontal distortion bars, and RGB offset',
  tags: ['kinetic', 'typography', 'vhs', 'retro', 'tracking', 'analog', 'aesthetic'],
  category: 'captions',
  component: VHSTrackingComponent as any,
  defaultConfig: {
    words: ['REWIND', 'PLAY', 'PAUSE', 'STOP'],
    colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REWIND', 'PLAY', 'PAUSE', 'STOP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
