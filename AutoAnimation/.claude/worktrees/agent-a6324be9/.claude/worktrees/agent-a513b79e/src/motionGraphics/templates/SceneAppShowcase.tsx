import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AppShowcaseConfig {
  appName: string
  featureText: string
  frameColor: string
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneAppShowcaseComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<AppShowcaseConfig>) {
  const { appName, featureText, frameColor, accentColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Phone frame slides up from bottom
  const phoneY = (1 - easeOutCubic(Math.min(1, enterProgress / 0.5))) * 120
  const phoneOpacity = easeOutCubic(Math.min(1, enterProgress / 0.35))

  // App name fades in
  const nameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3)))
  const nameY = (1 - nameOpacity) * -20

  // Feature text slides in
  const featureOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.3)))
  const featureY = (1 - featureOpacity) * 20

  // Hold: phone subtle float, notification slides in
  const phoneFloat = Math.sin(holdProgress * Math.PI * 2.5) * 4

  // Fake notification slides in on phone during hold
  const notifProgress = holdProgress > 0.2 && holdProgress < 0.7
    ? easeOutBack(Math.min(1, (holdProgress - 0.2) / 0.2))
    : holdProgress >= 0.7
      ? 1 - easeOutCubic(Math.min(1, (holdProgress - 0.7) / 0.2))
      : 0

  // Phone screen content bars (fake UI)
  const barCount = 4
  const getBarsProgress = (idx: number): number => {
    const barStart = 0.3 + idx * 0.06
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - barStart) / 0.2)))
  }

  // Exit: phone sinks down
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * 150
  const exitOpacity = 1 - exitEased

  // Phone dimensions
  const phoneWidth = 'clamp(140px, 28vw, 220px)'
  const phoneHeight = 'clamp(260px, 52vw, 420px)'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 50%, ${accentColor}05 100%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(16px, 3vh, 32px)',
          opacity: exitOpacity,
        }}
      >
        {/* App name (above phone) */}
        <div
          style={{
            fontSize: 'clamp(22px, 4.5vw, 40px)',
            fontWeight: 800,
            color: textColor,
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          {appName}
        </div>

        {/* Phone mockup */}
        <div
          style={{
            position: 'relative',
            width: phoneWidth,
            height: phoneHeight,
            transform: `translateY(${phoneY + phoneFloat + exitY}px)`,
            opacity: phoneOpacity,
          }}
        >
          {/* Phone frame */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'clamp(20px, 4vw, 36px)',
              border: `3px solid ${frameColor}`,
              background: `${frameColor}08`,
              overflow: 'hidden',
            }}
          >
            {/* Status bar */}
            <div
              style={{
                height: 'clamp(20px, 4vw, 32px)',
                background: `${frameColor}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Notch */}
              <div
                style={{
                  width: 'clamp(50px, 10vw, 80px)',
                  height: 'clamp(12px, 2.5vw, 20px)',
                  borderRadius: 10,
                  background: bgColor,
                }}
              />
            </div>

            {/* Phone screen content - fake UI bars */}
            <div
              style={{
                padding: 'clamp(12px, 2.5vw, 20px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(8px, 1.5vw, 14px)',
              }}
            >
              {/* Header bar */}
              <div
                style={{
                  width: '60%',
                  height: 'clamp(8px, 1.5vw, 12px)',
                  borderRadius: 4,
                  background: accentColor,
                  opacity: getBarsProgress(0) * 0.6,
                }}
              />

              {/* Content bars */}
              {Array.from({ length: barCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: `${70 + (i % 3) * 10}%`,
                    height: 'clamp(6px, 1.2vw, 10px)',
                    borderRadius: 3,
                    background: `${frameColor}30`,
                    opacity: getBarsProgress(i),
                    transform: `translateX(${(1 - getBarsProgress(i)) * 15}px)`,
                  }}
                />
              ))}

              {/* Fake card */}
              <div
                style={{
                  marginTop: 'clamp(6px, 1.2vw, 12px)',
                  padding: 'clamp(8px, 1.5vw, 14px)',
                  borderRadius: 8,
                  background: `${accentColor}12`,
                  border: `1px solid ${accentColor}20`,
                  opacity: getBarsProgress(3),
                }}
              >
                <div
                  style={{
                    width: '80%',
                    height: 'clamp(5px, 1vw, 8px)',
                    borderRadius: 3,
                    background: `${frameColor}25`,
                    marginBottom: 6,
                  }}
                />
                <div
                  style={{
                    width: '55%',
                    height: 'clamp(5px, 1vw, 8px)',
                    borderRadius: 3,
                    background: `${frameColor}18`,
                  }}
                />
              </div>
            </div>

            {/* Notification slide-in */}
            {notifProgress > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'clamp(28px, 5.5vw, 44px)',
                  left: 'clamp(8px, 1.5vw, 14px)',
                  right: 'clamp(8px, 1.5vw, 14px)',
                  padding: 'clamp(8px, 1.5vw, 14px)',
                  background: `${accentColor}E6`,
                  borderRadius: 10,
                  transform: `translateY(${(1 - notifProgress) * -30}px)`,
                  opacity: notifProgress,
                  boxShadow: `0 4px 16px ${accentColor}40`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1.2vw, 10px)',
                  }}
                >
                  <div
                    style={{
                      width: 'clamp(16px, 3vw, 24px)',
                      height: 'clamp(16px, 3vw, 24px)',
                      borderRadius: 6,
                      background: '#FFFFFF30',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        width: 'clamp(50px, 10vw, 80px)',
                        height: 'clamp(4px, 0.8vw, 6px)',
                        borderRadius: 2,
                        background: '#FFFFFF90',
                        marginBottom: 3,
                      }}
                    />
                    <div
                      style={{
                        width: 'clamp(70px, 14vw, 110px)',
                        height: 'clamp(3px, 0.6vw, 5px)',
                        borderRadius: 2,
                        background: '#FFFFFF50',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phone shadow */}
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              left: '10%',
              right: '10%',
              height: 16,
              background: `radial-gradient(ellipse, ${accentColor}15 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Feature text (below phone) */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 500,
            color: `${textColor}CC`,
            opacity: featureOpacity,
            transform: `translateY(${featureY}px)`,
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          {featureText}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-app-showcase',
  title: 'Scene App Showcase',
  description:
    'App showcase with phone mockup sliding up, fake UI content, notification animation, and name/feature text',
  tags: ['scene', 'brand', 'app', 'showcase', 'phone', 'mobile', 'business'],
  category: 'scene-layout',
  component: SceneAppShowcaseComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'appName', label: 'App Name', type: 'text', defaultValue: 'MyApp', group: 'Content' },
    { key: 'featureText', label: 'Feature Text', type: 'text', defaultValue: 'Your new superpower', group: 'Content' },
    { key: 'frameColor', label: 'Frame Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0A1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    appName: 'MyApp',
    featureText: 'Your new superpower',
    frameColor: '#6366F1',
    accentColor: '#8B5CF6',
    bgColor: '#0F0A1A',
    textColor: '#FFFFFF',
  },
})
