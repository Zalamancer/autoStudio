import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AmigaConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Amiga Workbench blue/white/orange palette
    const wbBlue = '#0055AA'
    const wbOrange = '#FF8800'
    const wbWhite = '#FFFFFF'

    return (
      <div style={{ position: 'absolute', inset: 0, background: wbBlue }}>
        {/* Workbench title bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 22,
            background: wbWhite,
            borderBottom: `2px solid ${wbOrange}`,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 12,
              fontWeight: 700,
              color: wbBlue,
              letterSpacing: 1,
            }}
          >
            Workbench 3.1
          </span>
          {/* Depth gadget (Amiga window control) */}
          <div style={{ display: 'flex', gap: 2 }}>
            <div
              style={{
                width: 18,
                height: 14,
                border: `2px solid ${wbBlue}`,
                background: wbWhite,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  width: 10,
                  height: 6,
                  border: `1px solid ${wbBlue}`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Workbench window frame */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 20,
            right: 20,
            bottom: 30,
            border: `2px solid ${wbWhite}`,
            borderRadius: 0,
          }}
        >
          {/* Window drag bar with stripes */}
          <div
            style={{
              height: 20,
              background: wbBlue,
              borderBottom: `2px solid ${wbWhite}`,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 6,
              paddingRight: 6,
              justifyContent: 'space-between',
            }}
          >
            {/* Close gadget */}
            <div
              style={{
                width: 16,
                height: 12,
                border: `2px solid ${wbWhite}`,
                background: wbOrange,
              }}
            />
            {/* Drag bar stripes */}
            <div
              style={{
                flex: 1,
                marginLeft: 6,
                marginRight: 6,
                height: 10,
                backgroundImage: `repeating-linear-gradient(0deg, ${wbWhite} 0px, ${wbWhite} 2px, transparent 2px, transparent 4px)`,
                opacity: 0.5,
              }}
            />
            {/* Window title */}
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 10,
                color: wbWhite,
                whiteSpace: 'nowrap',
                marginRight: 6,
              }}
            >
              Shell
            </span>
            {/* Depth gadget */}
            <div
              style={{
                width: 16,
                height: 12,
                border: `2px solid ${wbWhite}`,
                background: wbBlue,
              }}
            />
          </div>
          {/* Window body - dark blue */}
          <div style={{ position: 'absolute', top: 22, left: 0, right: 0, bottom: 0, background: '#001133' }} />
        </div>

        {/* Animated floppy disk icon */}
        <div
          style={{
            position: 'absolute',
            right: 30,
            bottom: 40,
            width: 40,
            height: 36,
            background: wbOrange,
            border: `2px solid ${wbWhite}`,
            opacity: 0.15 + Math.sin(time * 2) * 0.05,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: 8,
              right: 8,
              height: 10,
              background: wbWhite,
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 1
    let translateY = 0
    let displayText = word

    if (phase === 'enter') {
      // Amiga window open effect: expand from center horizontally then vertically
      const hOpen = Math.min(1, enterProgress * 2.5)
      const vOpen = Math.max(0, (enterProgress - 0.4) / 0.6)
      const scaleX = 0.1 + hOpen * 0.9
      const scaleY = 0.1 + vOpen * 0.9
      opacity = enterProgress > 0.05 ? 1 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
            opacity,
            transformOrigin: 'center center',
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              textShadow: `2px 2px 0 rgba(0,0,0,0.5)`,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Gentle Amiga proportional font shimmer
      const shimmer = Math.sin(f * 0.06) * 0.08

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              textShadow: `2px 2px 0 rgba(0,0,0,0.5), 0 0 ${8 + shimmer * 20}px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
          {/* Amiga-style underline selection bar */}
          <div
            style={{
              height: 4,
              background: '#FF8800',
              marginTop: 4,
              opacity: 0.7 + shimmer,
            }}
          />
        </div>
      )
    } else {
      // Exit: Amiga window close — collapse vertically then horizontally
      const vClose = Math.min(1, exitProgress * 2.5)
      const hClose = Math.max(0, (exitProgress - 0.4) / 0.6)
      const scaleY = 1 - vClose * 0.9
      const scaleX = 1 - hClose * 0.9
      opacity = exitProgress < 0.95 ? 1 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
            opacity,
            transformOrigin: 'center center',
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              textShadow: `2px 2px 0 rgba(0,0,0,0.5)`,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function AmigaComponent(props: MotionGraphicProps<AmigaConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-amiga',
  title: 'Kinetic Amiga',
  description:
    'Amiga Workbench 3.1 window chrome with drag bar stripes, depth gadgets, window open/close animations, and classic blue/white/orange palette',
  tags: ['kinetic', 'typography', 'amiga', 'workbench', 'retro', 'os', 'commodore', 'computing'],
  category: 'captions',
  component: AmigaComponent as any,
  defaultConfig: {
    words: ['GURU', 'AMIGA', 'DEMO', 'BOING'],
    colors: ['#FF8800', '#FFFFFF', '#FF8800', '#FFFFFF'],
    bgColor: '#0055AA',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['GURU', 'AMIGA', 'DEMO', 'BOING'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF8800', '#FFFFFF', '#FF8800', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0055AA', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
