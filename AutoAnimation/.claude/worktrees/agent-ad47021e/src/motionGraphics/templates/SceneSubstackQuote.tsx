import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSubstackQuoteConfig {
  quoteText: string
  authorName: string
  publicationName: string
  publishDate: string
  subscriberCount: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
  quoteColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSubstackQuoteComponent({ config, progress }: MotionGraphicProps<SceneSubstackQuoteConfig>) {
  const { quoteText, authorName, publicationName, publishDate, subscriberCount, bgColor, cardColor, accentColor, textColor, quoteColor } = config

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Substack logo/header fades in
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.15))

  // Publication name slides in
  const pubOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.05) / 0.15)))
  const pubY = (1 - pubOpacity) * 10

  // Accent bar draws from left
  const barWidth = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.12) / 0.2)))

  // Quote mark scales in
  const quoteMarkScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.18)))

  // Quote text reveals line by line
  const lines = quoteText.split('\n').filter(Boolean)
  const lineReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))

  // Author byline slides up
  const authorOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.15)))
  const authorY = (1 - authorOpacity) * 12

  // Subscribe button appears
  const subscribeScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.82) / 0.15)))

  // Date and subscriber count
  const metaOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.88) / 0.12)))

  // Hold: accent bar subtle glow
  const barGlow = 4 + Math.sin(holdProgress * Math.PI * 3) * 3

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.06

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: bgColor,
      fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '5%',
    }}>
      <div style={{
        background: cardColor,
        borderRadius: 'clamp(6px, 1vw, 10px)',
        maxWidth: 440, width: '100%',
        opacity: exitOpacity, transform: `scale(${exitScale})`,
        overflow: 'hidden',
        border: `1px solid ${textColor}08`,
      }}>
        {/* Substack header with orange accent */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'clamp(12px, 2.2vw, 20px) clamp(18px, 3.5vw, 30px)',
          borderBottom: `1px solid ${textColor}08`,
          opacity: headerOpacity,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 10px)',
          }}>
            {/* Substack icon */}
            <div style={{
              width: 'clamp(18px, 3vw, 24px)', height: 'clamp(18px, 3vw, 24px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              gap: 'clamp(2px, 0.3vw, 3px)',
            }}>
              <div style={{ height: 'clamp(2px, 0.4vw, 3px)', background: accentColor, borderRadius: 1 }} />
              <div style={{ height: 'clamp(2px, 0.4vw, 3px)', background: accentColor, borderRadius: 1 }} />
              <div style={{ height: 'clamp(2px, 0.4vw, 3px)', background: accentColor, borderRadius: 1, width: '60%' }} />
            </div>
            <span style={{
              fontSize: 'clamp(11px, 1.8vw, 15px)', fontWeight: 700,
              fontFamily: "'-apple-system', 'Helvetica Neue', sans-serif",
              color: textColor, letterSpacing: '-0.02em',
              opacity: pubOpacity, transform: `translateY(${pubY}px)`, display: 'inline-block',
            }}>{publicationName}</span>
          </div>
          {/* Subscribe button */}
          <div style={{
            background: accentColor,
            borderRadius: 'clamp(14px, 2.5vw, 20px)',
            padding: 'clamp(4px, 0.7vw, 7px) clamp(12px, 2vw, 18px)',
            transform: `scale(${subscribeScale})`,
          }}>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 600,
              fontFamily: "'-apple-system', 'Helvetica Neue', sans-serif",
              color: '#FFFFFF',
            }}>Subscribe</span>
          </div>
        </div>

        {/* Quote content */}
        <div style={{
          padding: 'clamp(20px, 4vw, 36px) clamp(18px, 3.5vw, 30px)',
        }}>
          {/* Left accent bar + quote */}
          <div style={{
            display: 'flex', gap: 'clamp(12px, 2.2vw, 20px)',
          }}>
            {/* Accent bar */}
            <div style={{
              width: 'clamp(3px, 0.5vw, 4px)',
              background: accentColor,
              borderRadius: 2,
              minHeight: 'clamp(40px, 8vh, 80px)',
              transform: `scaleY(${barWidth})`,
              transformOrigin: 'top',
              boxShadow: `0 0 ${barGlow}px ${accentColor}40`,
            }} />

            <div style={{ flex: 1 }}>
              {/* Opening quote mark */}
              <div style={{
                fontSize: 'clamp(36px, 8vw, 60px)', fontWeight: 700,
                color: quoteColor, lineHeight: 0.6,
                transform: `scale(${quoteMarkScale})`, transformOrigin: 'top left',
                marginBottom: 'clamp(4px, 0.8vw, 8px)',
                userSelect: 'none',
              }}>{'\u201C'}</div>

              {/* Quote text - line by line */}
              <div style={{
                fontSize: 'clamp(15px, 2.8vw, 24px)', fontWeight: 400,
                fontStyle: 'italic', color: textColor,
                lineHeight: 1.65, letterSpacing: '-0.01em',
              }}>
                {lines.map((line, i) => {
                  const lineProgress = Math.max(0, Math.min(1, (lineReveal * lines.length - i)))
                  return (
                    <div key={i} style={{
                      opacity: easeOutCubic(lineProgress),
                      transform: `translateX(${(1 - lineProgress) * 10}px)`,
                      marginBottom: i < lines.length - 1 ? 'clamp(6px, 1.2vw, 12px)' : 0,
                    }}>{line}</div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Author byline */}
          <div style={{
            marginTop: 'clamp(18px, 3.5vw, 30px)',
            paddingLeft: 'clamp(15px, 2.7vw, 24px)',
            opacity: authorOpacity,
            transform: `translateY(${authorY}px)`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.4vw, 14px)',
            }}>
              {/* Author avatar */}
              <div style={{
                width: 'clamp(28px, 4.5vw, 36px)', height: 'clamp(28px, 4.5vw, 36px)',
                borderRadius: '50%', background: `${accentColor}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(12px, 1.8vw, 15px)', fontWeight: 600, color: accentColor,
                fontFamily: "'-apple-system', sans-serif",
              }}>{authorName.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{
                  fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700,
                  fontFamily: "'-apple-system', 'Helvetica Neue', sans-serif",
                  color: textColor,
                }}>{authorName}</div>
                <div style={{
                  fontSize: 'clamp(9px, 1.3vw, 11px)',
                  fontFamily: "'-apple-system', 'Helvetica Neue', sans-serif",
                  color: `${textColor}50`, marginTop: 1,
                  opacity: metaOpacity,
                }}>{publishDate} {'\u2022'} {subscriberCount} subscribers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: like and comment bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'clamp(8px, 1.5vw, 14px) clamp(18px, 3.5vw, 30px)',
          borderTop: `1px solid ${textColor}08`,
          opacity: metaOpacity,
        }}>
          <div style={{ display: 'flex', gap: 'clamp(16px, 3vw, 28px)' }}>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              fontFamily: "'-apple-system', sans-serif",
              color: `${textColor}50`, fontWeight: 500,
            }}>{'\u2764\uFE0F'} Like</span>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              fontFamily: "'-apple-system', sans-serif",
              color: `${textColor}50`, fontWeight: 500,
            }}>{'\uD83D\uDCAC'} Comment</span>
          </div>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)',
            fontFamily: "'-apple-system', sans-serif",
            color: `${textColor}50`, fontWeight: 500,
          }}>Share</span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-substack-quote',
  title: 'Substack Newsletter Quote',
  description: 'Substack newsletter pull quote with accent bar, author byline, publication name, subscribe button, and editorial serif typography',
  tags: ['scene', 'substack', 'newsletter', 'quote', 'writing', 'editorial', 'publishing'],
  category: 'scene-layout',
  component: SceneSubstackQuoteComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    quoteText: 'The most dangerous stories are the ones we tell ourselves about ourselves.\nThey shape our identity without our permission.\nQuestion them relentlessly.',
    authorName: 'Emma Thornton',
    publicationName: 'The Examined Life',
    publishDate: 'Mar 15, 2026',
    subscriberCount: '42K',
    bgColor: '#FAFAF8',
    cardColor: '#FFFFFF',
    accentColor: '#FF6719',
    textColor: '#1A1A1A',
    quoteColor: '#FF671930',
  },
  configSchema: [
    { key: 'quoteText', label: 'Quote Text', type: 'text', defaultValue: 'The most dangerous stories are the ones we tell ourselves about ourselves.\nThey shape our identity without our permission.\nQuestion them relentlessly.', group: 'Content' },
    { key: 'authorName', label: 'Author Name', type: 'text', defaultValue: 'Emma Thornton', group: 'Content' },
    { key: 'publicationName', label: 'Publication Name', type: 'text', defaultValue: 'The Examined Life', group: 'Content' },
    { key: 'publishDate', label: 'Publish Date', type: 'text', defaultValue: 'Mar 15, 2026', group: 'Content' },
    { key: 'subscriberCount', label: 'Subscriber Count', type: 'text', defaultValue: '42K', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAF8', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF6719', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
    { key: 'quoteColor', label: 'Quote Mark Color', type: 'color', defaultValue: '#FF671930', group: 'Style' },
  ],
})
