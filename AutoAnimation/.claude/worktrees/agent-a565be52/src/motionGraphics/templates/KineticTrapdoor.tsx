import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrapdoorConfig extends KineticBaseConfig {
  dropDepth: number
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__trapdoorConfig ?? { dropDepth: 80 }
    const dropDepth = Math.max(20, Math.min(150, config.dropDepth ?? 80))

    let doorAngle = 0 // 0=closed, 90=fully open (rotated down around bottom hinge)
    let textDropY = 0 // text Y offset (drops in from above when door opens)
    let textOpacity = 0

    if (phase === 'enter') {
      // Door swings open first, then text drops in
      const doorEased = easeOutCubic(Math.min(1, enterProgress * 1.4))
      doorAngle = 90 * doorEased

      if (enterProgress > 0.4) {
        const dropProgress = (enterProgress - 0.4) / 0.6
        // Text starts above and bounces into position
        const bounced = easeOutBounce(dropProgress)
        textDropY = -dropDepth * (1 - bounced)
        textOpacity = Math.min(1, dropProgress * 2)
      }
    } else if (phase === 'hold') {
      doorAngle = 90
      textDropY = 0
      textOpacity = 1
    } else {
      // Text sucks back up, door swings shut
      if (exitProgress < 0.5) {
        const suckProgress = exitProgress / 0.5
        textDropY = -dropDepth * easeInBack(suckProgress)
        textOpacity = 1 - suckProgress
        doorAngle = 90
      } else {
        textDropY = -dropDepth
        textOpacity = 0
        const closeProgress = (exitProgress - 0.5) / 0.5
        doorAngle = 90 * (1 - easeOutCubic(closeProgress))
      }
    }

    // Trapdoor: a rectangular hatch in the lower 40% of the frame, hinged at the bottom edge
    const hatchTop = height * 0.55
    const hatchHeight = height * 0.42
    const hatchLeft = width * 0.1
    const hatchWidth = width * 0.8

    // Frame/surround
    const frameThickness = 6

    // Shadow cast by open door
    const shadowOpacity = (doorAngle / 90) * 0.4

    return (
      <>
        {/* Pit darkness visible once door opens */}
        <div
          style={{
            position: 'absolute',
            left: hatchLeft,
            top: hatchTop,
            width: hatchWidth,
            height: hatchHeight,
            background: `radial-gradient(ellipse at 50% 20%, rgba(20,18,30,0.7), rgba(5,5,10,0.98))`,
            opacity: doorAngle / 90,
          }}
        />

        {/* Text drops in from above */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${textDropY}px))`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>

        {/* Hatch door frame surround */}
        <div
          style={{
            position: 'absolute',
            left: hatchLeft - frameThickness,
            top: hatchTop - frameThickness,
            width: hatchWidth + frameThickness * 2,
            height: hatchHeight + frameThickness * 2,
            background: 'transparent',
            border: `${frameThickness}px solid rgba(110,115,130,0.6)`,
            borderRadius: 3,
            boxShadow: `inset 0 0 12px rgba(0,0,0,0.4)`,
            pointerEvents: 'none',
          }}
        />

        {/* The trapdoor hatch panel — rotateX around bottom edge */}
        <div
          style={{
            position: 'absolute',
            left: hatchLeft,
            top: hatchTop,
            width: hatchWidth,
            height: hatchHeight,
            perspective: 1000,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'bottom center',
              transform: `perspective(1000px) rotateX(${-doorAngle}deg)`,
              background: 'linear-gradient(160deg, rgba(115,118,132,0.95) 0%, rgba(82,85,98,0.97) 50%, rgba(65,68,80,0.95) 100%)',
              backfaceVisibility: 'hidden',
              boxShadow: `0 ${shadowOpacity * 20}px ${shadowOpacity * 40}px rgba(0,0,0,${shadowOpacity})`,
            }}
          >
            {/* Hatch planks / panel detail */}
            {[0.25, 0.5, 0.75].map((pos, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  top: `${pos * 100}%`,
                  left: '5%',
                  width: '90%',
                  height: 1,
                  background: 'rgba(50,52,62,0.5)',
                }}
              />
            ))}
            {/* Hatch handle */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '40%',
                transform: 'translate(-50%, -50%)',
                width: hatchWidth * 0.15,
                height: 10,
                borderRadius: 5,
                background: 'linear-gradient(180deg, rgba(180,182,192,0.9), rgba(120,122,132,0.85))',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            />
            {/* Hinge marks at bottom */}
            {[0.2, 0.8].map((pos, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: `${pos * 100}%`,
                  transform: 'translateX(-50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'rgba(145,148,160,0.7)',
                  border: '1px solid rgba(80,82,92,0.5)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Drop shadow cast on floor when door is open */}
        <div
          style={{
            position: 'absolute',
            left: hatchLeft + hatchWidth * 0.05,
            top: hatchTop + hatchHeight - 4,
            width: hatchWidth * 0.9,
            height: 16,
            background: `radial-gradient(ellipse at 50% 0%, rgba(0,0,0,${shadowOpacity * 0.5}), transparent)`,
          }}
        />
      </>
    )
  },
}

function TrapdoorComponent(props: MotionGraphicProps<TrapdoorConfig>) {
  ;(globalThis as any).__trapdoorConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-trapdoor',
  title: 'Kinetic Trapdoor',
  description: 'A hatch door swings open with 3D rotateX perspective, then text drops in from above with a bounce landing',
  tags: ['kinetic', 'typography', 'trapdoor', 'hatch', 'drop', 'reveal', '3d', 'mechanical', 'geometric', 'bounce'],
  category: 'captions',
  component: TrapdoorComponent as any,
  defaultConfig: {
    words: ['DROP', 'FALL', 'REVEAL', 'TRAP'],
    colors: ['#E879F9', '#D946EF', '#F0ABFC', '#C026D3'],
    bgColor: '#0d0514',
    cycleDuration: 1.8,
    dropDepth: 80,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DROP', 'FALL', 'REVEAL', 'TRAP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E879F9', '#D946EF', '#F0ABFC', '#C026D3'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0514', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.6,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'dropDepth',
      label: 'Drop Distance (px)',
      type: 'number',
      defaultValue: 80,
      min: 20,
      max: 150,
      group: 'Animation',
    },
  ],
})
