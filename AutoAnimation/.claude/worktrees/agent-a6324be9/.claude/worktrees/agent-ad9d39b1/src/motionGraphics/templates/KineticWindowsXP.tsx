import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WindowsXPConfig extends KineticBaseConfig {}

// XP Bliss rolling hills constants
const CLOUD_POSITIONS = [
  { x: 15, y: 20, w: 80, h: 28 },
  { x: 55, y: 12, w: 60, h: 22 },
  { x: 72, y: 28, w: 50, h: 18 },
]

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // XP Bliss: bright cyan-to-blue sky, rolling green hills
    const cloudDrift = time * 8

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        {/* XP Bliss sky — that exact blue gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #1E90FF 0%, #4DBBFF 40%, #87CEEB 65%, #B0E0FF 80%, #C8EBF0 100%)',
          }}
        />

        {/* Rolling green hills — THE iconic Bliss hill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '45%',
            background: 'linear-gradient(180deg, #5DBB40 0%, #3D9E20 40%, #2E8010 100%)',
            borderRadius: '80% 80% 0 0 / 30% 30% 0 0',
          }}
        />
        {/* Secondary hill — left */}
        <div
          style={{
            position: 'absolute',
            left: '-20%',
            bottom: 0,
            width: '60%',
            height: '35%',
            background: 'linear-gradient(180deg, #4EA830 0%, #357018 100%)',
            borderRadius: '80% 80% 0 0 / 50% 50% 0 0',
          }}
        />
        {/* Secondary hill — right */}
        <div
          style={{
            position: 'absolute',
            right: '-15%',
            bottom: 0,
            width: '55%',
            height: '30%',
            background: 'linear-gradient(180deg, #4EA830 0%, #357018 100%)',
            borderRadius: '80% 80% 0 0 / 50% 50% 0 0',
          }}
        />

        {/* Fluffy XP clouds drifting slowly */}
        {CLOUD_POSITIONS.map((cloud, i) => {
          const drift = (cloudDrift * (0.5 + i * 0.3)) % 120
          return (
            <div key={i} style={{ position: 'absolute', left: `${cloud.x + drift * 0.1}%`, top: `${cloud.y}%` }}>
              {/* Main cloud body */}
              <div
                style={{
                  position: 'relative',
                  width: cloud.w,
                  height: cloud.h,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.92)',
                    borderRadius: '50%',
                    filter: 'blur(2px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: -cloud.h * 0.3,
                    left: '20%',
                    width: cloud.w * 0.45,
                    height: cloud.h * 0.7,
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '50%',
                    filter: 'blur(2px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: -cloud.h * 0.2,
                    left: '45%',
                    width: cloud.w * 0.35,
                    height: cloud.h * 0.55,
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '50%',
                    filter: 'blur(2px)',
                  }}
                />
              </div>
            </div>
          )
        })}

        {/* XP Taskbar at bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 'clamp(20px, 5vw, 36px)',
            background: 'linear-gradient(180deg, #2357B7 0%, #1647A7 40%, #1040A0 100%)',
            borderTop: '2px solid #4070D0',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            gap: 2,
          }}
        >
          {/* Start button */}
          <div
            style={{
              height: '80%',
              padding: '0 10px',
              background: 'linear-gradient(180deg, #57B040 0%, #2A8010 100%)',
              borderRadius: 12,
              border: '1px solid #1A6008',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: "'Tahoma', 'Arial', sans-serif",
              fontSize: 'clamp(8px, 1.8vw, 13px)',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 'clamp(10px, 2.5vw, 18px)' }}>⊞</span>
            <span>start</span>
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: '70%', background: '#3060C0', marginLeft: 4 }} />
          {/* Clock area — right side */}
          <div
            style={{
              position: 'absolute',
              right: 8,
              fontFamily: "'Tahoma', sans-serif",
              fontSize: 'clamp(7px, 1.5vw, 11px)',
              color: '#ffffff',
            }}
          >
            {`${Math.floor(time / 60) % 12 || 12}:${String(Math.floor(time) % 60).padStart(2, '0')} PM`}
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // XP window dialog box animation — slides in like a dialog opening
    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Window opens — pops in from center with slight overshoot
      const spring = Math.min(1, enterProgress * 1.1)
      scale = spring > 0.9 ? 1 + (1 - (spring - 0.9) / 0.1) * 0.05 : spring
      opacity = enterProgress
      translateY = (1 - enterProgress) * 30
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
    } else {
      // Window closes — shrinks and fades
      scale = 1 - exitProgress * 0.1
      opacity = 1 - exitProgress
      translateY = exitProgress * -20
    }

    // XP Luna blue title bar gradient
    const titleBarGrad = 'linear-gradient(180deg, #4090E8 0%, #1060D0 40%, #0848B8 70%, #0840A8 100%)'
    const windowBg = '#ECE9D8' // XP classic window color

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          minWidth: 'clamp(200px, 50vw, 500px)',
        }}
      >
        {/* XP Window chrome */}
        <div
          style={{
            background: windowBg,
            border: '2px solid #0050E0',
            borderRadius: '8px 8px 4px 4px',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.8)',
            overflow: 'hidden',
          }}
        >
          {/* Title bar */}
          <div
            style={{
              background: titleBarGrad,
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #0048C0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: "'Tahoma', 'Arial', sans-serif",
                fontSize: 'clamp(9px, 2vw, 13px)',
                color: '#ffffff',
                fontWeight: 700,
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              <span>📄</span>
              <span>Message</span>
            </div>
            {/* Window control buttons */}
            <div style={{ display: 'flex', gap: 2 }}>
              {['−', '□', '×'].map((btn, i) => (
                <div
                  key={i}
                  style={{
                    width: 'clamp(14px, 3.5vw, 22px)',
                    height: 'clamp(14px, 3.5vw, 22px)',
                    background:
                      i === 2
                        ? 'linear-gradient(180deg, #E86030 0%, #C03018 100%)'
                        : 'linear-gradient(180deg, #70A8E8 0%, #4080C0 100%)',
                    border: '1px solid rgba(0,0,0,0.4)',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 'clamp(8px, 1.8vw, 12px)',
                    fontWeight: 700,
                  }}
                >
                  {btn}
                </div>
              ))}
            </div>
          </div>
          {/* Window content */}
          <div
            style={{
              padding: 'clamp(8px, 3vw, 24px) clamp(10px, 3vw, 28px)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'Tahoma', 'Arial', sans-serif",
                fontSize: 'clamp(24px, 7vw, 90px)',
                fontWeight: 700,
                color: '#003399',
                whiteSpace: 'nowrap',
                textShadow: '1px 1px 0 rgba(255,255,255,0.9)',
                letterSpacing: '0.02em',
              }}
            >
              {word}
            </div>
          </div>
          {/* OK button at bottom */}
          <div
            style={{
              padding: '4px 8px',
              background: '#D4D0C8',
              borderTop: '1px solid #A0A090',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                padding: '2px 16px',
                background: 'linear-gradient(180deg, #FFFFF8 0%, #E0DDD0 100%)',
                border: '1px solid #707070',
                borderRadius: 3,
                fontFamily: "'Tahoma', sans-serif",
                fontSize: 'clamp(8px, 1.8vw, 12px)',
                color: '#000000',
                boxShadow: '1px 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              OK
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function WindowsXPComponent(props: MotionGraphicProps<WindowsXPConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-windows-xp',
  title: 'Kinetic Windows XP',
  description:
    'Windows XP Bliss aesthetic: rolling green hills, blue sky, clouds, taskbar, and text inside a Luna-styled dialog window',
  tags: ['kinetic', 'typography', 'windows-xp', 'bliss', 'microsoft', 'nostalgia', '2000s', 'desktop', 'ui'],
  category: 'captions',
  component: WindowsXPComponent as any,
  defaultConfig: {
    words: ['ERROR', 'OK', 'CANCEL', 'RETRY'],
    colors: ['#003399', '#003399', '#003399', '#003399'],
    bgColor: '#1E90FF',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ERROR', 'OK', 'CANCEL', 'RETRY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#003399', '#003399', '#003399', '#003399'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1E90FF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
