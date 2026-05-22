import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TermsOfServiceConfig {
  heading: string
  keyClause: string
  documentTitle: string
  bgColor: string
  paperColor: string
  textColor: string
  highlightColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

// Generate realistic-looking legal paragraphs
function generateTermsText(): string[] {
  return [
    '1. ACCEPTANCE OF TERMS',
    'By accessing and using this Service, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this Service.',
    '',
    '2. DESCRIPTION OF SERVICE',
    'The Service provides users with access to a rich collection of resources, including various communications tools, forums, and personalized content. You understand and agree that the Service is provided "AS-IS".',
    '',
    '3. REGISTRATION OBLIGATIONS',
    'In consideration of your use of the Service, you agree to: (a) provide true, accurate, current and complete information about yourself, and (b) maintain and promptly update said information.',
    '',
    '4. PRIVACY POLICY',
    'Registration data and certain other information about you is subject to our Privacy Policy. You understand that through your use of the Service you consent to the collection and use of this information.',
    '',
    '5. INDEMNITY',
    'You agree to indemnify and hold the Company harmless from any claim or demand, including reasonable attorneys\' fees, made by any third party due to or arising out of your breach of this Agreement.',
    '',
    '6. LIMITATION OF LIABILITY',
    'IN NO EVENT SHALL THE COMPANY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL.',
    '',
    '7. GOVERNING LAW',
    'These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions.',
    '',
    '8. CHANGES',
    'We reserve the right, at our sole discretion, to modify or replace these Terms at any time without prior notice.',
  ]
}

function SceneTermsOfServiceComponent({ config, progress, frame }: MotionGraphicProps<TermsOfServiceConfig>) {
  const { heading, keyClause, documentTitle, bgColor, paperColor, textColor, highlightColor, accentColor } = config
  const f = frame ?? 0
  const lines = generateTermsText()

  // Phases: appear (0-0.1), scroll (0.1-0.75), highlight-clause (0.75-0.9), exit (0.9-1)
  const enterProgress = progress < 0.1 ? progress / 0.1 : 1
  const scrollProgress = progress >= 0.1 && progress < 0.75 ? (progress - 0.1) / 0.65 : progress >= 0.75 ? 1 : 0
  const highlightProgress = progress >= 0.75 && progress < 0.9 ? (progress - 0.75) / 0.15 : progress >= 0.9 ? 1 : 0
  const exitProgress = progress >= 0.9 ? (progress - 0.9) / 0.1 : 0

  // Paper slide in
  const paperY = (1 - easeOutCubic(enterProgress)) * 30
  const paperOpacity = enterProgress

  // Scroll the document
  const totalScrollHeight = lines.length * 22
  const scrollOffset = scrollProgress * totalScrollHeight * 0.8

  // Highlight effect on key clause
  const highlightWidth = easeOutCubic(highlightProgress) * 100
  const highlightPulse = highlightProgress > 0.5 ? 1 + Math.sin(f * 0.15) * 0.02 : 1

  // Exit
  const exitOpacity = 1 - easeInCubic(exitProgress)
  const exitScale = 1 - exitProgress * 0.05

  // Scrollbar position
  const scrollbarTop = 10 + scrollProgress * 70

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Inter', '-apple-system', 'Segoe UI', sans-serif",
      }}
    >
      {/* Document paper */}
      <div
        style={{
          width: 'clamp(280px, 70vw, 520px)',
          height: 'clamp(360px, 80vh, 600px)',
          background: paperColor,
          borderRadius: 'clamp(8px, 1.5vw, 14px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
          transform: `translateY(${paperY}px) scale(${exitScale})`,
          opacity: paperOpacity * exitOpacity,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Document header */}
        <div
          style={{
            padding: 'clamp(14px, 2.5vw, 22px) clamp(18px, 3.5vw, 28px)',
            borderBottom: `1px solid ${textColor}0D`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 600,
              color: `${textColor}55`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'clamp(4px, 0.8vw, 8px)',
            }}
          >
            {documentTitle}
          </div>
          <div
            style={{
              fontSize: 'clamp(16px, 3.5vw, 26px)',
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.2,
            }}
          >
            {heading}
          </div>
          <div
            style={{
              marginTop: 'clamp(6px, 1vw, 10px)',
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              color: `${textColor}44`,
            }}
          >
            Last updated: January 1, 2026 | Effective immediately
          </div>
        </div>

        {/* Scrolling content area */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            padding: 'clamp(14px, 2.5vw, 22px) clamp(18px, 3.5vw, 28px)',
          }}
        >
          {/* Top fade */}
          {scrollOffset > 10 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 40,
                background: `linear-gradient(${paperColor}, ${paperColor}00)`,
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />
          )}

          <div
            style={{
              transform: `translateY(-${scrollOffset}px)`,
            }}
          >
            {lines.map((line, i) => {
              const isSection = line.match(/^\d+\./)
              const isKeyLine = i === 15 // The LIABILITY section
              return (
                <div
                  key={i}
                  style={{
                    fontSize: isSection
                      ? 'clamp(11px, 2vw, 15px)'
                      : 'clamp(9px, 1.5vw, 12px)',
                    fontWeight: isSection ? 700 : 400,
                    color: isSection ? textColor : `${textColor}88`,
                    lineHeight: line === '' ? 0.8 : 1.7,
                    marginBottom: isSection ? 'clamp(2px, 0.4vw, 4px)' : line === '' ? 'clamp(6px, 1vw, 10px)' : 0,
                    position: 'relative',
                  }}
                >
                  {/* Highlight marker on key clause */}
                  {isKeyLine && highlightProgress > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -1,
                        left: -4,
                        bottom: -1,
                        width: `${highlightWidth}%`,
                        background: `${highlightColor}25`,
                        borderRadius: 3,
                        borderLeft: `3px solid ${highlightColor}`,
                        transform: `scale(${highlightPulse})`,
                        transformOrigin: 'left center',
                        zIndex: 0,
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, color: isKeyLine && highlightProgress > 0.3 ? highlightColor : undefined, fontWeight: isKeyLine && highlightProgress > 0.3 ? 700 : undefined }}>
                    {line}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Bottom fade */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              background: `linear-gradient(${paperColor}00, ${paperColor})`,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Scrollbar track */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 4,
              bottom: 8,
              width: 4,
              background: `${textColor}08`,
              borderRadius: 2,
              zIndex: 3,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: `${scrollbarTop}%`,
                left: 0,
                right: 0,
                height: '20%',
                background: `${textColor}20`,
                borderRadius: 2,
              }}
            />
          </div>
        </div>

        {/* Footer with agree checkbox */}
        <div
          style={{
            padding: 'clamp(10px, 2vw, 16px) clamp(18px, 3.5vw, 28px)',
            borderTop: `1px solid ${textColor}0D`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 10px)',
            }}
          >
            <div
              style={{
                width: 'clamp(12px, 2vw, 16px)',
                height: 'clamp(12px, 2vw, 16px)',
                borderRadius: 3,
                border: `1.5px solid ${textColor}30`,
                background: scrollProgress > 0.9 ? accentColor : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {scrollProgress > 0.9 && (
                <div style={{ color: '#FFF', fontSize: 'clamp(8px, 1.4vw, 11px)', fontWeight: 700, lineHeight: 1 }}>
                  {'\\u2713'}
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                color: `${textColor}66`,
              }}
            >
              I have read and agree
            </div>
          </div>

          <div
            style={{
              padding: 'clamp(6px, 1vw, 10px) clamp(14px, 2.5vw, 22px)',
              borderRadius: 'clamp(4px, 0.8vw, 7px)',
              background: scrollProgress > 0.9 ? accentColor : `${textColor}10`,
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 600,
              color: scrollProgress > 0.9 ? '#FFFFFF' : `${textColor}44`,
            }}
          >
            Continue
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-terms-of-service',
  title: 'Scene Terms of Service',
  description: 'Wall of scrolling legal text with section headings, highlighted key clause with marker animation, scrollbar, and agree checkbox at the bottom',
  tags: ['scene', 'terms', 'legal', 'internet', 'tos', 'scroll', 'document', 'web'],
  category: 'scene-layout',
  component: SceneTermsOfServiceComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    heading: 'Terms of Service',
    keyClause: 'LIMITATION OF LIABILITY',
    documentTitle: 'Legal Agreement',
    bgColor: '#EAEEF3',
    paperColor: '#FFFFFF',
    textColor: '#1A1A2E',
    highlightColor: '#FF6B35',
    accentColor: '#4361EE',
  },
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Terms of Service', group: 'Content' },
    { key: 'keyClause', label: 'Key Clause', type: 'text', defaultValue: 'LIMITATION OF LIABILITY', group: 'Content' },
    { key: 'documentTitle', label: 'Document Title', type: 'text', defaultValue: 'Legal Agreement', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#EAEEF3', group: 'Style' },
    { key: 'paperColor', label: 'Paper Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'highlightColor', label: 'Highlight Color', type: 'color', defaultValue: '#FF6B35', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4361EE', group: 'Style' },
  ],
})
