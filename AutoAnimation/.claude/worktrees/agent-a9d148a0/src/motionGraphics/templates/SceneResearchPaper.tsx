import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ResearchPaperConfig {
  title: string
  authors: string
  journal: string
  year: string
  abstract: string
  doi: string
  citations: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneResearchPaperComponent({ config, frame, durationInFrames }: MotionGraphicProps<ResearchPaperConfig>) {
  const { title, authors, journal, year, abstract, doi, citations, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  // Paper slides up (0-0.2)
  const paperEnter = easeOutCubic(Math.min(1, progress / 0.2))
  const paperSlideY = (1 - paperEnter) * 80

  // Title reveals (0.1-0.25)
  const titleFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) / 0.15)))

  // Authors (0.2-0.3)
  const authorsFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.1)))

  // Journal + year (0.28-0.38)
  const journalFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.28) / 0.1)))

  // Abstract types in (0.35-0.6)
  const abstractProgress = Math.max(0, Math.min(1, (progress - 0.35) / 0.25))
  const visibleChars = Math.floor(abstractProgress * abstract.length)

  // Citations count up (0.5-0.65)
  const citeProg = Math.max(0, Math.min(1, (progress - 0.5) / 0.15))
  const citeFade = easeOutCubic(citeProg)
  const citeNum = parseInt(citations)
  const countedCites = isNaN(citeNum) ? citations : Math.floor(citeNum * citeProg).toString()

  // DOI (0.6-0.7)
  const doiFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.6) / 0.1)))

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1 - exitProg,
      }}
    >
      {/* Faint paper texture lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: `${12 + i * 4}%`,
            height: 1,
            background: `${textColor}04`,
          }}
        />
      ))}

      {/* Paper card */}
      <div
        style={{
          width: '84%',
          maxWidth: 520,
          padding: 'clamp(20px, 5vw, 40px)',
          background: `${textColor}05`,
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 1.5vw, 14px)',
          transform: `translateY(${paperSlideY}px) scale(${1 - exitProg * 0.1})`,
        }}
      >
        {/* Journal + Year header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(12px, 3vw, 24px)',
            opacity: journalFade,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 2vw, 15px)',
              color: accentColor,
              fontWeight: 600,
              fontStyle: 'italic',
            }}
          >
            {journal}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 2vw, 15px)',
              color: `${textColor}50`,
            }}
          >
            {year}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(18px, 4.5vw, 34px)',
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.3,
            marginBottom: 'clamp(10px, 2.5vw, 20px)',
            opacity: titleFade,
            transform: `translateY(${(1 - titleFade) * 15}px)`,
          }}
        >
          {title}
        </div>

        {/* Authors */}
        <div
          style={{
            fontSize: 'clamp(11px, 2.2vw, 17px)',
            color: `${textColor}70`,
            marginBottom: 'clamp(12px, 3vw, 24px)',
            fontStyle: 'italic',
            opacity: authorsFade,
          }}
        >
          {authors}
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${authorsFade * 100}%`,
            height: 1,
            background: `${accentColor}30`,
            marginBottom: 'clamp(12px, 3vw, 24px)',
          }}
        />

        {/* Abstract label */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.6vw, 13px)',
            color: accentColor,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            opacity: abstractProgress > 0 ? 1 : 0,
          }}
        >
          Abstract
        </div>

        {/* Abstract text */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 19px)',
            color: `${textColor}AA`,
            lineHeight: 1.6,
            marginBottom: 'clamp(14px, 3.5vw, 28px)',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            minHeight: 'clamp(40px, 10vw, 80px)',
          }}
        >
          {abstract.slice(0, visibleChars)}
          {abstractProgress > 0 && abstractProgress < 1 && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: accentColor,
                marginLeft: 1,
                verticalAlign: 'text-bottom',
                opacity: Math.sin(progress * 60) > 0 ? 1 : 0,
              }}
            />
          )}
        </div>

        {/* Footer: citations + DOI */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 'clamp(11px, 2vw, 16px)',
              color: `${textColor}60`,
              opacity: citeFade,
            }}
          >
            <span style={{ color: accentColor, fontWeight: 700 }}>{countedCites}</span> citations
          </div>
          <div
            style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              color: `${textColor}35`,
              fontFamily: "'Courier New', monospace",
              opacity: doiFade,
            }}
          >
            {doi}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-research-paper',
  title: 'Research Paper',
  description: 'Research paper abstract card with title, authors, journal, typing abstract animation, citation counter, and DOI',
  tags: ['scene', 'science', 'research', 'paper', 'academic', 'journal', 'educational'],
  category: 'scene-layout',
  component: SceneResearchPaperComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'CRISPR-Cas9 Gene Editing in Human Embryonic Stem Cells', group: 'Content' },
    { key: 'authors', label: 'Authors', type: 'text', defaultValue: 'Zhang et al.', group: 'Content' },
    { key: 'journal', label: 'Journal', type: 'text', defaultValue: 'Nature Biotechnology', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: '2024', group: 'Content' },
    { key: 'abstract', label: 'Abstract', type: 'text', defaultValue: 'We demonstrate a novel approach to targeted gene editing using optimized CRISPR-Cas9 delivery vectors...', group: 'Content' },
    { key: 'doi', label: 'DOI', type: 'text', defaultValue: 'doi:10.1038/nbt.4286', group: 'Content' },
    { key: 'citations', label: 'Citations', type: 'text', defaultValue: '847', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#A78BFA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e1117', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    title: 'CRISPR-Cas9 Gene Editing in Human Embryonic Stem Cells',
    authors: 'Zhang et al.',
    journal: 'Nature Biotechnology',
    year: '2024',
    abstract: 'We demonstrate a novel approach to targeted gene editing using optimized CRISPR-Cas9 delivery vectors...',
    doi: 'doi:10.1038/nbt.4286',
    citations: '847',
    accentColor: '#A78BFA',
    bgColor: '#0e1117',
    textColor: '#E8E8E8',
  },
})
