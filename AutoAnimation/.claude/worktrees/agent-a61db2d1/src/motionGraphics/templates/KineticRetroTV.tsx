import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroTVConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const scanLineY = (time * 50) % 110
    // Static noise flicker
    const staticIntensity = 0.02 + Math.sin(time * 17) * 0.01

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#2A1F14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Wood grain TV cabinet border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(90deg, rgba(120,80,40,0.05) 0px, rgba(90,60,30,0.05) 3px, rgba(120,80,40,0.03) 6px)`,
            pointerEvents: 'none',
          }}
        />
        {/* TV screen area — inset with rounded corners */}
        <div
          style={{
            position: 'absolute',
            inset: '8%',
            background: bgColor,
            borderRadius: 'clamp(12px, 3vw, 30px)',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Scan lines overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
          {/* Moving scan bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${scanLineY}%`,
              height: 4,
              background: 'rgba(255,255,255,0.06)',
              filter: 'blur(1px)',
              pointerEvents: 'none',
              zIndex: 6,
            }}
          />
          {/* Screen curvature glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(180,160,120,0.04) 0%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
          {/* Corner shadow — screen bulge */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.3)',
              borderRadius: 'clamp(12px, 3vw, 30px)',
              pointerEvents: 'none',
              zIndex: 7,
            }}
          />
          {/* Static noise band */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${((time * 30 + 50) % 120) - 10}%`,
              height: 12,
              background: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,${staticIntensity}) 2px, rgba(255,255,255,${staticIntensity}) 4px)`,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        </div>
        {/* Channel knob indicators */}
        <div
          style={{
            position: 'absolute',
            right: '2.5%',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={`knob-${i}`}
              style={{
                width: 'clamp(10px, 2vw, 18px)',
                height: 'clamp(10px, 2vw, 18px)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #8B7355 0%, #5C4033 100%)',
                border: '1px solid #3E2723',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            />
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 59 + 23
    let opacity = 0
    let scaleY = 1
    let translateY = 0

    if (phase === 'enter') {
      // TV turn-on effect: vertical stretch then settle
      if (enterProgress < 0.3) {
        scaleY = 0.02 + (enterProgress / 0.3) * 0.98
        opacity = enterProgress / 0.3
      } else {
        const settle = (enterProgress - 0.3) / 0.7
        const eased = 1 - Math.pow(1 - settle, 3)
        scaleY = 1 + (1 - eased) * 0.1
        opacity = 0.8 + eased * 0.2
      }
    } else if (phase === 'hold') {
      opacity = 1
      // CRT wobble
      translateY = Math.sin(f * 0.15 + seed) * 1.5
    } else {
      // TV turn-off: collapse vertically
      scaleY = Math.max(0.02, 1 - exitProgress * 1.2)
      opacity = 1 - exitProgress * 0.5
      if (exitProgress > 0.8) {
        opacity = Math.max(0, 1 - (exitProgress - 0.8) / 0.2)
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleY(${scaleY})`,
          opacity,
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(34px, 9vw, 120px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          textTransform: 'uppercase',
          textShadow: `0 0 10px ${color}40, 0 0 20px ${color}20`,
        }}
      >
        {word}
      </div>
    )
  },
}

function RetroTVComponent(props: MotionGraphicProps<RetroTVConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-retro-tv',
  title: 'Kinetic Retro TV',
  description: 'Vintage television set with wood cabinet, scan lines, CRT curvature, channel knobs, and TV turn-on/off text animation',
  tags: ['kinetic', 'typography', 'retro', 'tv', 'vintage', 'crt', 'television', 'scan-lines', 'analog'],
  category: 'captions',
  component: RetroTVComponent as any,
  defaultConfig: {
    words: ['CHANNEL', 'STATIC', 'SIGNAL', 'TUNE'],
    colors: ['#C8B896', '#B0A080', '#D4C4A0', '#C8B896'],
    bgColor: '#121008',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHANNEL', 'STATIC', 'SIGNAL', 'TUNE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B896', '#B0A080', '#D4C4A0', '#C8B896'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#121008', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
