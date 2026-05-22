import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ArchitectProfileConfig {
  name: string
  title: string
  firm: string
  projects: number
  awards: number
  yearsExperience: number
  specialties: string[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneArchitectProfileComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ArchitectProfileConfig>) {
  const { name, title: jobTitle, firm, projects, awards, yearsExperience, specialties, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.28
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Avatar scales in
  const avatarProgress = elasticOut(Math.min(1, enterProgress / 0.4))
  // Name/title
  const nameProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  // Stats
  const getStatProgress = (idx: number) => {
    const delay = 0.4 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
  }
  // Specialties
  const specProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: stat counter animation
  const countProgress = easeOutCubic(Math.min(1, holdProgress / 0.3))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const stats = [
    { label: 'PROJECTS', value: projects, icon: '🏗️' },
    { label: 'AWARDS', value: awards, icon: '🏆' },
    { label: 'YEARS', value: yearsExperience, icon: '📐' },
  ]

  // Generate initials from name
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(18px, 2.5vw, 28px)',
          padding: 'clamp(24px, 5%, 40px)',
          maxWidth: 380,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 22px)',
          opacity: exitOpacity,
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 'clamp(64px, 14vw, 100px)',
            height: 'clamp(64px, 14vw, 100px)',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontWeight: 800,
            color: '#FFFFFF',
            transform: `scale(${avatarProgress})`,
            boxShadow: `0 4px 20px ${accentColor}30`,
          }}
        >
          {initials}
        </div>

        {/* Name and title */}
        <div
          style={{
            textAlign: 'center',
            opacity: nameProgress,
            transform: `translateY(${(1 - nameProgress) * 10}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, color: textColor }}>
            {name}
          </div>
          <div style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', fontWeight: 600, color: accentColor, marginTop: 3 }}>
            {jobTitle}
          </div>
          <div style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 500, color: `${textColor}50`, marginTop: 2 }}>
            {firm}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(10px, 2.5vw, 24px)',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {stats.map((stat, i) => {
            const p = getStatProgress(i)
            return (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  padding: 'clamp(8px, 1.5vh, 14px)',
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  background: `${textColor}05`,
                  flex: 1,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 12}px)`,
                }}
              >
                <div style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', marginBottom: 2 }}>{stat.icon}</div>
                <div style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 900, color: accentColor, lineHeight: 1 }}>
                  {Math.round(stat.value * p * countProgress)}
                </div>
                <div style={{ fontSize: 'clamp(7px, 1vw, 9px)', fontWeight: 700, color: `${textColor}45`, letterSpacing: 1.5, marginTop: 3 }}>
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Specialties */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(4px, 0.8vw, 8px)',
            justifyContent: 'center',
            opacity: specProgress,
            transform: `translateY(${(1 - specProgress) * 8}px)`,
          }}
        >
          {specialties.map((spec, i) => (
            <div
              key={i}
              style={{
                padding: 'clamp(4px, 0.7vh, 6px) clamp(10px, 1.8vw, 14px)',
                borderRadius: 20,
                border: `1px solid ${accentColor}25`,
                fontSize: 'clamp(9px, 1.3vw, 11px)',
                fontWeight: 600,
                color: accentColor,
              }}
            >
              {spec}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-architect-profile',
  title: 'Scene Architect Profile',
  description: 'Architect/designer profile card with initials avatar, stat counters, specialty tags, and elastic entrance animations',
  tags: ['scene', 'architect', 'profile', 'designer', 'architecture', 'portfolio', 'professional'],
  category: 'scene-layout',
  component: SceneArchitectProfileComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'name', label: 'Name', type: 'text', defaultValue: 'Zaha Hadid', group: 'Content' },
    { key: 'title', label: 'Job Title', type: 'text', defaultValue: 'Principal Architect', group: 'Content' },
    { key: 'firm', label: 'Firm', type: 'text', defaultValue: 'Hadid Associates', group: 'Content' },
    { key: 'projects', label: 'Projects', type: 'number', defaultValue: 143, min: 0, max: 9999, group: 'Content' },
    { key: 'awards', label: 'Awards', type: 'number', defaultValue: 28, min: 0, max: 999, group: 'Content' },
    { key: 'yearsExperience', label: 'Years Experience', type: 'number', defaultValue: 35, min: 0, max: 99, group: 'Content' },
    { key: 'specialties', label: 'Specialties', type: 'text-array', defaultValue: ['Parametric Design', 'Cultural Spaces', 'Mixed-Use', 'Sustainable'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#1E3A5F', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F4F8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    name: 'Zaha Hadid',
    title: 'Principal Architect',
    firm: 'Hadid Associates',
    projects: 143,
    awards: 28,
    yearsExperience: 35,
    specialties: ['Parametric Design', 'Cultural Spaces', 'Mixed-Use', 'Sustainable'],
    accentColor: '#1E3A5F',
    cardColor: '#FFFFFF',
    bgColor: '#F0F4F8',
    textColor: '#1E293B',
  },
})
