import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePodcastEpisodeConfig {
  showName: string
  episodeTitle: string
  episodeNumber: number
  duration: string
  guestName: string
  accentColor: string
  bgColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePodcastEpisodeComponent({ config, progress }: MotionGraphicProps<ScenePodcastEpisodeConfig>) {
  const { showName, episodeTitle, episodeNumber, duration, guestName, accentColor, bgColor, cardColor, textColor } = config

  // Phases: enter 0-0.3, hold 0.3-0.8, exit 0.8-1
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card slides in from right with shadow
  const cardSlide = easeOutBack(Math.min(1, enterProgress / 0.7))
  const cardX = (1 - cardSlide) * 120

  // Show name fades in from top
  const showNameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))
  const showNameY = (1 - showNameOpacity) * -15

  // Episode number badge pops
  const badgeScale = enterProgress < 0.3 ? 0 : easeOutBack(Math.min(1, (enterProgress - 0.3) / 0.4))

  // Episode title types in
  const titleOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.35)))
  const titleX = (1 - titleOpacity) * 20

  // Duration + guest slide in
  const detailsOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.35)))
  const detailsY = (1 - detailsOpacity) * 15

  // Hold: subtle float
  const floatY = Math.sin(holdProgress * Math.PI * 2.5) * 3

  // Exit: slide down and fade
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * 120
  const exitOpacity = 1 - exitEased

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Subtle background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 80% 20%, ${accentColor}10 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${accentColor}08 0%, transparent 40%)`,
        pointerEvents: 'none',
      }} />

      {/* Main card */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: `translate(-50%, calc(-50% + ${floatY + exitY}px)) translateX(${cardX}px)`,
        opacity: exitOpacity,
        width: '85%', maxWidth: 520,
      }}>
        <div style={{
          background: cardColor,
          borderRadius: 'clamp(14px, 3vw, 24px)',
          padding: 'clamp(20px, 4vw, 36px)',
          boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}20, 0 0 60px ${accentColor}08`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Accent line at top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 'clamp(3px, 0.6vw, 5px)',
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
          }} />

          {/* Show name */}
          <div style={{
            fontSize: 'clamp(10px, 2vw, 14px)',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: showNameOpacity,
            transform: `translateY(${showNameY}px)`,
            marginBottom: 'clamp(10px, 2vw, 18px)',
          }}>
            {showName}
          </div>

          {/* Episode number badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'clamp(4px, 0.8vw, 8px)',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
            transform: `scale(${badgeScale})`,
          }}>
            <div style={{
              background: accentColor,
              borderRadius: 'clamp(6px, 1.2vw, 10px)',
              padding: 'clamp(3px, 0.6vw, 6px) clamp(8px, 1.6vw, 14px)',
              fontSize: 'clamp(9px, 1.6vw, 13px)',
              fontWeight: 800,
              color: bgColor,
              letterSpacing: '0.05em',
            }}>
              EP {episodeNumber}
            </div>
            <div style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              fontWeight: 500,
              color: `${textColor}70`,
            }}>
              {duration}
            </div>
          </div>

          {/* Episode title */}
          <div style={{
            fontSize: 'clamp(18px, 4vw, 32px)',
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.2,
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
            marginBottom: 'clamp(12px, 2.5vw, 22px)',
          }}>
            {episodeTitle}
          </div>

          {/* Guest name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 10px)',
            opacity: detailsOpacity,
            transform: `translateY(${detailsY}px)`,
          }}>
            {/* Guest avatar placeholder */}
            <div style={{
              width: 'clamp(28px, 5.5vw, 40px)',
              height: 'clamp(28px, 5.5vw, 40px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}60, ${accentColor}30)`,
              border: `2px solid ${accentColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(12px, 2.4vw, 18px)',
            }}>
              {guestName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{
                fontSize: 'clamp(8px, 1.3vw, 11px)',
                fontWeight: 500,
                color: `${textColor}60`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Featuring
              </div>
              <div style={{
                fontSize: 'clamp(12px, 2.2vw, 18px)',
                fontWeight: 600,
                color: textColor,
              }}>
                {guestName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-podcast-episode',
  title: 'Podcast Episode Card',
  description: 'Episode card with show name, episode title, number, duration, and guest name. Dark theme with accent. Card slides in with shadow.',
  tags: ['scene', 'podcast', 'episode', 'audio', 'card', 'show'],
  category: 'scene-layout',
  component: ScenePodcastEpisodeComponent as any,
  defaultConfig: {
    showName: 'The Creative Hour',
    episodeTitle: 'Building Products That People Love',
    episodeNumber: 42,
    duration: '45 min',
    guestName: 'Sarah Chen',
    accentColor: '#8B5CF6',
    bgColor: '#0C0A15',
    cardColor: '#1A1625',
    textColor: '#F1F0F5',
  },
  configSchema: [
    { key: 'showName', label: 'Show Name', type: 'text', defaultValue: 'The Creative Hour', group: 'Content' },
    { key: 'episodeTitle', label: 'Episode Title', type: 'text', defaultValue: 'Building Products That People Love', group: 'Content' },
    { key: 'episodeNumber', label: 'Episode Number', type: 'number', defaultValue: 42, min: 1, max: 9999, group: 'Content' },
    { key: 'duration', label: 'Duration', type: 'text', defaultValue: '45 min', group: 'Content' },
    { key: 'guestName', label: 'Guest Name', type: 'text', defaultValue: 'Sarah Chen', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0A15', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1625', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F1F0F5', group: 'Style' },
  ],
})
