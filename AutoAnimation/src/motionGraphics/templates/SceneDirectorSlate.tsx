import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneDirectorSlateConfig {
  sceneNumber: string
  takeNumber: string
  dateText: string
  directorName: string
  bgColor: string
  textColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneDirectorSlateComponent({
  config,
  progress,
}: MotionGraphicProps<SceneDirectorSlateConfig>) {
  const { sceneNumber, takeNumber, dateText, directorName, bgColor, textColor } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Clapper snap animation: rotates down on enter, up on exit
  const clapperRotation =
    enterProgress < 1
      ? -30 * (1 - easeOutBack(enterProgress))
      : exitProgress > 0
        ? -25 * easeInCubic(exitProgress)
        : 0

  // Overall opacity
  const opacity =
    enterProgress < 1
      ? easeOutCubic(enterProgress)
      : exitProgress > 0
        ? 1 - easeInCubic(exitProgress)
        : 1

  // Info fields stagger in
  const infoDelay = 0.4
  const infoEnter =
    enterProgress < 1 ? Math.max(0, (enterProgress - infoDelay) / (1 - infoDelay)) : 1
  const infoOpacity =
    infoEnter < 1
      ? easeOutCubic(infoEnter)
      : exitProgress > 0
        ? 1 - easeInCubic(exitProgress)
        : 1

  const stripeHeight = 8

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Slate container */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          width: '75%',
          maxWidth: '500px',
        }}
      >
        {/* Clapperboard top — animated stripes */}
        <div
          style={{
            transformOrigin: 'bottom left',
            transform: `rotateX(${clapperRotation}deg)`,
            marginBottom: '-2px',
          }}
        >
          {/* Black and white diagonal stripes */}
          <div
            style={{
              height: `${stripeHeight * 5}px`,
              background:
                'repeating-linear-gradient(135deg, #1a1a1a, #1a1a1a 12px, #e8e8e8 12px, #e8e8e8 24px)',
              borderRadius: '6px 6px 0 0',
              border: '2px solid #333',
              borderBottom: 'none',
            }}
          />
        </div>

        {/* Slate body */}
        <div
          style={{
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '0 0 6px 6px',
            padding: '24px 28px',
          }}
        >
          {/* Fields grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              opacity: infoOpacity,
            }}
          >
            {/* SCENE */}
            <div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#888',
                  marginBottom: '4px',
                }}
              >
                SCENE
              </div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(20px, 5vw, 40px)',
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {sceneNumber}
              </div>
            </div>

            {/* TAKE */}
            <div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#888',
                  marginBottom: '4px',
                }}
              >
                TAKE
              </div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(20px, 5vw, 40px)',
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {takeNumber}
              </div>
            </div>

            {/* DATE */}
            <div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#888',
                  marginBottom: '4px',
                }}
              >
                DATE
              </div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(14px, 3vw, 24px)',
                  fontWeight: 400,
                  color: textColor,
                }}
              >
                {dateText}
              </div>
            </div>

            {/* DIRECTOR */}
            <div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#888',
                  marginBottom: '4px',
                }}
              >
                DIRECTOR
              </div>
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(14px, 3vw, 24px)',
                  fontWeight: 400,
                  color: textColor,
                }}
              >
                {directorName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-director-slate',
  title: 'Scene Director Slate',
  description:
    'Film clapperboard slate showing Scene, Take, Date, and Director — clapper snaps down on enter and lifts on exit',
  tags: ['scene', 'slate', 'clapperboard', 'director', 'film', 'cinematic', 'production'],
  category: 'scene-layout',
  component: SceneDirectorSlateComponent as any,
  defaultConfig: {
    sceneNumber: '42',
    takeNumber: '3',
    dateText: '2026-03-19',
    directorName: 'A. Hitchcock',
    bgColor: '#111111',
    textColor: '#FFFFFF',
  },
  configSchema: [
    {
      key: 'sceneNumber',
      label: 'Scene Number',
      type: 'text',
      defaultValue: '42',
      group: 'Content',
    },
    {
      key: 'takeNumber',
      label: 'Take Number',
      type: 'text',
      defaultValue: '3',
      group: 'Content',
    },
    {
      key: 'dateText',
      label: 'Date',
      type: 'text',
      defaultValue: '2026-03-19',
      group: 'Content',
    },
    {
      key: 'directorName',
      label: 'Director',
      type: 'text',
      defaultValue: 'A. Hitchcock',
      group: 'Content',
    },
    {
      key: 'bgColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#111111',
      group: 'Style',
    },
    {
      key: 'textColor',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#FFFFFF',
      group: 'Style',
    },
  ],
})
