import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TireSkidConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Asphalt texture with skid marks
    const skidCount = 6
    const skids = Array.from({ length: skidCount }, (_, i) => {
      const y = 20 + (i * 60) / skidCount
      const baseX = ((time * 80 + i * 200) % (width + 400)) - 200
      const waver = Math.sin(time * 2 + i * 1.5) * 3
      return { y, x: baseX, waver }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Asphalt grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.02) 0%, transparent 50%),
                         radial-gradient(circle at 70% 60%, rgba(255,255,255,0.02) 0%, transparent 50%)`,
          }}
        />
        {/* Skid marks scrolling */}
        {skids.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${s.y + s.waver}%`,
              left: 0,
              width: '100%',
              height: i % 2 === 0 ? 6 : 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: s.x,
                width: 200 + i * 30,
                height: '100%',
                background: `linear-gradient(90deg, transparent 0%, rgba(40,40,40,0.6) 15%, rgba(30,30,30,0.8) 50%, rgba(40,40,40,0.6) 85%, transparent 100%)`,
                borderRadius: 3,
              }}
            />
          </div>
        ))}
        {/* Road center line */}
        <div style={{ position: 'absolute', top: '49%', left: 0, right: 0, height: 2, display: 'flex', gap: 30 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: '100%',
                background: 'rgba(255,200,0,0.15)',
                flexShrink: 0,
                transform: `translateX(${-((time * 60) % 70)}px)`,
              }}
            />
          ))}
        </div>
        {/* Tire smoke at edges */}
        {[0, 1].map((side) => (
          <div
            key={`smoke-${side}`}
            style={{
              position: 'absolute',
              [side === 0 ? 'bottom' : 'top']: '5%',
              left: '50%',
              width: Math.min(width, height) * 0.4,
              height: Math.min(width, height) * 0.2,
              transform: 'translateX(-50%)',
              background: `radial-gradient(ellipse, rgba(180,180,180,${0.04 + Math.sin(time * 3 + side) * 0.02}) 0%, transparent 70%)`,
              borderRadius: '50%',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width: w }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let skewX = 0

    if (phase === 'enter') {
      // Skid in from right side with rubber screech feel
      const t = enterProgress
      const eased = 1 - Math.pow(1 - t, 3)
      // Oscillate slightly at end (like a car correcting after skid)
      const correction = t > 0.7 ? Math.sin((t - 0.7) / 0.3 * Math.PI * 3) * 8 * (1 - t) : 0
      opacity = Math.min(1, t * 3)
      translateX = (1 - eased) * (w * 0.5) + correction
      skewX = (1 - eased) * -12
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle idle vibration
      translateX = Math.sin(Date.now() * 0.006) * 1.5
    } else {
      // Skid out to left
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateX = -eased * (w * 0.5)
      skewX = eased * 12
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) skewX(${skewX}deg)`,
          opacity,
        }}
      >
        {/* Skid trail behind text */}
        {phase === 'enter' && enterProgress < 0.8 && (
          <div
            style={{
              position: 'absolute',
              top: '85%',
              left: translateX > 0 ? '5%' : undefined,
              right: translateX <= 0 ? '5%' : undefined,
              width: Math.abs(translateX) * 0.6,
              maxWidth: 250,
              height: 4,
              background: `linear-gradient(${translateX > 0 ? '270deg' : '90deg'}, rgba(60,60,60,0.7), transparent)`,
              borderRadius: 2,
            }}
          />
        )}
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 140px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            textShadow: `3px 3px 0 rgba(0,0,0,0.4), 0 0 20px ${color}30`,
          }}
        >
          {word}
        </div>
        {/* Rubber mark under text */}
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: '8%',
            right: '8%',
            height: 3,
            background: `linear-gradient(90deg, transparent, rgba(40,40,40,0.6) 20%, rgba(40,40,40,0.6) 80%, transparent)`,
            borderRadius: 2,
          }}
        />
      </div>
    )
  },
}

function TireSkidComponent(props: MotionGraphicProps<TireSkidConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tire-skid',
  title: 'Tire Skid',
  description: 'Text skids into view with rubber trail marks on asphalt. Background features scrolling skid marks, road lines, and tire smoke.',
  tags: ['kinetic', 'tire', 'skid', 'drift', 'rubber', 'car', 'racing', 'motorsport'],
  category: 'captions',
  component: TireSkidComponent as any,
  defaultConfig: {
    words: ['DRIFT', 'SKID', 'BURN', 'GRIP'],
    colors: ['#ffffff', '#ff4444', '#ffaa00', '#cccccc'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRIFT', 'SKID', 'BURN', 'GRIP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ff4444', '#ffaa00', '#cccccc'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
