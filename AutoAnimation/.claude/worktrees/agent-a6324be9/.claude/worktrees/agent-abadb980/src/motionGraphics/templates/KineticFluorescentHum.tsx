import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FluorescentHumConfig extends KineticBaseConfig {
  flickerCount: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Drop ceiling grid
    const tileSize = 80
    const cols = Math.ceil(width / tileSize) + 1
    const rows = Math.ceil(height / tileSize) + 1

    // Ballast hum — faint flicker on entire scene
    const ballastHum = Math.sin(time * 120) * 0.008 + Math.sin(time * 100) * 0.004

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          filter: `brightness(${1 + ballastHum})`,
        }}
      >
        {/* Drop ceiling tiles */}
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const x = col * tileSize
            const y = row * tileSize
            const tileShade = 0.04 + rand(row * 17 + col * 31) * 0.02
            return (
              <div
                key={`${row}-${col}`}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: tileSize - 2,
                  height: tileSize - 2,
                  background: `rgba(200, 195, 180, ${tileShade})`,
                  borderRadius: 0,
                }}
              />
            )
          })
        ).flat()}
        {/* Ceiling grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(120,115,100,0.08) 0px, rgba(120,115,100,0.08) 2px, transparent 2px, transparent ${tileSize}px),
              repeating-linear-gradient(90deg, rgba(120,115,100,0.08) 0px, rgba(120,115,100,0.08) 2px, transparent 2px, transparent ${tileSize}px)
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Water stain on one tile */}
        <div
          style={{
            position: 'absolute',
            left: '60%',
            top: '15%',
            width: 40,
            height: 30,
            background: 'radial-gradient(ellipse, rgba(160, 140, 100, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        {/* Fluorescent tube fixture housing */}
        <div
          style={{
            position: 'absolute',
            left: '15%',
            right: '15%',
            top: '42%',
            height: 20,
            background: 'rgba(180, 175, 165, 0.06)',
            borderRadius: 2,
          }}
        />
        {/* Greenish ambient cast from fluorescent */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 45%, rgba(180, 220, 180, ${0.015 + ballastHum * 2}) 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Fluorescent color: greenish-white
    const fluorWhite = '#E8F0E0'
    const fluorGreen = '#C8D8B8'

    // Fluorescent tube startup sequence: 2-3 flickers before full on
    let opacity = 0
    let flickerState: 'off' | 'attempt' | 'on' = 'off'
    let glowIntensity = 0

    if (phase === 'enter') {
      // Characteristic fluorescent startup: flick... flick... flick... ON
      if (enterProgress < 0.15) {
        // Dark — ballast charging
        opacity = 0
        flickerState = 'off'
      } else if (enterProgress < 0.22) {
        // First flicker attempt — brief flash at ends
        opacity = 0.25
        flickerState = 'attempt'
        glowIntensity = 0.15
      } else if (enterProgress < 0.32) {
        // Back to dark
        opacity = 0
        flickerState = 'off'
      } else if (enterProgress < 0.40) {
        // Second flicker — slightly longer
        opacity = 0.4
        flickerState = 'attempt'
        glowIntensity = 0.3
      } else if (enterProgress < 0.48) {
        // Dark again
        opacity = 0.02
        flickerState = 'off'
      } else if (enterProgress < 0.58) {
        // Third attempt — almost on, wavering
        const waver = rand(f + index * 31) < 0.3 ? 0.2 : 0.65
        opacity = waver
        flickerState = 'attempt'
        glowIntensity = waver * 0.7
      } else if (enterProgress < 0.63) {
        // Brief dip
        opacity = 0.15
        flickerState = 'attempt'
        glowIntensity = 0.1
      } else {
        // Finally ON — ramps to full
        const ramp = (enterProgress - 0.63) / 0.37
        opacity = 0.6 + ramp * 0.4
        flickerState = 'on'
        glowIntensity = 0.5 + ramp * 0.5
      }
    } else if (phase === 'hold') {
      // Steady fluorescent with characteristic 60Hz micro-flicker
      const hz60 = Math.sin(f * 0.2 * Math.PI) * 0.03
      const ballast = rand(f * 3 + index * 17) < 0.01 ? -0.06 : 0
      opacity = 0.92 + hz60 + ballast
      flickerState = 'on'
      glowIntensity = 0.88 + hz60
    } else {
      // Power off — quick flicker and fade
      if (exitProgress < 0.2) {
        opacity = 0.9
        flickerState = 'on'
        glowIntensity = 0.85
      } else if (exitProgress < 0.35) {
        opacity = rand(f + index * 41) < 0.5 ? 0.6 : 0.15
        flickerState = 'attempt'
        glowIntensity = opacity * 0.6
      } else if (exitProgress < 0.5) {
        opacity = 0.4
        flickerState = 'attempt'
        glowIntensity = 0.2
      } else {
        const fade = (exitProgress - 0.5) / 0.5
        opacity = Math.max(0, 0.3 * (1 - fade))
        flickerState = fade > 0.5 ? 'off' : 'attempt'
        glowIntensity = Math.max(0, 0.15 * (1 - fade))
      }
    }

    const glowSize = glowIntensity * 25
    const spreadGlow = glowIntensity * 45

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Tube housing glow — the fixture */}
        {flickerState !== 'off' && (
          <div
            style={{
              position: 'absolute',
              left: '-8%',
              right: '-8%',
              top: '-30%',
              bottom: '-30%',
              background: `radial-gradient(ellipse at center, rgba(200, 230, 200, ${glowIntensity * 0.06}) 0%, transparent 70%)`,
              pointerEvents: 'none',
              filter: 'blur(20px)',
            }}
          />
        )}
        {/* Fluorescent end caps — glow first during startup */}
        {flickerState === 'attempt' && (
          <>
            <div
              style={{
                position: 'absolute',
                left: -10,
                top: '50%',
                width: 8,
                height: 8,
                transform: 'translateY(-50%)',
                background: `radial-gradient(circle, rgba(255, 200, 150, ${opacity * 0.5}) 0%, transparent 70%)`,
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: -10,
                top: '50%',
                width: 8,
                height: 8,
                transform: 'translateY(-50%)',
                background: `radial-gradient(circle, rgba(255, 200, 150, ${opacity * 0.5}) 0%, transparent 70%)`,
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          </>
        )}
        {/* Main fluorescent text */}
        <div
          style={{
            fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(38px, 11vw, 145px)',
            fontWeight: 700,
            color: flickerState === 'on' ? fluorWhite : fluorGreen,
            opacity,
            textShadow: glowIntensity > 0
              ? `0 0 ${glowSize * 0.5}px ${fluorGreen},
                 0 0 ${glowSize}px rgba(180, 220, 180, 0.5),
                 0 0 ${spreadGlow}px rgba(160, 200, 160, 0.25)`
              : 'none',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
        {/* Floor reflection of fluorescent light */}
        {glowIntensity > 0.4 && (
          <div
            style={{
              position: 'absolute',
              top: '120%',
              left: '-10%',
              right: '-10%',
              height: 40,
              background: `linear-gradient(180deg, rgba(180, 220, 180, ${glowIntensity * 0.04}) 0%, transparent 100%)`,
              pointerEvents: 'none',
              filter: 'blur(8px)',
            }}
          />
        )}
      </div>
    )
  },
}

function FluorescentHumComponent(props: MotionGraphicProps<FluorescentHumConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fluorescent-hum',
  title: 'Kinetic Fluorescent Hum',
  description: 'Office fluorescent tube startup with 2-3 flicker attempts before full ignition, greenish-white cast, ballast hum, and drop ceiling grid',
  tags: ['kinetic', 'typography', 'fluorescent', 'office', 'flicker', 'startup', 'hum', 'tube', 'light'],
  category: 'captions',
  component: FluorescentHumComponent as any,
  defaultConfig: {
    words: ['OFFICE', 'LIGHT', 'BUZZ', 'GLOW'],
    colors: ['#C8D8B8', '#D8E8C8', '#B8D0A8', '#E0F0D0'],
    bgColor: '#121210',
    cycleDuration: 1.5,
    flickerCount: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OFFICE', 'LIGHT', 'BUZZ', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8D8B8', '#D8E8C8', '#B8D0A8', '#E0F0D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#121210', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'flickerCount', label: 'Flicker Count', type: 'number', defaultValue: 3, min: 1, max: 6, group: 'Animation' },
  ],
})
