import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BeforeAfterConfig {
  beforeText: string
  afterText: string
  beforeColor: string
  afterColor: string
  dividerColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneBeforeAfterComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<BeforeAfterConfig>) {
  const { beforeText, afterText, beforeColor, afterColor, dividerColor, bgColor } = config
  const progress = frame / durationInFrames

  // Enter: divider slides from left edge to center (0-0.25)
  const enterProgress = easeOutCubic(Math.min(1, progress / 0.25))
  const dividerPosition = enterProgress * 50 // 0% to 50%

  // Hold: divider glow pulse (0.25-0.75)
  const holdProgress = progress >= 0.25 && progress < 0.75 ? (progress - 0.25) / 0.5 : 0
  const glowPulse = holdProgress > 0 ? 0.4 + 0.6 * Math.sin(holdProgress * Math.PI * 4) : 0

  // Exit: AFTER side expands to fill (0.75-1.0)
  const exitProgress = progress >= 0.75 ? easeInCubic((progress - 0.75) / 0.25) : 0
  const afterExpand = dividerPosition * (1 - exitProgress) // divider moves from 50% to 0%

  // Labels fade in
  const beforeLabelProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) / 0.15)))
  const afterLabelProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.15)))

  // Before text fades out during exit
  const beforeOpacity = 1 - easeOutCubic(exitProgress)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* BEFORE side */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${afterExpand}%`,
          height: '100%',
          background: beforeColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: beforeOpacity,
        }}
      >
        {/* BEFORE label */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 700,
            color: '#FFFFFF80',
            textTransform: 'uppercase',
            letterSpacing: 4,
            marginBottom: '4%',
            opacity: beforeLabelProgress,
          }}
        >
          Before
        </div>
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 44px)',
            fontWeight: 800,
            color: '#FFFFFF',
            textAlign: 'center',
            padding: '0 10%',
            opacity: beforeLabelProgress,
            lineHeight: 1.3,
          }}
        >
          {beforeText}
        </div>
      </div>

      {/* AFTER side */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: `${100 - afterExpand}%`,
          height: '100%',
          background: afterColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* AFTER label */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 700,
            color: '#FFFFFF80',
            textTransform: 'uppercase',
            letterSpacing: 4,
            marginBottom: '4%',
            opacity: afterLabelProgress,
          }}
        >
          After
        </div>
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 44px)',
            fontWeight: 800,
            color: '#FFFFFF',
            textAlign: 'center',
            padding: '0 10%',
            opacity: afterLabelProgress,
            lineHeight: 1.3,
          }}
        >
          {afterText}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${afterExpand}%`,
          width: 4,
          height: '100%',
          background: dividerColor,
          transform: 'translateX(-50%)',
          boxShadow: glowPulse > 0
            ? `0 0 ${10 + glowPulse * 20}px ${dividerColor}, 0 0 ${5 + glowPulse * 10}px ${dividerColor}`
            : `0 0 10px ${dividerColor}60`,
          zIndex: 10,
        }}
      >
        {/* Divider handle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(30px, 5vw, 48px)',
            height: 'clamp(30px, 5vw, 48px)',
            borderRadius: '50%',
            background: dividerColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(12px, 2vw, 20px)',
            color: '#000',
            fontWeight: 900,
            boxShadow: `0 0 20px ${dividerColor}80`,
            opacity: beforeOpacity,
          }}
        >
          {'⟷'}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-before-after',
  title: 'Before & After',
  description:
    'Split-screen before/after comparison with animated divider reveal and expansion exit',
  tags: ['scene', 'educational', 'comparison', 'before-after', 'transformation'],
  category: 'scene-layout',
  component: SceneBeforeAfterComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'beforeText', label: 'Before Text', type: 'text', defaultValue: 'The old way', group: 'Content' },
    { key: 'afterText', label: 'After Text', type: 'text', defaultValue: 'The new way', group: 'Content' },
    { key: 'beforeColor', label: 'Before Color', type: 'color', defaultValue: '#C0392B', group: 'Style' },
    { key: 'afterColor', label: 'After Color', type: 'color', defaultValue: '#27AE60', group: 'Style' },
    { key: 'dividerColor', label: 'Divider Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
  ],
  defaultConfig: {
    beforeText: 'The old way',
    afterText: 'The new way',
    beforeColor: '#C0392B',
    afterColor: '#27AE60',
    dividerColor: '#FFFFFF',
    bgColor: '#1A1A2E',
  },
})
