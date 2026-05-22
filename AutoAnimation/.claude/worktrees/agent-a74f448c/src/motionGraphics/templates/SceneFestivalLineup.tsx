import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFestivalLineupConfig {
  festivalName: string
  date: string
  headliner1: string
  headliner2: string
  midTier1: string
  midTier2: string
  midTier3: string
  opener1: string
  opener2: string
  opener3: string
  opener4: string
  bgColor: string
  textColor: string
  accentColor: string
  accentColor2: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }

function SceneFestivalLineupComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneFestivalLineupConfig>) {
  const { festivalName, date, headliner1, headliner2, midTier1, midTier2, midTier3, opener1, opener2, opener3, opener4, bgColor, textColor, accentColor, accentColor2 } = config
  const time = frame / fps

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Festival name slams in
  const nameScale = easeOutExpo(Math.max(0, Math.min(1, enterProgress / 0.35)))
  const nameOp = easeOutCubic(Math.min(1, enterProgress / 0.2))

  // Date fades in
  const dateOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))

  // Headliners appear
  const headOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.25)))
  const headX = (1 - headOp) * 30

  // Mid-tier
  const midOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // Openers
  const openOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))

  // Background pulse
  const pulse = 0.5 + 0.5 * Math.sin(time * 2)

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Impact', 'Arial Black', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Gradient background */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${bgColor} 0%, ${accentColor}15 50%, ${accentColor2}10 100%)` }} />

      {/* Subtle rays */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', width: '200%', height: '60%',
        background: `conic-gradient(from 0deg at 50% 100%, transparent 0deg, ${accentColor}06 10deg, transparent 20deg, ${accentColor2}04 30deg, transparent 40deg)`,
        transform: `translateX(-50%) rotate(${time * 3}deg)`, opacity: pulse * 0.6,
      }} />

      {/* Poster content */}
      <div style={{ position: 'relative', width: '88%', maxWidth: 560, textAlign: 'center', transform: `scale(${exitScale})`, opacity: exitOpacity }}>
        {/* Decorative top line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px, 1.5vw, 14px)', marginBottom: 'clamp(6px, 1.2vw, 10px)', opacity: dateOp }}>
          <div style={{ width: 'clamp(30px, 7vw, 60px)', height: 1, background: `${textColor}30` }} />
          <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', color: accentColor, letterSpacing: '0.3em', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
            {date}
          </div>
          <div style={{ width: 'clamp(30px, 7vw, 60px)', height: 1, background: `${textColor}30` }} />
        </div>

        {/* Festival name */}
        <div style={{
          fontSize: 'clamp(32px, 9vw, 80px)', fontWeight: 900, color: textColor, textTransform: 'uppercase',
          lineHeight: 0.95, letterSpacing: '-0.02em', opacity: nameOp,
          transform: `scale(${2 - nameScale})`, marginBottom: 'clamp(6px, 1.2vw, 12px)',
          textShadow: `0 0 30px ${accentColor}40, 2px 2px 0 ${accentColor}30`,
        }}>
          {festivalName}
        </div>

        {/* Gradient divider */}
        <div style={{ width: '80%', height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}, ${accentColor2}, transparent)`, margin: '0 auto', marginBottom: 'clamp(14px, 3vw, 24px)', opacity: headOp }} />

        {/* Headliners */}
        <div style={{ marginBottom: 'clamp(10px, 2vw, 18px)', opacity: headOp, transform: `translateX(${headX}px)` }}>
          <div style={{ fontSize: 'clamp(22px, 5.5vw, 44px)', fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>
            {headliner1}
          </div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 40px)', fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2, opacity: 0.9 }}>
            {headliner2}
          </div>
        </div>

        {/* Mid-tier */}
        <div style={{ marginBottom: 'clamp(8px, 1.5vw, 14px)', opacity: midOp }}>
          <div style={{ fontSize: 'clamp(14px, 3vw, 24px)', fontWeight: 700, color: `${textColor}CC`, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.6 }}>
            {midTier1} {'\u00B7'} {midTier2} {'\u00B7'} {midTier3}
          </div>
        </div>

        {/* Openers */}
        <div style={{ opacity: openOp }}>
          <div style={{ fontSize: 'clamp(10px, 2vw, 16px)', fontWeight: 600, color: `${textColor}80`, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.8 }}>
            {opener1} {'\u00B7'} {opener2} {'\u00B7'} {opener3} {'\u00B7'} {opener4}
          </div>
        </div>

        {/* Bottom stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(4px, 0.8vw, 8px)', marginTop: 'clamp(14px, 3vw, 24px)', opacity: openOp * 0.5, color: accentColor, fontSize: 'clamp(8px, 1.5vw, 12px)' }}>
          {'\u2605'} {'\u2605'} {'\u2605'}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-festival-lineup',
  title: 'Scene Festival Lineup',
  description: 'Music festival lineup poster with headliners, mid-tier, and opener tiers. Bold typography with gradient backgrounds and staggered reveals.',
  tags: ['scene', 'music', 'festival', 'lineup', 'poster', 'concert', 'headliner', 'event'],
  category: 'scene-layout',
  component: SceneFestivalLineupComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    festivalName: 'AURORA FEST',
    date: 'JULY 15-17, 2026',
    headliner1: 'ARCTIC MONKEYS',
    headliner2: 'TAME IMPALA',
    midTier1: 'BEACH HOUSE',
    midTier2: 'KHRUANGBIN',
    midTier3: 'JAPANESE BREAKFAST',
    opener1: 'ALVVAYS',
    opener2: 'TURNSTILE',
    opener3: 'WET LEG',
    opener4: 'BARTEES STRANGE',
    bgColor: '#08040C',
    textColor: '#F5F0FF',
    accentColor: '#FF6B35',
    accentColor2: '#FFD166',
  },
  configSchema: [
    { key: 'festivalName', label: 'Festival Name', type: 'text', defaultValue: 'AURORA FEST', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'JULY 15-17, 2026', group: 'Content' },
    { key: 'headliner1', label: 'Headliner 1', type: 'text', defaultValue: 'ARCTIC MONKEYS', group: 'Lineup' },
    { key: 'headliner2', label: 'Headliner 2', type: 'text', defaultValue: 'TAME IMPALA', group: 'Lineup' },
    { key: 'midTier1', label: 'Mid-Tier 1', type: 'text', defaultValue: 'BEACH HOUSE', group: 'Lineup' },
    { key: 'midTier2', label: 'Mid-Tier 2', type: 'text', defaultValue: 'KHRUANGBIN', group: 'Lineup' },
    { key: 'midTier3', label: 'Mid-Tier 3', type: 'text', defaultValue: 'JAPANESE BREAKFAST', group: 'Lineup' },
    { key: 'opener1', label: 'Opener 1', type: 'text', defaultValue: 'ALVVAYS', group: 'Lineup' },
    { key: 'opener2', label: 'Opener 2', type: 'text', defaultValue: 'TURNSTILE', group: 'Lineup' },
    { key: 'opener3', label: 'Opener 3', type: 'text', defaultValue: 'WET LEG', group: 'Lineup' },
    { key: 'opener4', label: 'Opener 4', type: 'text', defaultValue: 'BARTEES STRANGE', group: 'Lineup' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08040C', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F5F0FF', group: 'Style' },
    { key: 'accentColor', label: 'Accent 1', type: 'color', defaultValue: '#FF6B35', group: 'Style' },
    { key: 'accentColor2', label: 'Accent 2', type: 'color', defaultValue: '#FFD166', group: 'Style' },
  ],
})
