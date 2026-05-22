import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CookieConsentConfig {
  title: string
  legalText: string
  acceptText: string
  rejectText: string
  bgColor: string
  popupColor: string
  textColor: string
  accentColor: string
  rejectColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneCookieConsentComponent({ config, progress, frame }: MotionGraphicProps<CookieConsentConfig>) {
  const { title, legalText, acceptText, rejectText, bgColor, popupColor, textColor, accentColor, rejectColor } = config
  const f = frame ?? 0

  // Phases: slide-up (0-0.15), scroll-text (0.15-0.6), buttons-highlight (0.6-0.8), dismiss (0.8-1)
  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const scrollProgress = progress >= 0.15 && progress < 0.6 ? (progress - 0.15) / 0.45 : progress >= 0.6 ? 1 : 0
  const buttonPhase = progress >= 0.6 && progress < 0.8 ? (progress - 0.6) / 0.2 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Popup slides up from bottom
  const slideY = enterProgress < 1
    ? (1 - easeOutBack(enterProgress)) * 110
    : exitProgress > 0
      ? easeInCubic(exitProgress) * 120
      : 0

  const popupOpacity = exitProgress > 0.5 ? 1 - (exitProgress - 0.5) / 0.5 : 1

  // Text scroll offset (the long legal text scrolls up inside a container)
  const maxScroll = 200
  const scrollOffset = scrollProgress * maxScroll

  // Highlight key clause during scroll
  const highlightStart = 0.3
  const highlightEnd = 0.7
  const showHighlight = scrollProgress >= highlightStart && scrollProgress <= highlightEnd
  const highlightOpacity = showHighlight
    ? scrollProgress < (highlightStart + highlightEnd) / 2
      ? (scrollProgress - highlightStart) / ((highlightEnd - highlightStart) / 2)
      : 1 - (scrollProgress - (highlightStart + highlightEnd) / 2) / ((highlightEnd - highlightStart) / 2)
    : 0

  // Button hover animation
  const acceptHover = buttonPhase > 0.3 && buttonPhase < 0.7
  const rejectHover = buttonPhase > 0.6

  // Overlay dimming
  const overlayOpacity = enterProgress * 0.5 * (1 - exitProgress)

  // Split the legal text into lines for the scrolling effect
  const textLines = legalText.split('. ').map((s, i, arr) => i < arr.length - 1 ? s + '.' : s)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Inter', '-apple-system', sans-serif",
      }}
    >
      {/* Fake website content behind */}
      <div style={{ position: 'absolute', inset: 0, padding: '8%', opacity: 0.15 }}>
        <div style={{ width: '60%', height: 12, background: textColor, borderRadius: 6, marginBottom: 16 }} />
        <div style={{ width: '90%', height: 8, background: textColor, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ width: '85%', height: 8, background: textColor, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ width: '75%', height: 8, background: textColor, borderRadius: 4, marginBottom: 20 }} />
        <div style={{ width: '40%', height: 100, background: textColor, borderRadius: 8, marginBottom: 16, display: 'inline-block', marginRight: '4%' }} />
        <div style={{ width: '40%', height: 100, background: textColor, borderRadius: 8, marginBottom: 16, display: 'inline-block' }} />
      </div>

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000000',
          opacity: overlayOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Cookie popup */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '5%',
          right: '5%',
          maxHeight: '75%',
          background: popupColor,
          borderRadius: 'clamp(12px, 2.5vw, 20px)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
          transform: `translateY(${slideY}%)`,
          opacity: popupOpacity,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'clamp(12px, 2.5vw, 20px) clamp(16px, 3vw, 24px)',
            borderBottom: `1px solid ${textColor}10`,
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 12px)',
            flexShrink: 0,
          }}
        >
          {/* Cookie icon */}
          <div
            style={{
              width: 'clamp(24px, 4vw, 36px)',
              height: 'clamp(24px, 4vw, 36px)',
              borderRadius: '50%',
              background: '#D2A050',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* Chocolate chips */}
            {[
              { top: '20%', left: '25%' },
              { top: '50%', left: '55%' },
              { top: '65%', left: '20%' },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  ...pos,
                  width: '18%',
                  height: '18%',
                  borderRadius: '50%',
                  background: '#5C3D1A',
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 'clamp(14px, 3vw, 22px)',
              fontWeight: 700,
              color: textColor,
            }}
          >
            {title}
          </div>
        </div>

        {/* Scrolling text body */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            padding: 'clamp(12px, 2vw, 18px) clamp(16px, 3vw, 24px)',
            maxHeight: 'clamp(120px, 30vw, 220px)',
          }}
        >
          {/* Fade gradient top */}
          {scrollOffset > 10 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 30,
                background: `linear-gradient(${popupColor}, transparent)`,
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
          )}

          <div
            style={{
              transform: `translateY(-${scrollOffset}px)`,
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              lineHeight: 1.7,
              color: `${textColor}AA`,
            }}
          >
            {textLines.map((line, i) => {
              const isHighlighted = i === 3 && showHighlight
              return (
                <span key={i}>
                  <span
                    style={{
                      background: isHighlighted ? `${accentColor}${Math.floor(highlightOpacity * 40).toString(16).padStart(2, '0')}` : 'transparent',
                      color: isHighlighted ? accentColor : `${textColor}AA`,
                      fontWeight: isHighlighted ? 700 : 400,
                      borderRadius: 2,
                      padding: isHighlighted ? '1px 3px' : 0,
                    }}
                  >
                    {line}
                  </span>
                  {' '}
                </span>
              )
            })}
          </div>

          {/* Fade gradient bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 30,
              background: `linear-gradient(transparent, ${popupColor})`,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Buttons */}
        <div
          style={{
            padding: 'clamp(12px, 2vw, 18px) clamp(16px, 3vw, 24px)',
            borderTop: `1px solid ${textColor}10`,
            display: 'flex',
            gap: 'clamp(8px, 1.5vw, 12px)',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          {/* Reject button */}
          <div
            style={{
              padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)',
              borderRadius: 'clamp(6px, 1.2vw, 10px)',
              border: `1.5px solid ${textColor}20`,
              fontSize: 'clamp(11px, 2vw, 15px)',
              fontWeight: 600,
              color: rejectHover ? rejectColor : `${textColor}88`,
              background: rejectHover ? `${rejectColor}10` : 'transparent',
              transform: rejectHover ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            {rejectText}
          </div>

          {/* Accept button */}
          <div
            style={{
              padding: 'clamp(8px, 1.5vw, 12px) clamp(20px, 4vw, 32px)',
              borderRadius: 'clamp(6px, 1.2vw, 10px)',
              background: acceptHover ? accentColor : `${accentColor}DD`,
              fontSize: 'clamp(11px, 2vw, 15px)',
              fontWeight: 700,
              color: '#FFFFFF',
              boxShadow: acceptHover ? `0 4px 12px ${accentColor}40` : 'none',
              transform: acceptHover ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {acceptText}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-cookie-consent',
  title: 'Scene Cookie Consent',
  description: 'Satirical cookie consent popup with scrolling absurdly long legal text, highlighted key clause, and hover effects on accept/reject buttons',
  tags: ['scene', 'cookie', 'consent', 'internet', 'popup', 'web', 'privacy', 'gdpr', 'humor'],
  category: 'scene-layout',
  component: SceneCookieConsentComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'We Value Your Privacy',
    legalText: 'By continuing to browse this site you agree to the use of cookies. We use essential cookies for basic functionality. We also use analytics cookies to understand how visitors use our site. Third-party cookies are used by our advertising partners to build a profile of your interests and show you relevant ads on other sites. We may also share your data with our 847 trusted partners across 193 countries for purposes including but not limited to targeted advertising, behavioral analysis, cross-device tracking, and building detailed consumer profiles. Your soul may or may not be included in this agreement. By clicking Accept you acknowledge that you have read all 42 pages of this policy.',
    acceptText: 'Accept All',
    rejectText: 'Reject',
    bgColor: '#F5F5F5',
    popupColor: '#FFFFFF',
    textColor: '#1A1A2E',
    accentColor: '#4361EE',
    rejectColor: '#E63946',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'We Value Your Privacy', group: 'Content' },
    { key: 'legalText', label: 'Legal Text', type: 'text', defaultValue: 'By continuing to browse this site you agree to the use of cookies...', group: 'Content' },
    { key: 'acceptText', label: 'Accept Button', type: 'text', defaultValue: 'Accept All', group: 'Content' },
    { key: 'rejectText', label: 'Reject Button', type: 'text', defaultValue: 'Reject', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F5F5', group: 'Style' },
    { key: 'popupColor', label: 'Popup Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'accentColor', label: 'Accept Color', type: 'color', defaultValue: '#4361EE', group: 'Style' },
    { key: 'rejectColor', label: 'Reject Color', type: 'color', defaultValue: '#E63946', group: 'Style' },
  ],
})
