import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CreditEntry {
  role: string
  name: string
}

interface SceneFilmCreditsRollConfig {
  credits: string // "Role: Name" lines separated by newlines
  bgColor: string
  nameColor: string
  roleColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function parseCredits(raw: string): CreditEntry[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        return { role: line.slice(0, colonIndex).trim(), name: line.slice(colonIndex + 1).trim() }
      }
      return { role: '', name: line }
    })
}

function SceneFilmCreditsRollComponent({
  config,
  progress,
  height,
}: MotionGraphicProps<SceneFilmCreditsRollConfig>) {
  const { credits, bgColor, nameColor, roleColor } = config

  const entries = parseCredits(credits)
  const entryCount = entries.length
  if (entryCount === 0) return <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

  // Phase calculations
  const enterProgress = progress < 0.1 ? progress / 0.1 : 1
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  // Overall fade
  const opacity =
    enterProgress < 1
      ? easeOutCubic(enterProgress)
      : exitProgress > 0
        ? 1 - easeInCubic(exitProgress)
        : 1

  // Scroll: credits start below screen and scroll up
  // Total scrollable distance = screen height + all credits height
  const entryHeight = 80 // approximate px per credit entry
  const totalContentHeight = entryCount * entryHeight
  const scrollDistance = height + totalContentHeight

  // Scroll speed increases on exit
  const scrollMultiplier = exitProgress > 0 ? 1 + exitProgress * 2 : 1
  const scrollProgress = Math.min(1, progress * scrollMultiplier)
  const scrollOffset = height - scrollProgress * scrollDistance

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Credits container */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: scrollOffset,
          transform: 'translateX(-50%)',
          opacity,
          width: '80%',
          maxWidth: '600px',
        }}
      >
        {entries.map((entry, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              marginBottom: '36px',
            }}
          >
            {entry.role && (
              <div
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(12px, 2.5vw, 20px)',
                  fontWeight: 400,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: roleColor,
                  marginBottom: '6px',
                }}
              >
                {entry.role}
              </div>
            )}
            <div
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(18px, 4vw, 36px)',
                fontWeight: 300,
                letterSpacing: '0.08em',
                color: nameColor,
              }}
            >
              {entry.name}
            </div>
          </div>
        ))}
      </div>

      {/* Top fade gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '15%',
          background: `linear-gradient(to bottom, ${bgColor}, transparent)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Bottom fade gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '15%',
          background: `linear-gradient(to top, ${bgColor}, transparent)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-film-credits-roll',
  title: 'Scene Film Credits Roll',
  description:
    'End-of-movie scrolling credits with role/name pairs rolling upward — fades at edges and speeds up on exit',
  tags: ['scene', 'credits', 'roll', 'film', 'movie', 'end', 'scroll'],
  category: 'scene-layout',
  component: SceneFilmCreditsRollComponent as any,
  defaultConfig: {
    credits:
      'Director: John Smith\nProducer: Jane Doe\nCinematography: Alex Chen\nMusic: Sarah Kim\nEditor: Mike Johnson\nSound Design: Lisa Park\nCostume Design: Tom Brown\nSpecial Thanks: The Audience',
    bgColor: '#000000',
    nameColor: '#FFFFFF',
    roleColor: '#888888',
  },
  configSchema: [
    {
      key: 'credits',
      label: 'Credits (Role: Name, one per line)',
      type: 'text',
      defaultValue:
        'Director: John Smith\nProducer: Jane Doe\nCinematography: Alex Chen\nMusic: Sarah Kim',
      group: 'Content',
    },
    {
      key: 'bgColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#000000',
      group: 'Style',
    },
    {
      key: 'nameColor',
      label: 'Name Color',
      type: 'color',
      defaultValue: '#FFFFFF',
      group: 'Style',
    },
    {
      key: 'roleColor',
      label: 'Role Color',
      type: 'color',
      defaultValue: '#888888',
      group: 'Style',
    },
  ],
})
