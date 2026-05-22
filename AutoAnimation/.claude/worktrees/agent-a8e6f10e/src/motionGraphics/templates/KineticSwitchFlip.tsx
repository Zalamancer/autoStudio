import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SwitchFlipConfig extends KineticBaseConfig {
  switchCount: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
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

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__switchFlipConfig ?? { switchCount: 1 }
    const switchCount = config.switchCount ?? 1

    // Each "character" or panel flips like a light switch: rotates on X-axis from -90 (up/off) to 0 (face-on/on)
    // We divide the word into switchCount panels, each flipping with stagger
    const panelWidth = width / switchCount
    const panelElements = []

    for (let i = 0; i < switchCount; i++) {
      const stagger = (i / switchCount) * 0.5
      let flipAngle = -90 // start flipped away

      if (phase === 'enter') {
        const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.6) / 0.4))
        const eased = easeOutBack(delayed)
        flipAngle = -90 + 90 * eased
      } else if (phase === 'hold') {
        // Subtle "on" pulse wobble
        flipAngle = Math.sin(holdProgress * Math.PI * 6) * 2
      } else {
        const reverseStagger = ((switchCount - 1 - i) / switchCount) * 0.4
        const delayed = Math.max(0, Math.min(1, (exitProgress - reverseStagger) / 0.6))
        const eased = easeInBack(delayed)
        flipAngle = -90 * eased
      }

      const panelOpacity = Math.max(0, Math.min(1, (flipAngle + 90) / 60))
      // Glow when "on" (near 0 degrees)
      const onGlow = Math.max(0, 1 - Math.abs(flipAngle) / 20)

      panelElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: i * panelWidth,
            top: 0,
            width: panelWidth,
            height,
            perspective: 900,
            overflow: 'hidden',
          }}
        >
          {/* Switch panel that flips */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'center top',
              transform: `rotateX(${flipAngle}deg)`,
              backfaceVisibility: 'hidden',
              opacity: panelOpacity,
            }}
          >
            {/* Panel face — shows clipped text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  onGlow > 0.5
                    ? `linear-gradient(180deg, ${color}18, ${color}08)`
                    : 'linear-gradient(180deg, rgba(40,40,60,0.6), rgba(20,20,40,0.8))',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                borderRight: '1px solid rgba(255,255,255,0.04)',
              }}
            />
            {/* Clipped text portion */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: -i * panelWidth,
                width,
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(40px, 11vw, 150px)',
                  fontWeight: 900,
                  color,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textShadow: onGlow > 0.3 ? `0 0 30px ${color}88, 0 2px 12px ${color}44` : 'none',
                }}
              >
                {word}
              </div>
            </div>

            {/* Switch plate screws at corners */}
            {[{ t: 8, l: 8 }, { t: 8, r: 8 }, { b: 8, l: 8 }, { b: 8, r: 8 }].map((pos, j) => (
              <div
                key={j}
                style={{
                  position: 'absolute',
                  top: (pos as any).t,
                  bottom: (pos as any).b,
                  left: (pos as any).l,
                  right: (pos as any).r,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'rgba(180,180,200,0.3)',
                }}
              />
            ))}
          </div>
        </div>,
      )
    }

    return <>{panelElements}</>
  },
}

function SwitchFlipComponent(props: MotionGraphicProps<SwitchFlipConfig>) {
  ;(globalThis as any).__switchFlipConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-switch-flip',
  title: 'Kinetic Switch Flip',
  description: 'Text panels flip in like light switch plates being turned on, snapping with back-easing and a glow',
  tags: ['kinetic', 'typography', 'switch', 'flip', 'light', 'reveal', 'mechanical', 'everyday', '3d'],
  category: 'captions',
  component: SwitchFlipComponent as any,
  defaultConfig: {
    words: ['ON', 'SWITCH', 'FLIP', 'LIGHT'],
    colors: ['#FFE566', '#FF8C42', '#4ECDC4', '#C084FC'],
    bgColor: '#0a0a14',
    cycleDuration: 1.4,
    switchCount: 4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ON', 'SWITCH', 'FLIP', 'LIGHT'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE566', '#FF8C42', '#4ECDC4', '#C084FC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'switchCount', label: 'Switch Panels', type: 'number', defaultValue: 4, min: 1, max: 8, group: 'Animation' },
  ],
})
