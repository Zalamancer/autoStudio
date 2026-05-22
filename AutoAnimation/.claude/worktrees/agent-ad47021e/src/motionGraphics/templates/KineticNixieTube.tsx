import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NixieTubeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Warm ambient glow from neon tubes */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(255,120,40,0.04) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        {/* Dark metallic chassis feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(40,35,30,0.3) 0%, rgba(20,18,15,0.2) 50%, rgba(40,35,30,0.3) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Faint horizontal line (PCB trace aesthetic) */}
        <div
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: '65%',
            height: 1,
            background: 'rgba(255,120,40,0.04)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: '35%',
            height: 1,
            background: 'rgba(255,120,40,0.04)',
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
    exitProgress,
    phase,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.toUpperCase().split('')
    const charCount = chars.length

    // Each character is in its own glass "tube"
    const tubeWidth = Math.min(120, (width * 0.8) / Math.max(1, charCount))
    const tubeHeight = tubeWidth * 1.6
    const tubeGap = tubeWidth * 0.15
    const totalWidth = charCount * tubeWidth + (charCount - 1) * tubeGap

    const tubes = chars.map((ch, ci) => {
      // Per-character animation offset for sequential cycling
      const charDelay = ci / charCount

      let displayChar = ch
      let charOpacity = 1
      let glowIntensity = 1
      let cycleActive = false

      if (phase === 'enter') {
        // Stacked digit cycling effect: rapid random chars before settling
        const charProgress = Math.max(0, (enterProgress - charDelay * 0.5) / (1 - charDelay * 0.5))
        if (charProgress < 0.7) {
          // Cycling through characters
          cycleActive = true
          const cycleSpeed = 4
          const cycleFrame = Math.floor((f * cycleSpeed) / 10 + ci * 7)
          const cycleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
          displayChar = cycleChars[cycleFrame % cycleChars.length]
          charOpacity = 0.5 + charProgress * 0.5
          glowIntensity = 0.4 + charProgress * 0.4
        } else {
          // Settled on final character
          displayChar = ch
          const settleProgress = (charProgress - 0.7) / 0.3
          charOpacity = 0.8 + settleProgress * 0.2
          glowIntensity = 0.8 + settleProgress * 0.2
        }
      } else if (phase === 'hold') {
        // Warm steady glow with subtle flicker
        const flicker = Math.sin(f * 0.07 + ci * 1.3) * 0.04
        charOpacity = 0.96 + flicker
        glowIntensity = 0.95 + flicker
      } else {
        // Exit: characters cycle away in sequence
        const charExitProgress = Math.min(1, exitProgress + charDelay * 0.3)
        if (charExitProgress > 0.4) {
          // Dim and turn off
          const dimProgress = (charExitProgress - 0.4) / 0.6
          charOpacity = 1 - dimProgress
          glowIntensity = 1 - dimProgress
        } else {
          // Rapid cycling as it exits
          const cycleFrame = Math.floor(f * 0.3 + ci * 5)
          const cycleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
          displayChar = cycleChars[cycleFrame % cycleChars.length]
        }
      }

      const tubeX = (width - totalWidth) / 2 + ci * (tubeWidth + tubeGap)
      const tubeY = (height - tubeHeight) / 2

      // Neon glow color: warm orange
      const glowColor = color
      const glowAlpha = glowIntensity * 0.6

      return (
        <div
          key={ci}
          style={{
            position: 'absolute',
            left: tubeX,
            top: tubeY,
            width: tubeWidth,
            height: tubeHeight,
          }}
        >
          {/* Glass tube body */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: tubeWidth * 0.3,
              background: `radial-gradient(ellipse at 50% 40%, rgba(255,140,50,${0.03 * glowIntensity}) 0%, rgba(20,18,15,0.4) 70%)`,
              border: '1px solid rgba(120,110,90,0.15)',
              boxShadow: `inset 0 0 ${tubeWidth * 0.2}px rgba(255,120,40,${0.05 * glowIntensity}), 0 0 ${tubeWidth * 0.15}px rgba(255,120,40,${0.03 * glowIntensity})`,
              overflow: 'hidden',
            }}
          >
            {/* Glass highlight reflection */}
            <div
              style={{
                position: 'absolute',
                left: '15%',
                top: '5%',
                width: '25%',
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)',
                borderRadius: '50%',
              }}
            />
          </div>

          {/* Wire cathode character - the glowing letter */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: `${tubeWidth * 0.55}px`,
              fontWeight: 300,
              color: glowColor,
              opacity: charOpacity,
              textShadow: `0 0 ${4 * glowIntensity}px ${glowColor}, 0 0 ${12 * glowIntensity}px ${glowColor}, 0 0 ${25 * glowIntensity}px rgba(255,120,40,${glowAlpha * 0.5}), 0 0 ${40 * glowIntensity}px rgba(255,80,20,${glowAlpha * 0.2})`,
              letterSpacing: 0,
            }}
          >
            {displayChar}
          </div>

          {/* Stacked inactive cathodes behind (ghost digits) */}
          {!cycleActive && phase !== 'exit' && (
            <>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Courier New', monospace",
                  fontSize: `${tubeWidth * 0.55}px`,
                  fontWeight: 300,
                  color: 'rgba(80,60,40,0.08)',
                  transform: 'translateZ(-1px)',
                  letterSpacing: 0,
                }}
              >
                8
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Courier New', monospace",
                  fontSize: `${tubeWidth * 0.55}px`,
                  fontWeight: 300,
                  color: 'rgba(80,60,40,0.05)',
                  transform: 'translate(1px, -1px)',
                  letterSpacing: 0,
                }}
              >
                0
              </div>
            </>
          )}

          {/* Base socket pins */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: '30%',
              width: '40%',
              height: 6,
              background: 'linear-gradient(180deg, rgba(100,90,70,0.2), rgba(60,55,45,0.3))',
              borderRadius: '0 0 3px 3px',
            }}
          />
        </div>
      )
    })

    return <>{tubes}</>
  },
}

function NixieTubeComponent(props: MotionGraphicProps<NixieTubeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-nixie-tube',
  title: 'Kinetic Nixie Tube',
  description:
    'Nixie tube counter with glowing orange wire cathodes in glass tubes, stacked digit cycling, warm neon glow, and socket pins',
  tags: ['kinetic', 'typography', 'nixie', 'tube', 'neon', 'vintage', 'counter', 'steampunk'],
  category: 'captions',
  component: NixieTubeComponent as any,
  defaultConfig: {
    words: ['GLOW', 'NEON', 'WARM', 'TUBE'],
    colors: ['#ff8833', '#ff9944', '#ffaa55', '#ff7722'],
    bgColor: '#0e0c0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['GLOW', 'NEON', 'WARM', 'TUBE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#ff8833', '#ff9944', '#ffaa55', '#ff7722'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e0c0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
