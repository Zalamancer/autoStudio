import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MandalaRevealConfig extends KineticBaseConfig {
  mandalaLayers: number
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInOutSine(t: number): number { return -(Math.cos(Math.PI * t) - 1) / 2 }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const baseRadius = Math.min(width, height) * 0.35

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Mandala layers */}
        {Array.from({ length: 4 }, (_, layerIdx) => {
          const layerRadius = baseRadius * (0.4 + layerIdx * 0.2)
          const dotCount = 8 + layerIdx * 4
          const rotSpeed = (layerIdx % 2 === 0 ? 1 : -1) * (8 + layerIdx * 3)
          const rotation = time * rotSpeed

          return (
            <div key={layerIdx}>
              {/* Ring */}
              <div
                style={{
                  position: 'absolute',
                  top: cy,
                  left: cx,
                  width: layerRadius * 2,
                  height: layerRadius * 2,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  borderRadius: '50%',
                  border: `1px solid rgba(200,180,255,${0.05 - layerIdx * 0.008})`,
                }}
              />

              {/* Dots along the ring */}
              {Array.from({ length: dotCount }, (_, dotIdx) => {
                const angle = ((dotIdx / dotCount) * Math.PI * 2) + (rotation * Math.PI) / 180
                const dx = cx + Math.cos(angle) * layerRadius
                const dy = cy + Math.sin(angle) * layerRadius
                const pulse = 0.5 + Math.sin(time * 2 + dotIdx + layerIdx) * 0.5
                const dotOpacity = 0.08 + pulse * 0.06
                const dotSize = 2 + pulse * 2

                return (
                  <div
                    key={`${layerIdx}-${dotIdx}`}
                    style={{
                      position: 'absolute',
                      left: dx,
                      top: dy,
                      width: dotSize,
                      height: dotSize,
                      borderRadius: '50%',
                      background: `rgba(200,180,255,${dotOpacity})`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )
              })}
            </div>
          )
        })}

        {/* Center ornament */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2 + time * 0.3
          const len = Math.min(width, height) * 0.04
          const x1 = cx + Math.cos(angle) * len * 0.3
          const y1 = cy + Math.sin(angle) * len * 0.3
          const x2 = cx + Math.cos(angle) * len
          const y2 = cy + Math.sin(angle) * len

          return (
            <div
              key={`center-${i}`}
              style={{
                position: 'absolute',
                left: Math.min(x1, x2),
                top: Math.min(y1, y2),
                width: Math.abs(x2 - x1) || 1,
                height: Math.abs(y2 - y1) || 1,
                background: 'rgba(200,180,255,0.1)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    let opacity = 0
    let scale = 1
    let rotation = 0
    let clipPath = 'inset(0 0 0 0)'

    if (phase === 'enter') {
      // Reveal from mandala center — radial wipe
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.7 + eased * 0.3
      rotation = (1 - eased) * 15
      const clipPercent = (1 - eased) * 50
      clipPath = `inset(${clipPercent}% ${clipPercent}% ${clipPercent}% ${clipPercent}%)`
    } else if (phase === 'hold') {
      opacity = 1
      // Slow rotation during hold
      rotation = Math.sin(holdProgress * Math.PI * 2) * 1.5
    } else {
      const eased = easeInOutSine(exitProgress)
      opacity = 1 - eased
      scale = 1 - eased * 0.2
      rotation = eased * -10
      const clipPercent = eased * 50
      clipPath = `inset(${clipPercent}% ${clipPercent}% ${clipPercent}% ${clipPercent}%)`
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          clipPath,
          fontFamily: "'Georgia', 'Palatino Linotype', serif",
          fontSize: 'clamp(36px, 10vw, 130px)',
          fontWeight: 400,
          letterSpacing: 8,
          whiteSpace: 'nowrap',
          color,
          textShadow: `0 0 15px ${color}40, 0 0 30px ${color}20`,
          textTransform: 'uppercase',
        }}
      >
        {word}
      </div>
    )
  },
}

function MandalaRevealComponent(props: MotionGraphicProps<MandalaRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mandala-reveal',
  title: 'Kinetic Mandala Reveal',
  description: 'Text appears within rotating mandala patterns with radial wipe reveal, orbital dots, and geometric center ornament',
  tags: ['kinetic', 'typography', 'meditation', 'mandala', 'sacred-geometry', 'zen', 'mindfulness', 'spiritual'],
  category: 'captions',
  component: MandalaRevealComponent as any,
  defaultConfig: {
    words: ['HARMONY', 'BALANCE', 'UNITY', 'SACRED'],
    colors: ['#C8B4FF', '#A78BFA', '#DDD6FE', '#8B5CF6'],
    bgColor: '#0a0812',
    cycleDuration: 1.6,
    mandalaLayers: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HARMONY', 'BALANCE', 'UNITY', 'SACRED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B4FF', '#A78BFA', '#DDD6FE', '#8B5CF6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0812', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'mandalaLayers', label: 'Mandala Layers', type: 'number', defaultValue: 4, min: 2, max: 8, group: 'Style' },
  ],
})
