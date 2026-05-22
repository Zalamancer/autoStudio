import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CinemaScopeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // CinemaScope 2.39:1 aspect ratio — bars take ~21% at top and bottom of 16:9 frame
    // Bar slides in from edge: 0 = fully off, 1 = fully on
    const cycleLen = 3.0
    const cycleT = time % cycleLen
    // Bars slide in first 0.4s, hold, then stay
    const barProgress = Math.min(1, cycleT / 0.4)
    const eased = 1 - Math.pow(1 - barProgress, 3)

    // Bar height in px — 21% of frame height (CinemaScope crop)
    const barH = height * 0.213

    // Subtle film grain in bars
    const grain = 0.92 + 0.05 * Math.sin(time * 89.3) + 0.03 * Math.sin(time * 193.7)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Scene background — deep cinema black */}
        <div style={{ position: 'absolute', inset: 0, background: '#050505' }} />
        {/* Subtle horizontal stripe texture in the open area */}
        <div
          style={{
            position: 'absolute',
            top: barH,
            left: 0,
            right: 0,
            bottom: barH,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.005) 3px, rgba(255,255,255,0.005) 4px)',
          }}
        />
        {/* Central warmth — projector light in scope format */}
        <div
          style={{
            position: 'absolute',
            top: barH,
            left: 0,
            right: 0,
            bottom: barH,
            background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(255,240,200,0.04) 0%, transparent 70%)',
          }}
        />
        {/* TOP BAR — slides in from top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: barH,
            background: `rgba(4,4,4,${grain})`,
            transform: `translateY(${(eased - 1) * 100}%)`,
          }}
        />
        {/* Top bar separator line */}
        <div
          style={{
            position: 'absolute',
            top: barH,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.08)',
            transform: `translateY(${(eased - 1) * barH}px)`,
          }}
        />
        {/* BOTTOM BAR — slides in from bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: barH,
            background: `rgba(4,4,4,${grain})`,
            transform: `translateY(${(1 - eased) * 100}%)`,
          }}
        />
        {/* Bottom bar separator line */}
        <div
          style={{
            position: 'absolute',
            bottom: barH,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.08)',
            transform: `translateY(${(1 - eased) * barH}px)`,
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 100% 70% at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, height }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 24

    // Text appears in the cinescope letterbox window
    // Slides in horizontally — wide aspect feels like a tracking shot
    let opacity = 0
    let translateX = 0
    let scale = 1

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased
      translateX = (1 - eased) * -60 // pan in from left like a scope shot
      scale = 0.96 + eased * 0.04
    } else if (phase === 'hold') {
      opacity = 1
      // Imperceptible slow rightward pan — scope camera move
      translateX = holdProgress * 8
      scale = 1
    } else {
      opacity = 1 - exitProgress
      translateX = holdProgress * 8 + exitProgress * 40 // continue pan, fade
      scale = 1
    }

    return (
      <>
        {/* Subtle scope anamorphic lens flare horizontal streak */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%)`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(38px, 9vw, 130px)',
            fontWeight: 700,
            color: 'rgba(200,220,255,0.15)',
            whiteSpace: 'nowrap',
            letterSpacing: 12,
            filter: 'blur(30px) scaleY(0.3)',
            opacity,
          }}
        >
          {word}
        </div>
        {/* Main text — wide letter-spacing for scope feel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(38px, 9vw, 130px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 10,
            textShadow: `0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(255,240,200,${opacity * 0.2})`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function CinemaScopeComponent(props: MotionGraphicProps<CinemaScopeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cinema-scope',
  title: 'Kinetic CinemaScope',
  description:
    'CinemaScope 2.39:1 aspect ratio bars slide in from edges, text pans in italic serif with anamorphic lens flare streak and scope camera move',
  tags: ['kinetic', 'typography', 'cinemascope', 'cinema', 'film', 'widescreen', 'anamorphic', 'letterbox'],
  category: 'captions',
  component: CinemaScopeComponent as any,
  defaultConfig: {
    words: ['WIDE', 'SCREEN', 'EPIC'],
    colors: ['#f0e8d0', '#e8dcc0', '#f0e8d0'],
    bgColor: '#050505',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WIDE', 'SCREEN', 'EPIC'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#f0e8d0', '#e8dcc0', '#f0e8d0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
