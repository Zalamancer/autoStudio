import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PlatformerBounceConfig extends KineticBaseConfig {
  bounceHeight: number
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Platform blocks positions
    const platforms = [
      { x: 10, y: 85, w: 25 },
      { x: 40, y: 75, w: 20 },
      { x: 65, y: 82, w: 30 },
      { x: 5, y: 70, w: 15 },
      { x: 80, y: 68, w: 18 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${bgColor}, ${bgColor}ee 60%, #1a3a1a)` }}>
        {/* Cloud blocks */}
        {Array.from({ length: 4 }, (_, i) => {
          const cx = ((i * 28 + time * 3) % 120) - 10
          return (
            <div
              key={`cloud-${i}`}
              style={{
                position: 'absolute',
                left: `${cx}%`,
                top: `${12 + i * 8}%`,
                display: 'flex',
                gap: 0,
              }}
            >
              {[0, 1, 2, 1, 0].map((h, bi) => (
                <div
                  key={bi}
                  style={{
                    width: 12,
                    height: 8 + h * 6,
                    background: 'rgba(255,255,255,0.12)',
                    alignSelf: 'flex-end',
                    imageRendering: 'pixelated' as any,
                  }}
                />
              ))}
            </div>
          )
        })}
        {/* Platform blocks */}
        {platforms.map((p, i) => (
          <div key={`plat-${i}`} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, display: 'flex' }}>
            {Array.from({ length: Math.floor(p.w / 4) }, (_, bi) => (
              <div
                key={bi}
                style={{
                  width: 16,
                  height: 16,
                  background: bi === 0 || bi === Math.floor(p.w / 4) - 1
                    ? '#8B4513'
                    : i % 2 === 0 ? '#228B22' : '#2E8B57',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderTop: '2px solid rgba(255,255,255,0.15)',
                  imageRendering: 'pixelated' as any,
                }}
              />
            ))}
          </div>
        ))}
        {/* Ground */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '12%',
            background: 'repeating-linear-gradient(90deg, #228B22 0px, #228B22 16px, #2E8B57 16px, #2E8B57 32px)',
            borderTop: '3px solid #1a6b1a',
            imageRendering: 'pixelated' as any,
          }}
        />
        {/* Ground dirt layer */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6%',
            background: 'repeating-linear-gradient(90deg, #8B4513 0px, #8B4513 16px, #A0522D 16px, #A0522D 32px)',
            imageRendering: 'pixelated' as any,
          }}
        />
        {/* Question mark blocks */}
        {[25, 55].map((qx, qi) => {
          const bobY = Math.sin(time * 3 + qi) * 2
          return (
            <div
              key={`q-${qi}`}
              style={{
                position: 'absolute',
                left: `${qx}%`,
                top: `${45 + bobY}%`,
                width: 24,
                height: 24,
                background: '#FFD700',
                border: '2px solid #CC8800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Courier New', monospace",
                fontSize: 14,
                fontWeight: 700,
                color: '#8B4513',
                imageRendering: 'pixelated' as any,
              }}
            >
              ?
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let rotation = 0

    if (phase === 'enter') {
      // Drop from above with bounce
      opacity = Math.min(1, enterProgress * 2)
      const bounced = easeOutBounce(enterProgress)
      translateY = (1 - bounced) * -200
      // Squash on landing
      if (enterProgress > 0.7) {
        const squashPhase = (enterProgress - 0.7) / 0.3
        scaleX = 1 + Math.sin(squashPhase * Math.PI) * 0.15
        scaleY = 1 - Math.sin(squashPhase * Math.PI) * 0.1
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Continuous gentle bounce like standing on a platform
      const bouncePhase = (f * 0.08) % (Math.PI * 2)
      translateY = Math.abs(Math.sin(bouncePhase)) * -20
      // Squash/stretch during bounce
      const squash = Math.sin(bouncePhase)
      scaleX = 1 + squash * 0.04
      scaleY = 1 - squash * 0.06
      // Slight tilt
      rotation = Math.sin(f * 0.05) * 2
    } else {
      // Jump off screen upward
      opacity = Math.max(0, 1 - exitProgress * 1.5)
      translateY = -exitProgress * exitProgress * 400
      rotation = exitProgress * 15
      scaleX = 1 - exitProgress * 0.3
      scaleY = 1 + exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 11vw, 150px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            textShadow: `0 4px 0 rgba(0,0,0,0.3), 0 0 10px ${color}40`,
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
            imageRendering: 'pixelated' as any,
          }}
        >
          {word}
        </div>
        {/* Shadow on ground */}
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: `translateX(-50%) scaleX(${1.2 - Math.abs(translateY) * 0.002})`,
            width: '80%',
            height: 6,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '50%',
            opacity: Math.max(0, 1 - Math.abs(translateY) * 0.005),
          }}
        />
      </div>
    )
  },
}

function KineticPlatformerBounceComponent(props: MotionGraphicProps<PlatformerBounceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-platformer-bounce',
  title: 'Kinetic Platformer Bounce',
  description: 'Words bounce like platformer characters with squash/stretch physics, pixel platforms, question blocks, and ground shadow',
  tags: ['kinetic', 'typography', 'platformer', 'bounce', 'retro', 'gaming', 'mario', 'pixel'],
  category: 'captions',
  component: KineticPlatformerBounceComponent as any,
  defaultConfig: {
    words: ['JUMP', 'RUN', 'DASH', 'COIN'],
    colors: ['#FF4444', '#44FF44', '#4444FF', '#FFD700'],
    bgColor: '#1a1a3e',
    cycleDuration: 1.4,
    bounceHeight: 200,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['JUMP', 'RUN', 'DASH', 'COIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#44FF44', '#4444FF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a3e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'bounceHeight', label: 'Bounce Height', type: 'number', defaultValue: 200, min: 50, max: 400, group: 'Style' },
  ],
})
