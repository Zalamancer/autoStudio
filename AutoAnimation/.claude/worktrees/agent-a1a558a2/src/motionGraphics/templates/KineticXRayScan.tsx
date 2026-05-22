import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface XRayScanConfig extends KineticBaseConfig {}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Moving scan line
    const scanY = ((time * 60) % (height * 1.4)) - height * 0.2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* X-ray film grain noise */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(100,200,255,0.008) 1px,
              rgba(100,200,255,0.008) 2px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scanY,
            height: 3,
            background: 'linear-gradient(90deg, transparent 5%, rgba(100,200,255,0.25) 20%, rgba(100,200,255,0.4) 50%, rgba(100,200,255,0.25) 80%, transparent 95%)',
            boxShadow: '0 0 15px rgba(100,200,255,0.15), 0 0 30px rgba(100,200,255,0.08)',
            pointerEvents: 'none',
          }}
        />
        {/* X-ray border frame */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            border: '1px solid rgba(100,200,255,0.1)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
        {/* Patient label */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 16,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(100,200,255,0.4)',
            letterSpacing: 1,
          }}
        >
          RADIOGRAPH &bull; DIGITAL
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // X-ray scan reveal: skeleton outline -> flesh layer -> surface
      // Phase 1 (0-0.4): wireframe/skeleton outline only
      // Phase 2 (0.4-0.7): inner flesh fills in
      // Phase 3 (0.7-1.0): full surface resolves
      const scanPhase = enterProgress < 0.4 ? 0 : enterProgress < 0.7 ? 1 : 2
      const localT = scanPhase === 0 ? enterProgress / 0.4 : scanPhase === 1 ? (enterProgress - 0.4) / 0.3 : (enterProgress - 0.7) / 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci / (chars.length + 1) * 0.2
            const adjusted = Math.max(0, enterProgress - charDelay)
            const charOpacity = Math.min(1, adjusted * 3)

            let charColor: string
            let textStroke = ''
            let fill = 'currentColor'
            let shadow = ''

            if (scanPhase === 0) {
              // Skeleton: outline only, x-ray blue
              charColor = 'transparent'
              textStroke = `1px rgba(100,200,255,${0.5 + localT * 0.4})`
              fill = 'transparent'
              shadow = `0 0 ${5 + localT * 10}px rgba(100,200,255,0.3)`
            } else if (scanPhase === 1) {
              // Flesh: filling in with translucent interior
              charColor = `rgba(100,200,255,${localT * 0.4})`
              textStroke = `1px rgba(100,200,255,${0.8})`
              shadow = `0 0 15px rgba(100,200,255,${0.3 + localT * 0.2})`
            } else {
              // Surface: full color resolves
              const blend = easeOutQuad(localT)
              charColor = color
              shadow = `0 0 ${20 - blend * 10}px rgba(100,200,255,${0.3 * (1 - blend)}), 0 0 10px ${color}44`
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(44px, 12vw, 150px)',
                  fontWeight: 800,
                  color: charColor,
                  WebkitTextStroke: textStroke as any,
                  textShadow: shadow,
                  opacity: charOpacity,
                  whiteSpace: 'nowrap',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable with subtle x-ray pulse glow
      const pulse = Math.sin(holdProgress * Math.PI * 4) * 0.15
      const glowSize = 12 + Math.sin(holdProgress * Math.PI * 3) * 5

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 800,
            color,
            textShadow: `0 0 ${glowSize}px ${color}55, 0 0 ${glowSize * 2}px ${color}22`,
            opacity: 0.9 + pulse * 0.1,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    } else {
      // Reverse scan: surface -> flesh -> skeleton -> gone
      const scanPhase = exitProgress < 0.3 ? 0 : exitProgress < 0.6 ? 1 : 2
      const localT = scanPhase === 0 ? exitProgress / 0.3 : scanPhase === 1 ? (exitProgress - 0.3) / 0.3 : (exitProgress - 0.6) / 0.4

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci / (chars.length + 1) * 0.15
            const adjusted = Math.max(0, exitProgress - charDelay)

            let charColor: string
            let textStroke = ''
            let shadow = ''
            let charOpacity = 1

            if (scanPhase === 0) {
              // Losing surface color -> x-ray blue
              const blend = localT
              charColor = color
              shadow = `0 0 ${blend * 15}px rgba(100,200,255,${blend * 0.4})`
              charOpacity = 1
            } else if (scanPhase === 1) {
              // Flesh fading
              charColor = `rgba(100,200,255,${0.5 * (1 - localT)})`
              textStroke = `1px rgba(100,200,255,${0.7 * (1 - localT)})`
              shadow = `0 0 ${15 * (1 - localT)}px rgba(100,200,255,0.3)`
              charOpacity = 0.8 - localT * 0.3
            } else {
              // Skeleton fading out
              charColor = 'transparent'
              textStroke = `1px rgba(100,200,255,${0.5 * (1 - localT)})`
              shadow = `0 0 ${8 * (1 - localT)}px rgba(100,200,255,0.2)`
              charOpacity = Math.max(0, 0.5 - localT * 0.6)
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(44px, 12vw, 150px)',
                  fontWeight: 800,
                  color: charColor,
                  WebkitTextStroke: textStroke as any,
                  textShadow: shadow,
                  opacity: charOpacity,
                  whiteSpace: 'nowrap',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function XRayScanComponent(props: MotionGraphicProps<XRayScanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-xray-scan',
  title: 'Kinetic X-Ray Scan',
  description: 'Medical X-ray scan reveal: text appears as wireframe skeleton, fills with translucent flesh, then resolves to full surface. Scanline and radiograph UI overlay.',
  tags: ['kinetic', 'typography', 'xray', 'medical', 'scan', 'skeleton', 'reveal', 'science'],
  category: 'captions',
  component: XRayScanComponent as any,
  defaultConfig: {
    words: ['SCAN', 'BONE', 'XRAY', 'DEEP'],
    colors: ['#E0F0FF', '#B8D8F0', '#90C0E0', '#70A8D0'],
    bgColor: '#040810',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'BONE', 'XRAY', 'DEEP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0F0FF', '#B8D8F0', '#90C0E0', '#70A8D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
