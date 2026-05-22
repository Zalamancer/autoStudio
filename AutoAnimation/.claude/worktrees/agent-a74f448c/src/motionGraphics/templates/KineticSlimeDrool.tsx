import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlimeDroolConfig extends KineticBaseConfig {
  droolLength: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Slime puddle at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '20%',
          right: '20%',
          height: '8%',
          background: `radial-gradient(ellipse at 50% 100%, rgba(100,220,80,0.15) 0%, transparent 70%)`,
          borderRadius: '50%',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, height }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        {chars.map((ch, ci) => {
          const seed = index * 100 + ci
          const droolVariance = seededRandom(seed) * 0.5 + 0.75  // 0.75 to 1.25

          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let droolLength = 0  // pixels of drool below letter

          if (phase === 'enter') {
            // Oozes up from below — slow viscous rise
            const p = easeOutExpo(enterProgress)
            translateY = (1 - p) * 60
            // Squishy deformation as it rises: wider at base
            scaleY = 0.4 + p * 0.6
            scaleX = 1 + (1 - p) * 0.3
            opacity = Math.min(1, enterProgress * 3)
            // Drool thread below — extends then snaps
            droolLength = (1 - p) * 50 * droolVariance
          } else if (phase === 'hold') {
            // Gravity sag: slime letter very slowly elongating downward
            const sag = holdProgress * 8 * droolVariance
            translateY = sag
            scaleY = 1 + holdProgress * 0.06
            scaleX = 1 - holdProgress * 0.03
            // Growing drool thread — gravity pulls bottom down
            droolLength = holdProgress * 40 * droolVariance
          } else {
            // Drool snaps: letters snap upward then collapse
            const ep = easeInOutCubic(exitProgress)
            translateY = -ep * 30
            scaleY = 1 - ep * 0.7
            scaleX = 1 + ep * 0.4
            opacity = 1 - ep
            droolLength = (1 - exitProgress) * 40 * droolVariance
          }

          // Slime bulge filter approximation with border-radius on wrapper
          const bulgeFraction = Math.max(0, scaleY - 1) * 5

          return (
            <div key={ci} style={{ position: 'relative', display: 'inline-block' }}>
              {/* Drool thread */}
              {droolLength > 3 && (
                <div style={{
                  position: 'absolute',
                  bottom: -droolLength,
                  left: '40%',
                  width: `${4 + droolVariance * 4}px`,
                  height: droolLength,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}88 60%, ${color}00 100%)`,
                  borderRadius: '0 0 50% 50%',
                  opacity: 0.85,
                  zIndex: -1,
                }} />
              )}
              {/* Drool blob at end of thread */}
              {droolLength > 15 && (
                <div style={{
                  position: 'absolute',
                  bottom: -droolLength - 8,
                  left: `${35 + droolVariance * 10}%`,
                  width: `${8 + droolVariance * 6}px`,
                  height: `${8 + droolVariance * 6}px`,
                  borderRadius: '50%',
                  background: color,
                  opacity: 0.7,
                }} />
              )}
              <span style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(44px, 11vw, 150px)',
                fontWeight: 900,
                color,
                transform: `translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
                transformOrigin: 'center bottom',
                opacity,
                whiteSpace: 'pre',
                textShadow: `0 4px 16px ${color}66, 0 8px 32px rgba(0,0,0,0.4)`,
                lineHeight: 1,
                filter: `brightness(${1 + bulgeFraction * 0.1})`,
              }}>
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function SlimeDroolComponent(props: MotionGraphicProps<SlimeDroolConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slime-drool',
  title: 'Kinetic Slime Drool',
  description: 'Text letters ooze upward with thick slime physics — each character bulges, sags under gravity growing drool threads below, and snaps away on exit',
  tags: ['kinetic', 'typography', 'slime', 'drool', 'liquid', 'ooze', 'fluid', 'goo', 'deform', 'gravity'],
  category: 'captions',
  component: SlimeDroolComponent as any,
  defaultConfig: {
    words: ['OOZE', 'SLIME', 'DRIP', 'GOO'],
    colors: ['#57CC99', '#38A3A5', '#22577A', '#80ED99'],
    bgColor: '#0A1628',
    cycleDuration: 1.8,
    droolLength: 40,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OOZE', 'SLIME', 'DRIP', 'GOO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#57CC99', '#38A3A5', '#22577A', '#80ED99'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A1628', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'droolLength', label: 'Max Drool Length (px)', type: 'number', defaultValue: 40, min: 10, max: 80, group: 'Animation' },
  ],
})
