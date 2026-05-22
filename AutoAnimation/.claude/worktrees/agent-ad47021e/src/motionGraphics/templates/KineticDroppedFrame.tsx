import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DroppedFrameConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Frame drop creates brief freeze followed by sudden jump
    // Background shows a frame counter that occasionally freezes and skips
    const theoreticalFrame = Math.floor(time * 60)
    const dropInterval = 47 // simulate a drop every ~47 frames
    const dropCycle = theoreticalFrame % dropInterval
    const isDropping = dropCycle >= 44 // last 3 frames of cycle: freeze
    // The displayed frame counter skips ahead when unpausing
    const displayFrame = isDropping
      ? Math.floor((theoreticalFrame - dropCycle + 43) * 1.0)
      : theoreticalFrame

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* Frame counter overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 14,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: isDropping ? 'rgba(255,80,80,0.8)' : 'rgba(255,255,255,0.3)',
            letterSpacing: 1,
          }}
        >
          {isDropping ? 'DROP' : 'LIVE'} [{displayFrame}]
        </div>
        {/* Dropped frame stutter flash */}
        {isDropping && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,20,20,0.04)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 101 + 53
    const time = f / (fps ?? 30)

    // Frame drop stutter: motion appears to freeze for 2-3 frames then jump ahead
    // We simulate this by quantizing the animation progress in a way that creates
    // artificial hold periods followed by sudden jumps

    // Stutter schedule: deterministic drop events at specific sub-positions
    const stutterPeriod = 0.18 // stutter every ~18% of a phase
    const stutterDuration = 0.06 // freeze for 6% of phase

    function applyStutter(progress: number, s: number): number {
      const cycle = progress / stutterPeriod
      const cyclePhase = cycle % 1
      const stutterActive = rand(Math.floor(cycle) * 7 + s) < 0.5
      if (stutterActive && cyclePhase < stutterDuration / stutterPeriod) {
        // Freeze: return the quantized start of this stutter window
        return Math.floor(cycle) * stutterPeriod
      }
      return progress
    }

    let opacity = 1
    let translateY = 0
    let translateX = 0
    let scaleY = 1
    let stutterFlash = false

    if (phase === 'enter') {
      const stProg = applyStutter(enterProgress, seed)
      opacity = stProg
      // Text slides up with stutter freeze/jump
      translateY = (1 - stProg) * 30
      // Detect jump moment: sudden discontinuity creates a visual flash
      stutterFlash = Math.abs(stProg - enterProgress) > 0.04
      // Compress vertically on jump (motion blur substitute)
      scaleY = stutterFlash ? 0.92 : 1
    } else if (phase === 'hold') {
      opacity = 1
      // Periodic freeze-then-jump during hold phase
      const dropCycle = (holdProgress * 5) % 1
      const isFreeze = dropCycle < 0.12 && rand(Math.floor(holdProgress * 5) * 13 + seed) < 0.5
      if (isFreeze) {
        stutterFlash = true
        scaleY = 0.95
        translateX = (rand(seed + Math.floor(holdProgress * 20)) - 0.5) * 4
      }
    } else {
      const stProg = applyStutter(exitProgress, seed + 7)
      opacity = 1 - stProg
      translateY = stProg * 25
      stutterFlash = Math.abs(stProg - exitProgress) > 0.04
      scaleY = stutterFlash ? 0.93 : 1
    }

    const fontSize = 'clamp(40px, 11vw, 160px)'
    const fontBase: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize,
      fontWeight: 900,
      color,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: 2,
    }

    return (
      <>
        {/* Motion smear ghost — shows where text jumped from */}
        {stutterFlash && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, calc(-50% + ${translateY * -0.5}px)) scaleY(${scaleY * 0.8})`,
              opacity: opacity * 0.25,
              color: 'rgba(255,60,60,0.8)',
              mixBlendMode: 'screen',
              ...fontBase,
            }}
          >
            {word}
          </div>
        )}
        {/* Afterimage — previous frozen frame position */}
        {stutterFlash && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY + 5}px)) scaleY(0.97)`,
              opacity: opacity * 0.2,
              color: 'rgba(0,200,255,0.8)',
              mixBlendMode: 'screen',
              ...fontBase,
            }}
          >
            {word}
          </div>
        )}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scaleY(${scaleY})`,
            opacity,
            textShadow: stutterFlash
              ? `2px 0 rgba(255,0,80,0.6), -2px 0 rgba(0,200,255,0.6)`
              : `0 0 6px ${color}40`,
            ...fontBase,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DroppedFrameComponent(props: MotionGraphicProps<DroppedFrameConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dropped-frame',
  title: 'Kinetic Dropped Frame',
  description: 'Frame drop stutter — animation quantizes to simulate freeze/jump drops, with motion smear ghosts and afterimage trails',
  tags: ['kinetic', 'typography', 'dropped frame', 'stutter', 'frame drop', 'hardware', 'glitch', 'lag'],
  category: 'captions',
  component: DroppedFrameComponent as any,
  defaultConfig: {
    words: ['STUTTER', 'LAG', 'DROP', 'SKIP'],
    colors: ['#ffffff', '#ff4466', '#ffffff', '#44aaff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STUTTER', 'LAG', 'DROP', 'SKIP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ff4466', '#ffffff', '#44aaff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
