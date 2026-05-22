import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ReelToReelConfig extends KineticBaseConfig {
  tapeColor: string
  reelColor: string
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  return (c1 + 1) * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const size = Math.min(width, height)

    // Supply reel (left) shrinks, take-up reel (right) grows
    const reelCycle = (time * 0.08) % 1
    const supplyRadius = size * (0.18 - reelCycle * 0.06)
    const takeupRadius = size * (0.12 + reelCycle * 0.06)
    const reelY = height * 0.38
    const supplyX = width * 0.28
    const takeupX = width * 0.72
    const rotation = time * 120

    // VU meter needle bounce
    const vuNeedle = Math.abs(Math.sin(time * 3.7)) * 0.6 + Math.abs(Math.sin(time * 7.1)) * 0.3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Brushed metal faceplate texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(180,170,155,0.015) 1px,
              rgba(180,170,155,0.015) 2px
            )`,
          }}
        />

        {/* Tape head housing — center block */}
        <div
          style={{
            position: 'absolute',
            top: reelY - size * 0.03,
            left: '38%',
            right: '38%',
            height: size * 0.06,
            background: 'linear-gradient(180deg, #3a3a3a, #2a2a2a, #333)',
            borderRadius: 2,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Three head gaps */}
          {[0.25, 0.5, 0.75].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '30%',
                left: `${pos * 100 - 2}%`,
                width: '4%',
                height: '40%',
                background: '#111',
                borderRadius: 1,
              }}
            />
          ))}
        </div>

        {/* Tape path — brown magnetic tape */}
        <div
          style={{
            position: 'absolute',
            top: reelY - 1.5,
            left: supplyX,
            right: width - takeupX,
            height: 3,
            background: 'linear-gradient(90deg, #4a3020, #5a3a28, #4a3020)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />

        {/* Supply reel (left) */}
        <div
          style={{
            position: 'absolute',
            top: reelY,
            left: supplyX,
            width: supplyRadius * 2,
            height: supplyRadius * 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #888 8%, #666 10%, #555 12%, #4a3020 13%, #5a3a28 50%, #4a3020 85%, #777 87%, #999 90%, #888 100%)',
            transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Flange spokes */}
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '70%',
                height: 2,
                background: 'rgba(150,140,130,0.3)',
                transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
              }}
            />
          ))}
          {/* Hub */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: supplyRadius * 0.4,
              height: supplyRadius * 0.4,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #aaa, #888)',
              transform: 'translate(-50%, -50%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        {/* Take-up reel (right) */}
        <div
          style={{
            position: 'absolute',
            top: reelY,
            left: takeupX,
            width: takeupRadius * 2,
            height: takeupRadius * 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #888 8%, #666 10%, #555 12%, #4a3020 13%, #5a3a28 50%, #4a3020 85%, #777 87%, #999 90%, #888 100%)',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.2)',
          }}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '70%',
                height: 2,
                background: 'rgba(150,140,130,0.3)',
                transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: takeupRadius * 0.4,
              height: takeupRadius * 0.4,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #aaa, #888)',
              transform: 'translate(-50%, -50%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        {/* VU meter panel */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            width: size * 0.35,
            height: size * 0.12,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #1a1a18, #222220)',
            borderRadius: 4,
            border: '1px solid rgba(100,95,85,0.3)',
            overflow: 'hidden',
          }}
        >
          {/* VU meter face */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '5%',
              right: '5%',
              bottom: '30%',
              background: '#f5f0e0',
              borderRadius: 2,
            }}
          >
            {/* Scale markings */}
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  bottom: '15%',
                  left: `${10 + i * 10}%`,
                  width: 1,
                  height: i > 6 ? '35%' : '25%',
                  background: i > 6 ? '#c00' : '#333',
                }}
              />
            ))}
            {/* Needle */}
            <div
              style={{
                position: 'absolute',
                bottom: '10%',
                left: '10%',
                width: '60%',
                height: 1.5,
                background: '#222',
                transformOrigin: '0% 50%',
                transform: `rotate(${-30 + vuNeedle * 55}deg)`,
              }}
            />
          </div>
          {/* Label */}
          <div
            style={{
              position: 'absolute',
              bottom: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: size * 0.015,
              color: '#888',
              letterSpacing: 3,
            }}
          >
            VU
          </div>
        </div>

        {/* Warm studio ambient vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Tape threading: characters unspool left-to-right from supply reel
      const elements = chars.map((ch, ci) => {
        const charDelay = ci / (chars.length + 3)
        const charP = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay + 0.01)))
        const eased = easeOutQuart(charP)

        // Each char swings in from left as tape threads through head
        const offsetX = (1 - eased) * -(40 + ci * 8)
        const charOpacity = Math.min(1, charP * 2.5)
        // Tape wobble from threading tension
        const wobbleY = charP < 1 ? Math.sin(charP * Math.PI * 3 + ci) * (1 - charP) * 4 : 0
        // Slight magnetic interference distortion per char
        const jitter = pseudo(ci * 31 + index * 7) * 2 - 1

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translate(${offsetX}px, ${wobbleY + jitter * (1 - eased)}px)`,
              opacity: charOpacity,
              filter: charP < 0.4 ? `blur(${(1 - charP / 0.4) * 2}px)` : undefined,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '62%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 8vw, 110px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {elements}
        </div>
      )
    }

    if (phase === 'hold') {
      // Active hold: tape flutter + VU meter pulse on characters
      const elements = chars.map((ch, ci) => {
        // Gentle tape flutter — each char oscillates slightly
        const flutter = Math.sin(holdProgress * Math.PI * 5 + ci * 0.8) * 1.2
        // VU pulse glow on some characters
        const vuPulse = Math.abs(Math.sin(holdProgress * Math.PI * 3 + ci * 1.3))
        const glowStrength = vuPulse > 0.7 ? (vuPulse - 0.7) * 3.3 : 0

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${flutter}px)`,
              textShadow: glowStrength > 0
                ? `0 0 ${4 + glowStrength * 8}px rgba(200,160,80,${glowStrength * 0.4})`
                : undefined,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '62%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 8vw, 110px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {elements}
        </div>
      )
    }

    // Exit: tape rewinds — characters spool back to the right (mirrors enter)
    const elements = chars.map((ch, ci) => {
      const charDelay = (chars.length - 1 - ci) / (chars.length + 3)
      const charP = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay + 0.01)))
      const eased = easeInBack(Math.min(1, charP))

      const offsetX = eased * (40 + (chars.length - ci) * 8)
      const charOpacity = Math.max(0, 1 - charP * 1.8)
      const wobbleY = Math.sin(charP * Math.PI * 2 + ci) * charP * 5

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${offsetX}px, ${wobbleY}px)`,
            opacity: charOpacity,
            filter: charP > 0.6 ? `blur(${(charP - 0.6) * 5}px)` : undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '62%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(32px, 8vw, 110px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {elements}
      </div>
    )
  },
}

function ReelToReelComponent(props: MotionGraphicProps<ReelToReelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-reel-to-reel',
  title: 'Kinetic Reel-to-Reel',
  description:
    'Reel-to-reel tape recorder with spinning reels, tape path, VU meter, and brushed metal faceplate. Characters unspool from the supply reel left-to-right as tape threads through the head, flutter during hold, and rewind-spool back on exit.',
  tags: ['kinetic', 'typography', 'reel', 'tape', 'analog', 'studio', 'recording', 'vintage', 'audio'],
  category: 'captions',
  component: ReelToReelComponent as any,
  defaultConfig: {
    words: ['RECORD', 'PLAY', 'REWIND', 'MASTER'],
    colors: ['#F5E6CA', '#E8D5B5', '#FFEEDD', '#F5E6CA'],
    bgColor: '#1C1A16',
    cycleDuration: 1.3,
    tapeColor: '#4a3020',
    reelColor: '#888888',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RECORD', 'PLAY', 'REWIND', 'MASTER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6CA', '#E8D5B5', '#FFEEDD', '#F5E6CA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1A16', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
