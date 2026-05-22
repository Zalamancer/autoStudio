import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBrandGuidelineConfig {
  brandName: string
  brandColors: string[]
  colorNames: string[]
  primaryFont: string
  secondaryFont: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneBrandGuidelineComponent({ config, progress }: MotionGraphicProps<SceneBrandGuidelineConfig>) {
  const { brandName, brandColors, colorNames, primaryFont, secondaryFont, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Subtle corner accents */}
      <div style={{
        position: 'absolute', top: '5%', left: '5%',
        width: 40, height: 40,
        borderTop: `2px solid ${textColor}06`,
        borderLeft: `2px solid ${textColor}06`,
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', right: '5%',
        width: 40, height: 40,
        borderBottom: `2px solid ${textColor}06`,
        borderRight: `2px solid ${textColor}06`,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '6% 8%',
        opacity: exitOpacity,
      }}>
        {/* Brand name */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(22px, 6vw, 44px)',
          fontWeight: 800,
          color: brandColors[0] || textColor,
          marginBottom: 'clamp(2px, 0.5vw, 4px)',
          opacity: easeOutCubic(enterProgress),
          letterSpacing: '-0.02em',
        }}>
          {brandName}
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(8px, 1.4vw, 11px)',
          fontWeight: 500,
          color: `${textColor}40`,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          marginBottom: 'clamp(20px, 5vw, 40px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          Brand Guidelines
        </div>

        {/* Color palette */}
        <div style={{
          marginBottom: 'clamp(6px, 1.5vw, 12px)',
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(8px, 1.4vw, 11px)',
          fontWeight: 600,
          color: `${textColor}50`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          alignSelf: 'flex-start',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
        }}>
          Color Palette
        </div>
        <div style={{
          display: 'flex',
          gap: 'clamp(4px, 1vw, 8px)',
          width: '100%',
          marginBottom: 'clamp(20px, 5vw, 36px)',
        }}>
          {brandColors.map((color, i) => {
            const stagger = i * 0.08
            const swatchEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger - 0.1) / 0.7)))

            // Hold: gentle sway
            const holdSway = progress >= 0.25 && progress < 0.8
              ? Math.sin(holdProgress * Math.PI * 2 + i * 0.8) * 2
              : 0

            return (
              <div key={i} style={{
                flex: 1,
                opacity: swatchEnter,
                transform: `translateY(${(1 - swatchEnter) * 15 + holdSway}px)`,
              }}>
                {/* Color swatch */}
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 'clamp(6px, 1.2vw, 10px)',
                  background: color,
                  boxShadow: `0 4px 12px ${color}30`,
                  marginBottom: 'clamp(4px, 1vw, 8px)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Subtle shine */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)',
                    borderRadius: 'inherit',
                  }} />
                </div>
                {/* Color name */}
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(7px, 1.2vw, 10px)',
                  fontWeight: 600,
                  color: `${textColor}70`,
                  textAlign: 'center',
                }}>
                  {colorNames[i] || `Color ${i + 1}`}
                </div>
                {/* Hex code */}
                <div style={{
                  fontFamily: "'SF Mono', monospace",
                  fontSize: 'clamp(6px, 1vw, 9px)',
                  fontWeight: 500,
                  color: `${textColor}35`,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>
                  {color}
                </div>
              </div>
            )
          })}
        </div>

        {/* Typography section */}
        <div style={{
          width: '100%',
          display: 'flex',
          gap: 'clamp(12px, 3vw, 24px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
        }}>
          {/* Primary font */}
          <div style={{
            flex: 1,
            background: `${textColor}04`,
            borderRadius: 'clamp(6px, 1vw, 10px)',
            padding: 'clamp(10px, 2.5vw, 20px)',
            border: `1px solid ${textColor}06`,
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              fontWeight: 500,
              color: `${textColor}40`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'clamp(4px, 1vw, 8px)',
            }}>
              Primary
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(16px, 4vw, 30px)',
              fontWeight: 700,
              color: textColor,
              marginBottom: 4,
            }}>
              Aa
            </div>
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(8px, 1.4vw, 11px)',
              fontWeight: 500,
              color: `${textColor}50`,
            }}>
              {primaryFont}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: `${textColor}30`,
              marginTop: 6,
              lineHeight: 1.4,
            }}>
              ABCDEFGHIJKLM
              <br />
              abcdefghijklm
              <br />
              0123456789
            </div>
          </div>

          {/* Secondary font */}
          <div style={{
            flex: 1,
            background: `${textColor}04`,
            borderRadius: 'clamp(6px, 1vw, 10px)',
            padding: 'clamp(10px, 2.5vw, 20px)',
            border: `1px solid ${textColor}06`,
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              fontWeight: 500,
              color: `${textColor}40`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'clamp(4px, 1vw, 8px)',
            }}>
              Secondary
            </div>
            <div style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 'clamp(16px, 4vw, 30px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: textColor,
              marginBottom: 4,
            }}>
              Aa
            </div>
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(8px, 1.4vw, 11px)',
              fontWeight: 500,
              color: `${textColor}50`,
            }}>
              {secondaryFont}
            </div>
            <div style={{
              fontFamily: "Georgia, serif",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: `${textColor}30`,
              marginTop: 6,
              lineHeight: 1.4,
            }}>
              ABCDEFGHIJKLM
              <br />
              abcdefghijklm
              <br />
              0123456789
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-brand-guideline',
  title: 'Brand Guideline',
  description: 'Brand guideline card showing color palette swatches with hex codes, primary/secondary typography samples, and clean corporate layout.',
  tags: ['scene', 'brand', 'guideline', 'colors', 'typography', 'identity', 'design', 'marketing'],
  category: 'scene-layout',
  component: SceneBrandGuidelineComponent as any,
  defaultConfig: {
    brandName: 'Acme Corp',
    brandColors: ['#3B82F6', '#1E40AF', '#10B981', '#F59E0B', '#1E293B'],
    colorNames: ['Primary', 'Dark', 'Success', 'Accent', 'Neutral'],
    primaryFont: 'Inter',
    secondaryFont: 'Georgia',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'brandName', label: 'Brand Name', type: 'text', defaultValue: 'Acme Corp', group: 'Content' },
    { key: 'brandColors', label: 'Brand Colors (hex)', type: 'text-array', defaultValue: ['#3B82F6', '#1E40AF', '#10B981', '#F59E0B', '#1E293B'], group: 'Style' },
    { key: 'colorNames', label: 'Color Names', type: 'text-array', defaultValue: ['Primary', 'Dark', 'Success', 'Accent', 'Neutral'], group: 'Style' },
    { key: 'primaryFont', label: 'Primary Font Name', type: 'text', defaultValue: 'Inter', group: 'Content' },
    { key: 'secondaryFont', label: 'Secondary Font Name', type: 'text', defaultValue: 'Georgia', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
