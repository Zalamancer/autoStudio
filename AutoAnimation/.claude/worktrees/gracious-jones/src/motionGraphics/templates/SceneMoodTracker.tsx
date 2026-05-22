import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMoodTrackerConfig {
  title: string
  moods: string[]
  selectedMood: number
  note: string
  bgColor: string
  textColor: string
  accentColor: string
}

const MOOD_DATA = [
  { emoji: '\u{1F614}', label: 'Awful', color: '#ef4444' },
  { emoji: '\u{1F61E}', label: 'Bad', color: '#f97316' },
  { emoji: '\u{1F610}', label: 'Meh', color: '#eab308' },
  { emoji: '\u{1F642}', label: 'Good', color: '#84cc16' },
  { emoji: '\u{1F60A}', label: 'Great', color: '#22c55e' },
]

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneMoodTrackerComponent({ config, progress }: MotionGraphicProps<SceneMoodTrackerConfig>) {
  const { title, selectedMood, note, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const noteEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))

  const isHolding = progress >= 0.2 && progress < 0.8
  const selectedMoodData = MOOD_DATA[Math.min(4, Math.max(0, selectedMood))]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Mood-based ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: '60%',
          height: '40%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${selectedMoodData.color}08 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 600,
            color: `${textColor}55`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
            opacity: titleEnter,
          }}
        >
          {title}
        </div>

        {/* Selected mood large emoji */}
        <div
          style={{
            fontSize: 'clamp(48px, 12vw, 80px)',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: titleEnter,
            transform: `scale(${isHolding ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.05 : titleEnter})`,
          }}
        >
          {selectedMoodData.emoji}
        </div>

        {/* Selected mood label */}
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 36px)',
            fontWeight: 700,
            color: selectedMoodData.color,
            marginBottom: 'clamp(20px, 4vw, 40px)',
            opacity: titleEnter,
          }}
        >
          {selectedMoodData.label}
        </div>

        {/* Mood selector row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 2vw, 20px)',
            marginBottom: 'clamp(24px, 5vw, 44px)',
          }}
        >
          {MOOD_DATA.map((mood, i) => {
            const delay = 0.2 + i * 0.08
            const itemEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
            const isSelected = i === selectedMood
            const bounceScale = isSelected && isHolding
              ? 1.1 + Math.sin(holdProgress * Math.PI * 6) * 0.05
              : isSelected ? 1.1 : 1

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(4px, 0.6vw, 6px)',
                  opacity: itemEnter,
                  transform: `scale(${itemEnter * bounceScale})`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(36px, 8vw, 56px)',
                    height: 'clamp(36px, 8vw, 56px)',
                    borderRadius: '50%',
                    background: isSelected ? `${mood.color}20` : `${textColor}08`,
                    border: isSelected ? `2px solid ${mood.color}` : `1px solid ${textColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(16px, 3.5vw, 26px)',
                    boxShadow: isSelected ? `0 0 12px ${mood.color}30` : 'none',
                  }}
                >
                  {mood.emoji}
                </div>

                {/* Dot indicator */}
                {isSelected && (
                  <div
                    style={{
                      width: 'clamp(4px, 0.7vw, 6px)',
                      height: 'clamp(4px, 0.7vw, 6px)',
                      borderRadius: '50%',
                      background: mood.color,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Note */}
        {note && (
          <div
            style={{
              background: `${textColor}06`,
              border: `1px solid ${textColor}10`,
              borderRadius: 'clamp(8px, 1.5vw, 14px)',
              padding: 'clamp(12px, 2.5vw, 22px)',
              maxWidth: 380,
              width: '85%',
              opacity: noteEnter,
              transform: `translateY(${(1 - noteEnter) * 12}px)`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(9px, 1.2vw, 11px)',
                fontWeight: 600,
                color: `${textColor}44`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 'clamp(4px, 0.6vw, 6px)',
              }}
            >
              Note
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 2vw, 16px)',
                fontWeight: 400,
                color: `${textColor}bb`,
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              {note}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-mood-tracker',
  title: 'Mood Tracker',
  description: 'Daily mood tracker with emoji faces, selectable moods, ambient color glow, and personal note card',
  tags: ['scene', 'mood', 'tracker', 'meditation', 'mindfulness', 'wellness', 'mental-health', 'daily'],
  category: 'scene-layout',
  component: SceneMoodTrackerComponent as any,
  defaultConfig: {
    title: "How are you feeling today?",
    moods: ['Awful', 'Bad', 'Meh', 'Good', 'Great'],
    selectedMood: 3,
    note: 'Feeling calm after my morning meditation session.',
    bgColor: '#0c0e12',
    textColor: '#e4e4e8',
    accentColor: '#84cc16',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'How are you feeling today?', group: 'Content' },
    { key: 'selectedMood', label: 'Selected Mood (0-4)', type: 'number', defaultValue: 3, min: 0, max: 4, group: 'Content' },
    { key: 'note', label: 'Note', type: 'text', defaultValue: 'Feeling calm after my morning meditation session.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0e12', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e4e4e8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#84cc16', group: 'Style' },
  ],
})
