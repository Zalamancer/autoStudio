import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnamorphicSqueezeConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Cinemascope letterbox bars
    const barHeight = height * 0.12

    // Horizontal lens flare streak
    const flareX = ((time * 40) % (width * 1.5)) - width * 0.25
    const flareOpacity = 0.06 + Math.sin(time * 1.5) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Film grain texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.008) 2px,
              rgba(255,255,255,0.008) 4px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Anamorphic horizontal lens flare */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: flareX,
            width: width * 0.6,
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(100,180,255,${flareOpacity}), rgba(255,200,100,${flareOpacity * 0.6}), transparent)`,
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Top letterbox */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: barHeight,
            background: '#000',
            zIndex: 10,
          }}
        />
        {/* Bottom letterbox */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: barHeight,
            background: '#000',
            zIndex: 10,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let translateX = 0

    if (phase === 'enter') {
      // Anamorphic unsqueeze: start horizontally compressed (2x), vertically stretched
      const t = easeOutQuart(enterProgress)
      scaleX = 0.4 + t * 0.6 // 0.4 -> 1.0 (compressed -> normal)
      scaleY = 1.6 - t * 0.6 // 1.6 -> 1.0 (tall -> normal)
      opacity = Math.min(1, enterProgress * 2.5)
      // Slight horizontal drift during unsqueeze
      translateX = (1 - t) * 15
    } else if (phase === 'hold') {
      // Subtle anamorphic breathing with horizontal stretch emphasis
      const breathe = Math.sin(holdProgress * Math.PI * 2) * 0.02
      scaleX = 1 + breathe * 1.5
      scaleY = 1 - breathe * 0.5
    } else {
      // Re-squeeze: compress back to anamorphic
      const t = easeInQuart(exitProgress)
      scaleX = 1 - t * 0.7 // 1.0 -> 0.3
      scaleY = 1 + t * 0.8 // 1.0 -> 1.8
      opacity = 1 - t
      translateX = -t * 20
    }

    // Chromatic aberration intensity based on distortion amount
    const aberration = Math.abs(scaleX - 1) * 8

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `scaleX(${scaleX}) scaleY(${scaleY}) translateX(${translateX}px)`,
            transformOrigin: 'center center',
            opacity,
          }}
        >
          {/* Red channel offset (chromatic aberration) */}
          {aberration > 0.3 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 14vw, 180px)',
                fontWeight: 400,
                color: 'rgba(255,60,60,0.3)',
                whiteSpace: 'nowrap',
                letterSpacing: 8,
                textTransform: 'uppercase',
                textAlign: 'center',
                transform: `translateX(${aberration}px)`,
              }}
            >
              {word}
            </div>
          )}
          {/* Blue channel offset (chromatic aberration) */}
          {aberration > 0.3 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 14vw, 180px)',
                fontWeight: 400,
                color: 'rgba(60,60,255,0.3)',
                whiteSpace: 'nowrap',
                letterSpacing: 8,
                textTransform: 'uppercase',
                textAlign: 'center',
                transform: `translateX(${-aberration}px)`,
              }}
            >
              {word}
            </div>
          )}
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Bebas Neue', 'Impact', sans-serif",
              fontSize: 'clamp(48px, 14vw, 180px)',
              fontWeight: 400,
              color,
              textShadow: `0 0 30px ${color}33`,
              whiteSpace: 'nowrap',
              letterSpacing: 8,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function AnamorphicSqueezeComponent(props: MotionGraphicProps<AnamorphicSqueezeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-anamorphic-squeeze',
  title: 'Kinetic Anamorphic Squeeze',
  description: 'Cinemascope anamorphic lens squeeze/unsqueeze with letterbox bars, chromatic aberration, and horizontal lens flare',
  tags: ['kinetic', 'typography', 'anamorphic', 'cinema', 'widescreen', 'cinemascope', 'lens', 'film'],
  category: 'captions',
  component: AnamorphicSqueezeComponent as any,
  defaultConfig: {
    words: ['CINEMA', 'SCOPE', 'WIDE', 'LENS'],
    colors: ['#E8D5B7', '#F0C987', '#D4A574', '#C9B896'],
    bgColor: '#0c0c0c',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CINEMA', 'SCOPE', 'WIDE', 'LENS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D5B7', '#F0C987', '#D4A574', '#C9B896'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c0c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
