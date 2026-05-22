import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAcademicCitationConfig {
  authorLastFirst: string
  publicationYear: string
  articleTitle: string
  journalName: string
  volumeIssue: string
  pageRange: string
  doi: string
  bgColor: string
  textColor: string
  accentColor: string
  highlightColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuint(t: number): number { return 1 - Math.pow(1 - t, 5) }

function SceneAcademicCitationComponent({ config, progress }: MotionGraphicProps<SceneAcademicCitationConfig>) {
  const { authorLastFirst, publicationYear, articleTitle, journalName, volumeIssue, pageRange, doi, bgColor, textColor, accentColor, highlightColor } = config

  // Phases: enter 0-0.3, hold 0.3-0.8, exit 0.8-1
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // "REFERENCES" header
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.2))
  const headerLineWidth = easeOutQuint(Math.min(1, enterProgress / 0.25))

  // Author + year
  const authorOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))
  const authorY = (1 - authorOpacity) * 8

  // Article title (italic)
  const titleOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.25)))
  const titleY = (1 - titleOpacity) * 8

  // Journal + volume
  const journalOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // DOI
  const doiOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: highlight sweep across title
  const highlightSweep = holdProgress > 0 ? Math.min(1, holdProgress * 2) : 0
  const highlightOpacity = holdProgress > 0.5 ? 1 - (holdProgress - 0.5) * 1.2 : highlightSweep > 0 ? 0.2 : 0

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -20

  const sansFont = "'Inter', 'Helvetica Neue', -apple-system, sans-serif"
  const serifFont = "'Georgia', 'Times New Roman', serif"

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: serifFont,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Grid paper effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${accentColor}06 1px, transparent 1px), linear-gradient(90deg, ${accentColor}06 1px, transparent 1px)`,
          backgroundSize: 'clamp(20px, 5vw, 40px) clamp(20px, 5vw, 40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '78%',
          gap: 'clamp(10px, 2vw, 18px)',
          opacity: exitOpacity,
          transform: `translateY(${exitY}px)`,
        }}
      >
        {/* References header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(4px, 0.8vw, 8px)',
            marginBottom: 'clamp(6px, 1.5vw, 14px)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 15px)',
              fontWeight: 700,
              fontFamily: sansFont,
              color: accentColor,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: headerOpacity,
            }}
          >
            References
          </div>
          <div
            style={{
              width: '100%',
              height: 2,
              background: accentColor,
              transform: `scaleX(${headerLineWidth})`,
              transformOrigin: 'left center',
              opacity: 0.5,
            }}
          />
        </div>

        {/* Citation block with hanging indent */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: 'clamp(20px, 5vw, 40px)',
            textIndent: 'clamp(-20px, -5vw, -40px)',
            gap: 'clamp(2px, 0.5vw, 4px)',
          }}
        >
          {/* Author (Year). */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.4vw, 20px)',
              fontWeight: 400,
              color: textColor,
              lineHeight: 1.6,
              opacity: authorOpacity,
              transform: `translateY(${authorY}px)`,
            }}
          >
            {authorLastFirst}{' '}
            <span style={{ color: `${textColor}CC` }}>
              ({publicationYear}).
            </span>
          </div>

          {/* Article title (italic) with highlight */}
          <div
            style={{
              position: 'relative',
              fontSize: 'clamp(12px, 2.4vw, 20px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: textColor,
              lineHeight: 1.6,
              textIndent: 0,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            {/* Highlight underline sweep */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: `${highlightSweep * 100}%`,
                height: 'clamp(2px, 0.4vw, 3px)',
                background: highlightColor,
                opacity: highlightOpacity,
                borderRadius: 1,
              }}
            />
            {articleTitle}.
          </div>

          {/* Journal name (italic), Volume(Issue), pages. */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.4vw, 20px)',
              fontWeight: 400,
              color: `${textColor}CC`,
              lineHeight: 1.6,
              textIndent: 0,
              opacity: journalOpacity,
            }}
          >
            <span style={{ fontStyle: 'italic' }}>{journalName}</span>,{' '}
            <span style={{ fontWeight: 600 }}>{volumeIssue}</span>,{' '}
            {pageRange}.
          </div>

          {/* DOI */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 15px)',
              fontWeight: 400,
              fontFamily: sansFont,
              color: accentColor,
              lineHeight: 1.6,
              textIndent: 0,
              opacity: doiOpacity,
              textDecoration: 'underline',
              textDecorationColor: `${accentColor}44`,
              textUnderlineOffset: 'clamp(2px, 0.4vw, 4px)',
            }}
          >
            {doi}
          </div>
        </div>

        {/* Subtle bracket decoration on the left */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(12px, 3vw, 24px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(3px, 0.6vw, 5px)',
            height: 'clamp(60px, 18vw, 140px)',
            borderLeft: `2px solid ${accentColor}22`,
            borderTop: `2px solid ${accentColor}22`,
            borderBottom: `2px solid ${accentColor}22`,
            borderRight: 'none',
            borderRadius: '3px 0 0 3px',
            opacity: headerOpacity * exitOpacity,
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-academic-citation',
  title: 'Academic Citation',
  description: 'Academic citation in APA format with hanging indent, italic title, journal reference, DOI link, and highlight sweep animation',
  tags: ['scene', 'academic', 'citation', 'apa', 'reference', 'text', 'scholarly', 'journal'],
  category: 'scene-layout',
  component: SceneAcademicCitationComponent as any,
  defaultConfig: {
    authorLastFirst: 'Kahneman, D., & Tversky, A.',
    publicationYear: '1979',
    articleTitle: 'Prospect theory: An analysis of decision under risk',
    journalName: 'Econometrica',
    volumeIssue: '47(2)',
    pageRange: '263\u2013292',
    doi: 'https://doi.org/10.2307/1914185',
    bgColor: '#0B0C10',
    textColor: '#E2DED6',
    accentColor: '#5B7FA5',
    highlightColor: '#5B7FA544',
  },
  configSchema: [
    { key: 'authorLastFirst', label: 'Author(s)', type: 'text', defaultValue: 'Kahneman, D., & Tversky, A.', group: 'Content' },
    { key: 'publicationYear', label: 'Year', type: 'text', defaultValue: '1979', group: 'Content' },
    { key: 'articleTitle', label: 'Article Title', type: 'text', defaultValue: 'Prospect theory: An analysis of decision under risk', group: 'Content' },
    { key: 'journalName', label: 'Journal Name', type: 'text', defaultValue: 'Econometrica', group: 'Content' },
    { key: 'volumeIssue', label: 'Volume(Issue)', type: 'text', defaultValue: '47(2)', group: 'Content' },
    { key: 'pageRange', label: 'Page Range', type: 'text', defaultValue: '263\u2013292', group: 'Content' },
    { key: 'doi', label: 'DOI', type: 'text', defaultValue: 'https://doi.org/10.2307/1914185', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0B0C10', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2DED6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#5B7FA5', group: 'Style' },
    { key: 'highlightColor', label: 'Highlight Color', type: 'color', defaultValue: '#5B7FA544', group: 'Style' },
  ],
})
