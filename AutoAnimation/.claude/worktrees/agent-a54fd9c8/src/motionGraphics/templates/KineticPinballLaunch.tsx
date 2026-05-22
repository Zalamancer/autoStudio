import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PinballLaunchConfig extends KineticBaseConfig {}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Pinball lane — vertical channel on right side */}
      <div
        style={{
          position: 'absolute',
          right: '12%',
          top: '5%',
          bottom: 0,
          width: '10%',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
          border: '2px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          borderRadius: '6px 6px 0 0',
        }}
      />
      {/* Spring plunger at bottom of lane */}
      <div
        style={{
          position: 'absolute',
          right: '14%',
          bottom: 0,
          width: '6%',
          height: '12%',
          background: 'linear-gradient(0deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))',
          borderRadius: '4px 4px 0 0',
          border: '1px solid rgba(255,255,255,0.12)',
          borderBottom: 'none',
        }}
      />
      {/* Lane scoring rails */}
      {[0.3, 0.55, 0.78].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            right: '12%',
            top: `${pos * 100}%`,
            width: '10%',
            height: 3,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 1,
          }}
        />
      ))}
      {/* Bumpers / score dots */}
      {[
        { x: 15, y: 20 },
        { x: 65, y: 35 },
        { x: 30, y: 55 },
        { x: 55, y: 65 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
      ))}
      {/* Score display area */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          top: '3%',
          width: '40%',
          height: '12%',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'rgba(255,200,0,0.4)',
            fontSize: '14px',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '0.2em',
          }}
        >
          000000
        </div>
      </div>
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    height,
    width,
  }: WordRenderProps) => {
    // Pull back phase: text compresses downward (being pulled against spring)
    // Launch: explosive upward with speed blur
    // Hold: floats at top with pinball score-bounce
    // Exit: arcs off screen

    let translateY = 0
    let translateX = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let blur = 0
    let rotateZ = 0

    const launchStart = height * 0.65   // start position (near bottom, in lane)
    const restY = -height * 0.3          // resting at top

    if (phase === 'enter') {
      if (enterProgress < 0.4) {
        // PULL BACK: text moves down against spring resistance
        const pullT = enterProgress / 0.4
        const pullEased = easeInExpo(pullT)
        translateY = launchStart * pullEased // moves DOWN (positive = down in this coord)
        scaleX = 1 + 0.12 * pullT
        scaleY = 1 - 0.15 * pullT // compressed
        opacity = 0.6 + 0.4 * pullT
        // Spring coil compression visual
      } else {
        // LAUNCH: explosive release upward
        const launchT = (enterProgress - 0.4) / 0.6
        const launched = easeOutElastic(Math.min(1, launchT * 1.15))
        translateY = launchStart * (1 - launched) + restY * launched
        translateX = (1 - easeOutQuint(launchT)) * 20 // slight left drift from lane
        scaleX = 0.85 + 0.15 * launched
        scaleY = 1.35 - 0.35 * launched // stretch on launch
        blur = (1 - Math.min(1, launchT * 3)) * 6 // speed blur
        opacity = 1
        rotateZ = (1 - launched) * -5
      }
    } else if (phase === 'hold') {
      // Score-bounce animation — like hitting bumpers
      const bounce = Math.sin(holdProgress * Math.PI * 7) * Math.exp(-holdProgress * 4)
      translateY = restY + bounce * 8
      translateX = Math.sin(holdProgress * Math.PI * 5) * Math.exp(-holdProgress * 3) * 6
      scaleX = 1 + bounce * 0.04
      scaleY = 1 - bounce * 0.04
      opacity = 1
    } else {
      // Exit: pinball arcs off sideways (launched by flipper)
      const exitT = easeInCubic(exitProgress)
      translateX = -width * 0.6 * exitT
      translateY = restY - height * 0.3 * exitT
      rotateZ = -30 * exitT
      scaleX = 1 - exitT * 0.3
      opacity = exitProgress < 0.5 ? 1 : (1 - exitProgress) / 0.5
    }

    // Pull-back spring indicator
    const showSpring = phase === 'enter' && enterProgress < 0.4
    const springCompress = showSpring ? (enterProgress / 0.4) : 0

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Spring coil compression indicator */}
        {showSpring && (
          <div
            style={{
              position: 'absolute',
              right: '15%',
              bottom: '8%',
              width: '6%',
              height: `${(1 - springCompress) * 20}%`,
              background: `repeating-linear-gradient(0deg, ${color}44 0px, transparent 3px, ${color}22 6px)`,
              borderRadius: 4,
              transformOrigin: 'center bottom',
              transform: `scaleY(${1 - springCompress * 0.5})`,
            }}
          />
        )}

        <div
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotateZ(${rotateZ}deg)`,
            transformOrigin: 'center center',
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          {/* Speed trail effect on launch */}
          {blur > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(0deg, ${color}22, transparent)`,
                transform: `scaleY(${1 + blur * 0.3})`,
                transformOrigin: 'center bottom',
                filter: `blur(${blur * 2}px)`,
              }}
            />
          )}
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 138px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Impact', 'Anton', sans-serif",
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textShadow: `3px 3px 0 rgba(0,0,0,0.5), 0 0 40px ${color}66, 0 0 80px ${color}33`,
              position: 'relative',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function PinballLaunchComponent(props: MotionGraphicProps<PinballLaunchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pinball-launch',
  title: 'Pinball Launch',
  description:
    'Text pulled back against spring in the plunger lane, then launched upward with speed blur and elastic rebound, exits via flipper arc.',
  tags: ['kinetic', 'typography', 'pinball', 'spring', 'launch', 'mechanical', 'arcade', 'elastic', 'fast'],
  category: 'captions',
  component: PinballLaunchComponent as any,
  defaultConfig: {
    words: ['LAUNCH', 'TILT', 'BONUS', 'FIRE'],
    colors: ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E89'],
    bgColor: '#070a14',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LAUNCH', 'TILT', 'BONUS', 'FIRE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E89'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#070a14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
