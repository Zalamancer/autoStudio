import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneChapterTitleConfig {
  chapterNumber: string
  chapterTitle: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneChapterTitleComponent({
  config,
  progress,
}: MotionGraphicProps<SceneChapterTitleConfig>) {
  const { chapterNumber, chapterTitle, bgColor, textColor, accentColor } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress =
    progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Chapter number — fades in first
  const numberOpacity =
    enterProgress < 1
      ? easeOutCubic(enterProgress)
      : exitProgress > 0
        ? 1 - easeInCubic(exitProgress)
        : 1

  // Divider line draws in from center
  const lineDelay = 0.3
  const lineEnter =
    enterProgress < 1 ? Math.max(0, (enterProgress - lineDelay) / (1 - lineDelay)) : 1
  const lineWidth =
    lineEnter < 1
      ? easeOutCubic(lineEnter) * 100
      : exitProgress > 0
        ? 100 * (1 - easeInCubic(exitProgress))
        : 100

  // Chapter title — slides up and fades in with delay
  const titleDelay = 0.45
  const titleEnter =
    enterProgress < 1 ? Math.max(0, (enterProgress - titleDelay) / (1 - titleDelay)) : 1
  const titleOpacity =
    titleEnter < 1
      ? easeOutCubic(titleEnter)
      : exitProgress > 0
        ? 1 - easeInCubic(exitProgress)
        : 1
  const titleY =
    titleEnter < 1
      ? 25 * (1 - easeOutCubic(titleEnter))
      : exitProgress > 0
        ? -15 * easeInCubic(exitProgress)
        : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Content container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10%',
        }}
      >
        {/* Chapter number — large display */}
        <div
          style={{
            opacity: numberOpacity,
            fontFamily: "'Garamond', 'Georgia', serif",
            fontSize: 'clamp(48px, 12vw, 140px)',
            fontWeight: 300,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: textColor,
            marginBottom: '0.3em',
          }}
        >
          {chapterNumber}
        </div>

        {/* Thin divider line */}
        <div
          style={{
            width: `${lineWidth}%`,
            maxWidth: '180px',
            height: '1px',
            background: accentColor,
            marginBottom: '0.8em',
            opacity: lineWidth > 0 ? 1 : 0,
          }}
        />

        {/* Chapter title — serif, elegant */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontFamily: "'Garamond', 'Georgia', serif",
            fontSize: 'clamp(18px, 4vw, 44px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: '0.08em',
            color: textColor,
            textAlign: 'center',
          }}
        >
          {chapterTitle}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-chapter-title',
  title: 'Scene Chapter Title',
  description:
    'Book/series chapter card with large chapter number, thin divider line, and elegant italic title — staggered fade-in reveal',
  tags: ['scene', 'chapter', 'title', 'book', 'series', 'elegant', 'cinematic'],
  category: 'scene-layout',
  component: SceneChapterTitleComponent as any,
  defaultConfig: {
    chapterNumber: 'Chapter I',
    chapterTitle: 'The Beginning',
    bgColor: '#0d0d0d',
    textColor: '#E8E0D0',
    accentColor: '#8B7355',
  },
  configSchema: [
    {
      key: 'chapterNumber',
      label: 'Chapter Number',
      type: 'text',
      defaultValue: 'Chapter I',
      group: 'Content',
    },
    {
      key: 'chapterTitle',
      label: 'Chapter Title',
      type: 'text',
      defaultValue: 'The Beginning',
      group: 'Content',
    },
    {
      key: 'bgColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#0d0d0d',
      group: 'Style',
    },
    {
      key: 'textColor',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#E8E0D0',
      group: 'Style',
    },
    {
      key: 'accentColor',
      label: 'Accent Color',
      type: 'color',
      defaultValue: '#8B7355',
      group: 'Style',
    },
  ],
})
