import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HologramScanConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, height, frame }: BackgroundRenderProps) => {
    // Horizontal scan lines overlay
    const scanLineY = ((frame * 3) % (height + 40)) - 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Holographic scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 180, 255, 0.02) 3px, rgba(0, 180, 255, 0.02) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* Moving scan bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scanLineY,
            height: 3,
            background: 'linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.3), rgba(0, 220, 255, 0.5), rgba(0, 180, 255, 0.3), transparent)',
            boxShadow: '0 0 12px rgba(0, 180, 255, 0.2), 0 0 30px rgba(0, 180, 255, 0.1)',
          }}
        />
        {/* Faint holographic bloom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(0, 150, 255, 0.03) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height, frame }: WordRenderProps) => {
    if (phase === 'enter') {
      // Scan line sweeps down revealing the text
      const scanY = enterProgress * 100
      const opacity = Math.min(1, enterProgress * 1.5)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Ghost hologram duplicate (offset) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translateX(2px) translateY(1px)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'rgba(0, 180, 255, 0.15)',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              clipPath: `inset(0 0 ${100 - scanY}% 0)`,
            }}
          >
            {word}
          </div>
          {/* Main text revealed by scan */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}, 0 0 20px rgba(0, 180, 255, 0.3)`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity,
              clipPath: `inset(0 0 ${100 - scanY}% 0)`,
            }}
          >
            {word}
          </div>
          {/* Scan line at reveal edge */}
          <div
            style={{
              position: 'absolute',
              left: -20,
              right: -20,
              top: `${scanY}%`,
              height: 2,
              background: 'rgba(0, 220, 255, 0.6)',
              boxShadow: '0 0 10px rgba(0, 220, 255, 0.4)',
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // Hologram flicker/transparency effect
      const f = frame ?? 0
      const flicker = Math.sin(f * 0.3) > 0.8 ? 0.7 : 1
      const offsetX = Math.sin(f * 0.15) * 1.5

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Hologram ghost */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translateX(${offsetX}px)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'rgba(0, 180, 255, 0.12)',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 25px rgba(0, 180, 255, 0.25)`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity: flicker,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: scan line sweeps up, hiding text
      const scanY = (1 - exitProgress) * 100
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              clipPath: `inset(${100 - scanY}% 0 0 0)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function HologramScanComponent(props: MotionGraphicProps<HologramScanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hologram-scan',
  title: 'Kinetic Hologram Scan',
  description: 'Holographic scan effect with sweeping reveal line, blue tint, scan lines, and subtle transparency flicker',
  tags: ['kinetic', 'typography', 'hologram', 'scan', 'futuristic', 'tech'],
  category: 'captions',
  component: HologramScanComponent as any,
  defaultConfig: {
    words: ['SCAN', 'DETECT', 'MATCH', 'FOUND'],
    colors: ['#00BBFF', '#00DDFF', '#00BBFF', '#00FF88'],
    bgColor: '#040810',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'DETECT', 'MATCH', 'FOUND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00BBFF', '#00DDFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
