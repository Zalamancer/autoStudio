import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// KineticElevatorDoors: Two flat center-parting doors slide open horizontally with
// a pronounced mechanical hesitation (pause-then-snap), thick door-edge chrome trim,
// and a floor indicator strip. Distinct from KineticDoorOpen (which uses rotateY swing).
interface ElevatorDoorsConfig extends KineticBaseConfig {
  floorNumber: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

// Mechanical hesitation: slow start, snap open, overshoot slightly
function easeElevator(t: number): number {
  if (t < 0.2) return t * t * 2 // slow buildup
  const t2 = (t - 0.2) / 0.8
  return 0.08 + 0.92 * easeOutExpo(t2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__elevatorDoorsConfig ?? { floorNumber: 1 }
    const floorNumber = config.floorNumber ?? 1

    let openProgress = 0
    if (phase === 'enter') {
      openProgress = easeElevator(enterProgress)
    } else if (phase === 'hold') {
      openProgress = 1
    } else {
      // Doors close with a firm snap
      openProgress = 1 - easeInExpo(exitProgress)
    }

    // Each door slides outward by half the width (plus a little extra for full clearance)
    const doorWidth = width / 2
    const maxSlide = doorWidth + 4
    const slideAmount = openProgress * maxSlide

    // Door chrome edge thickness
    const edgeW = 6
    const doorGap = 1 // gap at center seam

    // Elevator indicator strip at top
    const indicatorH = height * 0.06

    const textOpacity =
      phase === 'enter'
        ? Math.min(1, (enterProgress - 0.1) / 0.9 * 1.5)
        : phase === 'hold'
          ? 1
          : Math.max(0, 1 - exitProgress * 2)

    // Rubber seal lines (vertical) on the door edges that face the center gap
    const sealOpacity = 1 - openProgress * 0.8

    return (
      <>
        {/* Elevator cab interior indicator strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: indicatorH,
            background: 'linear-gradient(180deg, rgba(30,32,40,0.95), rgba(20,22,30,0.85))',
            borderBottom: '1px solid rgba(255,215,80,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            zIndex: 20,
          }}
        >
          {/* Floor number display */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: Math.max(10, indicatorH * 0.55),
              fontWeight: 700,
              color: 'rgba(255,215,80,0.85)',
              letterSpacing: '0.1em',
            }}
          >
            {floorNumber < 0 ? `B${Math.abs(floorNumber)}` : floorNumber}
          </div>
          {/* Ding indicator dot */}
          <div
            style={{
              width: Math.max(4, indicatorH * 0.25),
              height: Math.max(4, indicatorH * 0.25),
              borderRadius: '50%',
              background: openProgress > 0.1 && openProgress < 0.95 ? 'rgba(255,215,80,0.9)' : 'rgba(80,70,40,0.4)',
              boxShadow: openProgress > 0.1 && openProgress < 0.95 ? '0 0 8px rgba(255,215,80,0.6)' : 'none',
            }}
          />
        </div>

        {/* Text behind the doors */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
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

        {/* Left door */}
        <div
          style={{
            position: 'absolute',
            top: indicatorH,
            left: 0,
            width: doorWidth,
            height: height - indicatorH,
            transform: `translateX(${-slideAmount}px)`,
            background: 'linear-gradient(90deg, rgba(75,78,92,0.95) 0%, rgba(95,98,115,0.97) 80%, rgba(110,113,130,0.95) 100%)',
            borderRight: `${edgeW}px solid rgba(180,183,198,0.7)`,
            overflow: 'hidden',
          }}
        >
          {/* Door panel inset rectangle */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '12%',
              right: '18%',
              bottom: '8%',
              border: '1px solid rgba(120,123,138,0.35)',
              borderRadius: 2,
            }}
          />
          {/* Vertical brushed-metal reflection stripe */}
          <div
            style={{
              position: 'absolute',
              left: '55%',
              top: 0,
              width: '8%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(200,202,215,0.08), transparent)',
            }}
          />
          {/* Center-edge rubber seal */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 3,
              height: '100%',
              background: `rgba(30,32,40,${sealOpacity * 0.9})`,
            }}
          />
        </div>

        {/* Right door */}
        <div
          style={{
            position: 'absolute',
            top: indicatorH,
            left: doorWidth + doorGap,
            width: doorWidth,
            height: height - indicatorH,
            transform: `translateX(${slideAmount}px)`,
            background: 'linear-gradient(270deg, rgba(75,78,92,0.95) 0%, rgba(95,98,115,0.97) 80%, rgba(110,113,130,0.95) 100%)',
            borderLeft: `${edgeW}px solid rgba(180,183,198,0.7)`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '18%',
              right: '12%',
              bottom: '8%',
              border: '1px solid rgba(120,123,138,0.35)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '37%',
              top: 0,
              width: '8%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(200,202,215,0.08), transparent)',
            }}
          />
          {/* Center-edge rubber seal */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 3,
              height: '100%',
              background: `rgba(30,32,40,${sealOpacity * 0.9})`,
            }}
          />
        </div>

        {/* Bottom threshold strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 5,
            background: 'linear-gradient(180deg, rgba(100,103,118,0.5), rgba(60,62,75,0.7))',
          }}
        />
      </>
    )
  },
}

function ElevatorDoorsComponent(props: MotionGraphicProps<ElevatorDoorsConfig>) {
  ;(globalThis as any).__elevatorDoorsConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-elevator-doors',
  title: 'Kinetic Elevator Doors',
  description: 'Elevator doors slide apart from center with mechanical hesitation, floor indicator, and chrome trim revealing text inside the cab',
  tags: ['kinetic', 'typography', 'elevator', 'doors', 'reveal', 'mechanical', 'geometric', 'slide'],
  category: 'captions',
  component: ElevatorDoorsComponent as any,
  defaultConfig: {
    words: ['FLOOR', 'LOBBY', 'PENTHOUSE', 'ARRIVE'],
    colors: ['#F8FAFC', '#E2E8F0', '#FDE68A', '#F0F9FF'],
    bgColor: '#0a0b10',
    cycleDuration: 2.0,
    floorNumber: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FLOOR', 'LOBBY', 'PENTHOUSE', 'ARRIVE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F8FAFC', '#E2E8F0', '#FDE68A', '#F0F9FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0b10', group: 'Style' },
    {
      key: 'floorNumber',
      label: 'Floor Number',
      type: 'number',
      defaultValue: 1,
      min: -9,
      max: 99,
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.6,
      max: 5,
      group: 'Timing',
    },
  ],
})
