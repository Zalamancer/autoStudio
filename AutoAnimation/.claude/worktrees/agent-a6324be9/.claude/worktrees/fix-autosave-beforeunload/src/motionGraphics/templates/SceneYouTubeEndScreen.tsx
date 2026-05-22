import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface YouTubeEndScreenConfig {
  channelName: string
  video1Title: string
  video2Title: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneYouTubeEndScreenComponent({
  config,
  progress,
}: MotionGraphicProps<YouTubeEndScreenConfig>) {
  const { channelName, video1Title, video2Title, bgColor, cardColor, accentColor, textColor } = config

  const enterEnd = 0.25
  const holdEnd = 0.82
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd
    ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Channel name pops in first
  const channelEnter = easeOutBack(Math.min(1, enterProgress / 0.4))
  const channelScale = channelEnter
  const channelOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Video card 1 pops in (stagger 1)
  const card1Delay = 0.3
  const card1Enter = Math.max(0, Math.min(1, (enterProgress - card1Delay) / (1 - card1Delay)))
  const card1Scale = easeOutBack(card1Enter)
  const card1Opacity = easeOutCubic(card1Enter)

  // Video card 2 pops in (stagger 2)
  const card2Delay = 0.5
  const card2Enter = Math.max(0, Math.min(1, (enterProgress - card2Delay) / (1 - card2Delay)))
  const card2Scale = easeOutBack(card2Enter)
  const card2Opacity = easeOutCubic(card2Enter)

  // Subscribe button pops in last
  const subDelay = 0.65
  const subEnter = Math.max(0, Math.min(1, (enterProgress - subDelay) / (1 - subDelay)))
  const subScale = easeOutBack(subEnter)
  const subOpacity = easeOutCubic(subEnter)

  // Hold: subscribe button subtle pulse
  const subPulse = holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04 : 1

  // Exit: everything scales down and fades
  const exitEased = easeInCubic(exitProgress)
  const exitScale = 1 - exitEased * 0.15
  const exitOpacity = 1 - exitEased

  // Video thumbnail placeholder play icon
  const renderVideoCard = (title: string, scale: number, opacity: number, index: number) => (
    <div
      style={{
        background: cardColor,
        borderRadius: 'clamp(8px, 1.5vw, 14px)',
        overflow: 'hidden',
        transform: `scale(${scale * exitScale})`,
        opacity: opacity * exitOpacity,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        width: '100%',
      }}
    >
      {/* Thumbnail placeholder */}
      <div
        style={{
          width: '100%',
          paddingTop: '56.25%',
          background: `linear-gradient(135deg, ${cardColor}, ${bgColor})`,
          position: 'relative',
        }}
      >
        {/* Play icon */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(28px, 5vw, 44px)',
            height: 'clamp(28px, 5vw, 44px)',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: 'clamp(5px, 0.8vw, 8px) 0 clamp(5px, 0.8vw, 8px) clamp(8px, 1.4vw, 14px)',
              borderColor: 'transparent transparent transparent #FFFFFF',
              marginLeft: 'clamp(2px, 0.3vw, 3px)',
            }}
          />
        </div>

        {/* Duration badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            background: 'rgba(0,0,0,0.8)',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: 'clamp(8px, 1vw, 11px)',
            fontWeight: 600,
            color: '#FFFFFF',
          }}
        >
          {index === 0 ? '12:34' : '8:15'}
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          padding: 'clamp(6px, 1vw, 12px) clamp(8px, 1.4vw, 14px)',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(9px, 1.4vw, 13px)',
            fontWeight: 600,
            color: textColor,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
      </div>
    </div>
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          gap: 'clamp(14px, 2.5vw, 28px)',
        }}
      >
        {/* Channel name */}
        <div
          style={{
            transform: `scale(${channelScale * exitScale})`,
            opacity: channelOpacity * exitOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.4vw, 14px)',
          }}
        >
          {/* Channel avatar placeholder */}
          <div
            style={{
              width: 'clamp(28px, 5vw, 44px)',
              height: 'clamp(28px, 5vw, 44px)',
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(12px, 2vw, 20px)',
              fontWeight: 800,
              color: textColor,
            }}
          >
            {channelName.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 'clamp(14px, 2.5vw, 22px)',
              fontWeight: 700,
              color: textColor,
            }}
          >
            {channelName}
          </div>
        </div>

        {/* Video thumbnails row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(10px, 2vw, 20px)',
            width: '100%',
            maxWidth: 520,
          }}
        >
          {renderVideoCard(video1Title, card1Scale, card1Opacity, 0)}
          {renderVideoCard(video2Title, card2Scale, card2Opacity, 1)}
        </div>

        {/* Subscribe button */}
        <div
          style={{
            transform: `scale(${subScale * subPulse * exitScale})`,
            opacity: subOpacity * exitOpacity,
          }}
        >
          <div
            style={{
              background: accentColor,
              padding: 'clamp(8px, 1.4vw, 14px) clamp(20px, 4vw, 40px)',
              borderRadius: 'clamp(4px, 0.8vw, 8px)',
              fontSize: 'clamp(11px, 1.8vw, 16px)',
              fontWeight: 700,
              color: textColor,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: `0 4px 16px ${accentColor}44`,
            }}
          >
            SUBSCRIBE
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-youtube-end-screen',
  title: 'YouTube End Screen',
  description: 'YouTube-style end screen with two video thumbnail placeholders, channel name with avatar, and subscribe button with staggered pop-in',
  tags: ['scene', 'youtube', 'end-screen', 'subscribe', 'channel', 'media', 'social'],
  category: 'scene-layout',
  component: SceneYouTubeEndScreenComponent as any,
  defaultConfig: {
    channelName: 'Creative Studio',
    video1Title: '10 Tips for Better Video Editing',
    video2Title: 'How I Grew to 100K Subscribers',
    bgColor: '#0f0f0f',
    cardColor: '#272727',
    accentColor: '#FF0000',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'channelName', label: 'Channel Name', type: 'text', defaultValue: 'Creative Studio', group: 'Content' },
    { key: 'video1Title', label: 'Video 1 Title', type: 'text', defaultValue: '10 Tips for Better Video Editing', group: 'Content' },
    { key: 'video2Title', label: 'Video 2 Title', type: 'text', defaultValue: 'How I Grew to 100K Subscribers', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f0f', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#272727', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF0000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
