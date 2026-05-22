import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlingshotConfig extends KineticBaseConfig {
  pullDistance: number
}

function elasticOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Slingshot Y-fork arms hint */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          top: '20%',
          width: '6px',
          height: '50%',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 3,
          transform: 'rotate(-15deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 'calc(10% + 40px)',
          top: '20%',
          width: '6px',
          height: '50%',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 3,
          transform: 'rotate(15deg)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Slingshot motion:
    // Phase 1 (0..0.35): text pulls BACK and LEFT (stretching the band), scale squishes
    // Phase 2 (0.35..1): releases, rockets forward RIGHT with elastic overshoot

    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 0
    let rotation = 0
    const pullX = -width * 0.35
    const pullY = height * 0.1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 6)

      if (enterProgress < 0.35) {
        // Pull-back phase: elastic stretch to the left/up
        const pullT = enterProgress / 0.35
        // Ease into pull (slow at start, tense at peak)
        const eased = pullT * pullT
        translateX = pullX * eased
        translateY = pullY * eased
        // Squash as tension builds
        scaleX = 1 - eased * 0.25
        scaleY = 1 + eased * 0.35
        rotation = -8 * eased
      } else {
        // Release phase: slings forward with elastic overshoot
        const releaseT = (enterProgress - 0.35) / 0.65
        const elasticSnap = elasticOut(releaseT)

        // Goes from pullX all the way forward (slight overshoot)
        const overshootX = width * 0.05 // small overshoot right of center
        translateX = pullX * (1 - elasticSnap) + overshootX * Math.sin(releaseT * Math.PI) * (1 - releaseT)
        translateY = pullY * (1 - elasticSnap) - Math.sin(releaseT * Math.PI * 0.8) * height * 0.08

        // Stretch during flight, normalize on land
        const flightStretch = Math.sin(releaseT * Math.PI) * 0.5
        scaleX = 1 + flightStretch
        scaleY = 1 - flightStretch * 0.5
        rotation = -8 * (1 - elasticSnap)
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Residual vibration after landing
      const vibDecay = Math.exp(-holdProgress * 5)
      translateX = Math.sin(holdProgress * Math.PI * 7) * vibDecay * 8
      translateY = Math.cos(holdProgress * Math.PI * 5) * vibDecay * 5
      scaleX = 1 + Math.sin(holdProgress * Math.PI * 6) * vibDecay * 0.03
      scaleY = 1 - Math.sin(holdProgress * Math.PI * 6) * vibDecay * 0.03
    } else {
      // Exit: brief pull-back then launch left out of frame
      const quickPull = Math.min(exitProgress * 8, 1)
      const launch = Math.max(0, (exitProgress - 0.12) / 0.88)
      translateX = 15 * quickPull * (1 - launch) - width * 1.1 * easeInQuart(launch)
      scaleX = 1 - launch * 0.4 + quickPull * 0.1
      scaleY = 1 + launch * 0.5
      opacity = 1 - Math.pow(launch, 2)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textShadow: `4px 4px 0 rgba(0,0,0,0.4), 0 2px 20px ${color}30`,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SlingshotComponent(props: MotionGraphicProps<SlingshotConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slingshot',
  title: 'Kinetic Slingshot',
  description: 'Text pulls back with elastic tension then slings forward into position with elastic overshoot — like a slingshot release',
  tags: ['kinetic', 'typography', 'slingshot', 'elastic', 'physics', 'launch', 'pull', 'snap'],
  category: 'captions',
  component: SlingshotComponent as any,
  defaultConfig: {
    words: ['LAUNCH', 'FIRE', 'SHOOT', 'FLY'],
    colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'],
    bgColor: '#0A0A0F',
    cycleDuration: 1.5,
    pullDistance: 35,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LAUNCH', 'FIRE', 'SHOOT', 'FLY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0F', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'pullDistance', label: 'Pull Distance', type: 'number', defaultValue: 35, min: 10, max: 80, group: 'Animation' },
  ],
})
