import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GravitySlamConfig extends KineticBaseConfig {
  gravity: number
}

function bounceOut(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Ground line */}
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '5%',
          right: '5%',
          height: '3px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 2,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height }: WordRenderProps) => {
    const groundY = height * 0.22 // distance from bottom
    const dropFromY = -height * 0.55 // starts above the frame

    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 0
    let shadowBlur = 0
    let shadowOpacity = 0

    if (phase === 'enter') {
      // Gravity-accelerated drop then multi-bounce landing
      opacity = Math.min(1, enterProgress * 5)

      // First 50% of enter = freefall (gravity accelerated)
      // Last 50% = bounce settle
      if (enterProgress < 0.5) {
        const fallT = enterProgress / 0.5
        const gravAccel = easeInCubic(fallT) // cubic = gravity feel
        translateY = dropFromY * (1 - gravAccel)
        scaleX = 0.85
        scaleY = 1.2 // stretch during fall
      } else {
        const bounceT = (enterProgress - 0.5) / 0.5
        const bounced = bounceOut(bounceT)
        translateY = -groundY * (1 - bounced)
        // Squash on impact
        const impactIntensity = bounceT < 0.15 ? (1 - bounceT / 0.15) : 0
        scaleX = 1 + impactIntensity * 0.35
        scaleY = 1 - impactIntensity * 0.28
        shadowBlur = impactIntensity * 30
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateY = -groundY
      // Subtle resting compression — settled weight on ground
      scaleX = 1.04 + Math.sin(holdProgress * Math.PI * 3) * 0.01
      scaleY = 0.96 + Math.sin(holdProgress * Math.PI * 3) * 0.01
      shadowOpacity = 0.3
    } else {
      // Exit: text gets compressed then launches upward fast
      opacity = 1 - exitProgress
      const windupT = Math.min(exitProgress * 4, 1) // quick compress
      const launchT = Math.max(0, (exitProgress - 0.25) / 0.75)
      translateY = -groundY - easeInCubic(launchT) * height * 0.7
      scaleX = 1 + (1 - launchT) * windupT * 0.2
      scaleY = 1 - (1 - launchT) * windupT * 0.15 + launchT * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '50%',
          transform: `translateX(-50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          transformOrigin: 'center bottom',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textShadow: `3px 3px 0 rgba(0,0,0,0.4), 0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0,0,0,0.3)`,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Impact shadow on ground */}
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${80 + scaleX * 20}%`,
            height: '8px',
            borderRadius: '50%',
            background: `rgba(0,0,0,${shadowOpacity})`,
            filter: 'blur(4px)',
            transition: 'none',
          }}
        />
      </div>
    )
  },
}

function GravitySlamComponent(props: MotionGraphicProps<GravitySlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gravity-slam',
  title: 'Kinetic Gravity Slam',
  description: 'Text falls from above with realistic gravity acceleration, slams down with a hard bounce, settles on the ground with squash compression',
  tags: ['kinetic', 'typography', 'gravity', 'slam', 'physics', 'fall', 'bounce', 'impact'],
  category: 'captions',
  component: GravitySlamComponent as any,
  defaultConfig: {
    words: ['SLAM', 'DROP', 'FALL', 'BOOM'],
    colors: ['#FC8181', '#F6AD55', '#F6E05E', '#68D391'],
    bgColor: '#1A0A0A',
    cycleDuration: 1.6,
    gravity: 9.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLAM', 'DROP', 'FALL', 'BOOM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FC8181', '#F6AD55', '#F6E05E', '#68D391'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'gravity', label: 'Gravity', type: 'number', defaultValue: 9.8, min: 1, max: 30, group: 'Animation' },
  ],
})
