import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InfraredFalseColorConfig extends KineticBaseConfig {
  heatIntensity: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Infrared false color: foliage glows white, sky goes dark,
    // heat shimmer from ground up
    const shimmerY = 60 + Math.sin(time * 0.5) * 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* IR false sky — dark cyan/indigo (low IR emission) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, #0a0420 0%, #1a0830 40%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* IR false ground — magenta-red heat glow */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: `${100 - shimmerY + 20}%`,
            background: `linear-gradient(to top, rgba(180,20,60,0.35) 0%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Heat shimmer line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${shimmerY}%`,
            height: 2,
            background: 'linear-gradient(to right, transparent, rgba(255,80,120,0.2), transparent)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
        {/* IR foliage hot spots — bright white-pink blobs */}
        {[
          { x: 15, y: 65, r: 25 },
          { x: 45, y: 70, r: 18 },
          { x: 75, y: 60, r: 22 },
          { x: 88, y: 72, r: 15 },
        ].map((blob, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${blob.x + Math.sin(time * 0.3 + i) * 2}%`,
              top: `${blob.y + Math.cos(time * 0.25 + i) * 1.5}%`,
              width: blob.r * 2,
              height: blob.r * 1.5,
              background: `radial-gradient(ellipse, rgba(255,200,220,0.12) 0%, transparent 100%)`,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Thermal scan line overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(200,50,120,0.015) 4px)`,
            pointerEvents: 'none',
          }}
        />
        {/* IR camera vignette — lens falloff */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(10,2,20,0.65) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let scale = 1
    let hue = 0

    if (phase === 'enter') {
      // IR thermal blooming — grows from heat point
      const ease = 1 - Math.pow(1 - enterProgress, 2)
      scale = 0.7 + ease * 0.3
      opacity = ease
      hue = (1 - ease) * 60 // starts yellow-hot, cools to final color
    } else if (phase === 'hold') {
      // IR shimmer — heat wave distortion
      scale = 1 + Math.sin(t * 1.5 + index) * 0.008
      opacity = 0.92 + Math.sin(t * 2.3 + index * 1.7) * 0.08
    } else {
      const ease = exitProgress * exitProgress
      opacity = 1 - ease
      scale = 1 + ease * 0.08
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: hue > 0 ? `hue-rotate(${hue}deg)` : undefined,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(44px, 12vw, 162px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 4,
          // IR halation — white glow around text
          textShadow: `0 0 20px rgba(255,150,200,0.6), 0 0 40px rgba(255,80,150,0.3), 0 0 60px rgba(200,20,80,0.15)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function InfraredFalseColorComponent(props: MotionGraphicProps<InfraredFalseColorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-infrared-false-color',
  title: 'Kinetic Infrared False Color',
  description: 'Infrared photography false-color treatment — dark sky, glowing foliage, heat shimmer ground, thermal scan lines, and IR halation bloom on text',
  tags: ['kinetic', 'typography', 'infrared', 'false color', 'thermal', 'film', 'photography', 'heat'],
  category: 'captions',
  component: InfraredFalseColorComponent as any,
  defaultConfig: {
    words: ['HEAT', 'GLOW', 'PULSE', 'BURN'],
    colors: ['#FFB3D9', '#FF80C0', '#FFB3D9', '#FF99CC'],
    bgColor: '#0a0218',
    cycleDuration: 1.5,
    heatIntensity: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEAT', 'GLOW', 'PULSE', 'BURN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB3D9', '#FF80C0', '#FFB3D9', '#FF99CC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0218', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'heatIntensity', label: 'Heat Intensity', type: 'number', defaultValue: 80, min: 20, max: 150, group: 'Animation' },
  ],
})
