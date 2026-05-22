import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface Win95DialogConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Windows 95 teal desktop
    const win95Teal = '#008080'
    const win95Gray = '#C0C0C0'
    const win95DarkGray = '#808080'
    const win95White = '#FFFFFF'

    return (
      <div style={{ position: 'absolute', inset: 0, background: win95Teal }}>
        {/* Desktop icons (faint) */}
        {[
          { label: 'My Computer', top: 12, left: 12 },
          { label: 'Recycle Bin', top: 80, left: 12 },
          { label: 'Network', top: 148, left: 12 },
        ].map((icon) => (
          <div
            key={icon.label}
            style={{
              position: 'absolute',
              top: icon.top,
              left: icon.left,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: 0.15,
            }}
          >
            <div
              style={{
                width: 28,
                height: 24,
                background: win95Gray,
                border: `1px solid ${win95DarkGray}`,
                marginBottom: 2,
              }}
            />
            <span
              style={{
                fontFamily: "'MS Sans Serif', 'Tahoma', 'Arial', sans-serif",
                fontSize: 9,
                color: win95White,
                textShadow: '1px 1px 0 #000',
              }}
            >
              {icon.label}
            </span>
          </div>
        ))}

        {/* Dialog box frame (Win95 style 3D border) */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            right: '10%',
            bottom: '15%',
            background: win95Gray,
            // Win95 3D raised border effect
            borderTop: `2px solid ${win95White}`,
            borderLeft: `2px solid ${win95White}`,
            borderRight: `2px solid #404040`,
            borderBottom: `2px solid #404040`,
            boxShadow: `inset -1px -1px 0 ${win95DarkGray}, inset 1px 1px 0 #DFDFDF`,
          }}
        >
          {/* Title bar - classic blue gradient */}
          <div
            style={{
              height: 22,
              background: 'linear-gradient(90deg, #000080 0%, #1084D0 100%)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 4,
              paddingRight: 4,
              justifyContent: 'space-between',
            }}
          >
            {/* System icon */}
            <div
              style={{
                width: 14,
                height: 14,
                background: win95Gray,
                border: '1px solid #404040',
                marginRight: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 8, height: 6, border: '1px solid #000080' }} />
            </div>
            {/* Title text */}
            <span
              style={{
                flex: 1,
                fontFamily: "'MS Sans Serif', 'Tahoma', 'Arial', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: win95White,
                letterSpacing: 0.5,
              }}
            >
              Message
            </span>
            {/* Window control buttons */}
            <div style={{ display: 'flex', gap: 2 }}>
              {/* Minimize */}
              <div
                style={{
                  width: 16,
                  height: 14,
                  background: win95Gray,
                  borderTop: `1px solid ${win95White}`,
                  borderLeft: `1px solid ${win95White}`,
                  borderRight: `1px solid #404040`,
                  borderBottom: `1px solid #404040`,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 2,
                }}
              >
                <div style={{ width: 6, height: 2, background: '#000' }} />
              </div>
              {/* Maximize */}
              <div
                style={{
                  width: 16,
                  height: 14,
                  background: win95Gray,
                  borderTop: `1px solid ${win95White}`,
                  borderLeft: `1px solid ${win95White}`,
                  borderRight: `1px solid #404040`,
                  borderBottom: `1px solid #404040`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    border: '1px solid #000',
                    borderTop: '2px solid #000',
                  }}
                />
              </div>
              {/* Close */}
              <div
                style={{
                  width: 16,
                  height: 14,
                  background: win95Gray,
                  borderTop: `1px solid ${win95White}`,
                  borderLeft: `1px solid ${win95White}`,
                  borderRight: `1px solid #404040`,
                  borderBottom: `1px solid #404040`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'MS Sans Serif', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#000',
                }}
              >
                x
              </div>
            </div>
          </div>

          {/* Dialog content area */}
          <div style={{ padding: '12px 16px' }}>
            {/* Info icon circle */}
            <div
              style={{
                position: 'absolute',
                top: 40,
                left: 20,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: `2px solid #000080`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Times New Roman', serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#000080',
              }}
            >
              i
            </div>
          </div>

          {/* OK and Cancel buttons at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {['OK', 'Cancel'].map((label) => (
              <div
                key={label}
                style={{
                  width: 72,
                  height: 22,
                  background: win95Gray,
                  borderTop: `2px solid ${win95White}`,
                  borderLeft: `2px solid ${win95White}`,
                  borderRight: `2px solid #404040`,
                  borderBottom: `2px solid #404040`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'MS Sans Serif', 'Tahoma', 'Arial', sans-serif",
                  fontSize: 11,
                  color: '#000',
                  cursor: 'pointer',
                }}
              >
                {label === 'OK' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -2,
                      border: '1px dotted #000',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Taskbar at very bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 26,
            background: win95Gray,
            borderTop: `2px solid ${win95White}`,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
          }}
        >
          {/* Start button */}
          <div
            style={{
              height: 20,
              paddingLeft: 6,
              paddingRight: 10,
              background: win95Gray,
              borderTop: `2px solid ${win95White}`,
              borderLeft: `2px solid ${win95White}`,
              borderRight: `2px solid #404040`,
              borderBottom: `2px solid #404040`,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {/* Windows flag icon (simplified) */}
            <div
              style={{
                width: 14,
                height: 14,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: 1,
              }}
            >
              <div style={{ background: '#FF0000' }} />
              <div style={{ background: '#00FF00' }} />
              <div style={{ background: '#0000FF' }} />
              <div style={{ background: '#FFFF00' }} />
            </div>
            <span
              style={{
                fontFamily: "'MS Sans Serif', 'Tahoma', 'Arial', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                color: '#000',
              }}
            >
              Start
            </span>
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Windows 95 window appear: instant snap with brief title bar flash
      const visible = enterProgress > 0.1
      const flashIntensity = enterProgress < 0.3 ? (0.3 - enterProgress) / 0.2 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: visible ? 1 : 0,
          }}
        >
          <div
            style={{
              fontFamily: "'MS Sans Serif', 'Tahoma', 'Arial', sans-serif",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              textShadow: flashIntensity > 0
                ? `0 0 ${flashIntensity * 20}px rgba(255,255,255,0.8)`
                : 'none',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Cursor blink effect next to text (hourglass then arrow)
      const showCursor = Math.sin(f * 0.1) > 0

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
              fontFamily: "'MS Sans Serif', 'Tahoma', 'Arial', sans-serif",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
            }}
          >
            {word}
            {/* System hourglass cursor indicator */}
            {showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: 8,
                  fontSize: 'clamp(16px, 4vw, 40px)',
                  verticalAlign: 'middle',
                  opacity: 0.5,
                }}
              >
                {'\u231B'}
              </span>
            )}
          </div>
        </div>
      )
    } else {
      // Exit: window close — shrinks to title bar then disappears
      const shrinkPhase = Math.min(1, exitProgress * 2)
      const fadePhase = Math.max(0, (exitProgress - 0.5) * 2)
      const scaleY = 1 - shrinkPhase * 0.85
      const opacity = 1 - fadePhase

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleY(${scaleY})`,
            opacity,
            transformOrigin: 'center top',
          }}
        >
          <div
            style={{
              fontFamily: "'MS Sans Serif', 'Tahoma', 'Arial', sans-serif",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function Win95DialogComponent(props: MotionGraphicProps<Win95DialogConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-win95-dialog',
  title: 'Kinetic Win95 Dialog',
  description:
    'Windows 95 dialog box with 3D beveled borders, blue title bar gradient, OK/Cancel buttons, Start menu taskbar, traffic light system icons, and system font',
  tags: ['kinetic', 'typography', 'windows', 'win95', 'dialog', 'retro', 'os', 'computing'],
  category: 'captions',
  component: Win95DialogComponent as any,
  defaultConfig: {
    words: ['ERROR', 'ABORT', 'RETRY', 'FAIL'],
    colors: ['#000000', '#000000', '#000000', '#000000'],
    bgColor: '#008080',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ERROR', 'ABORT', 'RETRY', 'FAIL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#000000', '#000000', '#000000', '#000000'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#008080', group: 'Style' },
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
