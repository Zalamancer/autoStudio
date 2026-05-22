import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SonarPingConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const maxR = Math.min(cx, cy)

    // Multiple concentric ping rings expanding outward continuously
    const pingInterval = 2.0 // seconds between pings
    const pingSpeed = 0.7 // how fast rings expand (fraction of maxR per second)
    const ringCount = 4

    const rings = Array.from({ length: ringCount }, (_, i) => {
      const pingTime = (time + i * (pingInterval / ringCount)) % pingInterval
      const progress = pingTime * pingSpeed
      const r = progress * maxR
      const opacity = Math.max(0, 0.3 * (1 - progress))
      if (r > maxR || opacity <= 0) return null
      return (
        <div
          key={`ping-${i}`}
          style={{
            position: 'absolute',
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: `1.5px solid rgba(0, 200, 180, ${opacity})`,
            boxShadow: `0 0 8px rgba(0, 200, 180, ${opacity * 0.4}), inset 0 0 4px rgba(0, 200, 180, ${opacity * 0.1})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Static depth rings (sonar grid)
    const depthRings = Array.from({ length: 5 }, (_, i) => {
      const r = ((i + 1) / 5) * maxR * 0.85
      return (
        <div
          key={`depth-${i}`}
          style={{
            position: 'absolute',
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: '1px solid rgba(0, 180, 160, 0.06)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Deep sea gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(0,40,50,0.3) 0%, rgba(0,10,15,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Depth grid rings */}
        {depthRings}

        {/* Animated ping rings */}
        {rings}

        {/* Center ping origin dot */}
        <div
          style={{
            position: 'absolute',
            left: cx - 4,
            top: cy - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'rgba(0, 220, 200, 0.4)',
            boxShadow: '0 0 12px rgba(0, 220, 200, 0.3)',
            pointerEvents: 'none',
          }}
        />

        {/* Underwater caustic light hints */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${45 + Math.sin(time * 0.3) * 10}% ${30 + Math.cos(time * 0.25) * 8}%, rgba(0,180,160,0.02) 0%, transparent 40%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Text pulses outward from center like a sonar ping
      // Scale from 0 to 1 with an overshoot/elastic feel
      const raw = enterProgress
      const scale = raw < 0.6
        ? (raw / 0.6) * 1.08
        : 1.08 - (raw - 0.6) / 0.4 * 0.08
      const opacity = Math.min(1, raw * 2.5)

      // Concentric ring around the text expanding with it
      const ringRadius = enterProgress * 120
      const ringOpacity = Math.max(0, 0.4 * (1 - enterProgress))

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Expanding ping ring around text */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: ringRadius * 2,
              height: ringRadius * 2,
              marginLeft: -ringRadius,
              marginTop: -ringRadius,
              borderRadius: '50%',
              border: `2px solid rgba(0, 200, 180, ${ringOpacity})`,
              boxShadow: `0 0 12px rgba(0, 200, 180, ${ringOpacity * 0.3})`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(38px, 10vw, 140px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 5,
              opacity,
              transform: `scale(${scale})`,
              textShadow: `0 0 8px ${color}, 0 0 24px rgba(0,200,180,0.3), 0 0 50px rgba(0,200,180,0.1)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Gentle deep-sea glow pulsing
      const pulse = Math.sin(f * 0.06) * 0.06
      const glowPulse = 8 + Math.sin(f * 0.08) * 4
      const driftY = Math.sin(f * 0.03) * 2

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${driftY}px))`,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            opacity: 0.94 + pulse,
            textShadow: `0 0 ${glowPulse}px ${color}, 0 0 ${glowPulse * 2.5}px rgba(0,200,180,0.2)`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: text fades like echo dissipating in water
      const fadeOut = 1 - exitProgress
      const scaleOut = 1 + exitProgress * 0.15
      const blurOut = exitProgress * 5

      // Multiple fading echo rings
      const echoRings = Array.from({ length: 3 }, (_, i) => {
        const ringProgress = exitProgress + i * 0.15
        if (ringProgress > 1) return null
        const r = ringProgress * 100 + 50
        const o = Math.max(0, 0.2 * (1 - ringProgress))
        return (
          <div
            key={`echo-${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: r * 2,
              height: r * 2,
              marginLeft: -r,
              marginTop: -r,
              borderRadius: '50%',
              border: `1px solid rgba(0, 200, 180, ${o})`,
              pointerEvents: 'none',
            }}
          />
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {echoRings}
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(38px, 10vw, 140px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 5,
              opacity: Math.pow(fadeOut, 1.5),
              transform: `scale(${scaleOut})`,
              filter: `blur(${blurOut * 0.4}px)`,
              textShadow: `0 0 ${8 + blurOut * 2}px ${color}`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function SonarPingComponent(props: MotionGraphicProps<SonarPingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sonar-ping',
  title: 'Kinetic Sonar Ping',
  description: 'Sonar submarine display with pulsing concentric rings, deep sea blue-green glow, echo dissipation, and underwater caustic hints',
  tags: ['kinetic', 'typography', 'sonar', 'ping', 'submarine', 'underwater', 'ocean', 'military'],
  category: 'captions',
  component: SonarPingComponent as any,
  defaultConfig: {
    words: ['DIVE', 'ECHO', 'DEEP', 'HULL'],
    colors: ['#00ddbb', '#00ccaa', '#00eedd', '#00bbaa'],
    bgColor: '#020e12',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DIVE', 'ECHO', 'DEEP', 'HULL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00ddbb', '#00ccaa', '#00eedd', '#00bbaa'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020e12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
