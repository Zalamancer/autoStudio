import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScanRevealConfig extends KineticBaseConfig {
  scanGlow: number
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuint(t: number): number {
  return t * t * t * t * t
}

function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Faint horizontal scanline grid — static, atmospheric
    const lineCount = 20
    const lines: React.ReactNode[] = []
    for (let i = 0; i < lineCount; i++) {
      lines.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${(i / lineCount) * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(100,180,255,0.03)',
          }}
        />,
      )
    }

    const pulseAlpha = 0.04 + Math.sin(t * 0.6) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {lines}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 10% 20%, rgba(60,120,200,${pulseAlpha}), transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(60,100,200,${pulseAlpha * 0.7}), transparent 50%)
            `,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__scanRevealConfig ?? { scanGlow: 1 }
    const scanGlow = cfg.scanGlow ?? 1

    // Beam sweeps top-to-bottom materializing text in its wake
    let scanY = -0.1
    let beamVisible = false
    let globalOpacity = 1

    if (phase === 'enter') {
      scanY = easeOutQuint(enterProgress) * 1.1 - 0.05
      beamVisible = true
      globalOpacity = 1
    } else if (phase === 'hold') {
      scanY = 1.1
      beamVisible = false
      globalOpacity = 1
    } else {
      scanY = 1.1
      beamVisible = false
      globalOpacity = 1 - easeOutSine(exitProgress)
    }

    // Per-character reveal — left-to-right stagger within the scan
    const chars = word.split('').map((ch, ci) => {
      const charNorm = word.length > 1 ? ci / (word.length - 1) : 0.5

      let charOpacity = globalOpacity
      let charOffsetY = 0
      let charFilter = 'none'

      if (phase === 'enter') {
        // Reveal stagger: left chars first, right chars trail
        const charRevealAt = 0.3 + charNorm * 0.4
        const charReveal = Math.max(0, Math.min(1, (enterProgress - charRevealAt) / 0.2))
        const charEased = easeOutQuint(charReveal)
        charOpacity = charEased
        charOffsetY = (1 - charEased) * 6
        charFilter = charReveal < 0.8 ? `blur(${(1 - charEased) * 4}px)` : 'none'
      } else if (phase === 'exit') {
        // Edge chars fade first
        const distFromCenter = Math.abs(charNorm - 0.5) * 2
        const charFadeStart = distFromCenter * 0.3
        const charFadeProgress = Math.max(0, (exitProgress - charFadeStart) / (1 - charFadeStart))
        charOpacity = Math.max(0, 1 - easeOutSine(charFadeProgress))
        charOffsetY = -easeInQuint(exitProgress) * 4
      } else {
        // Hold: gentle energy shimmer
        charOffsetY = Math.sin(t * 1.4 + ci * 0.5) * 0.5
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            filter: charFilter,
            transform: `translateY(${charOffsetY}px)`,
            textShadow:
              phase === 'hold'
                ? `0 0 ${12 * scanGlow}px ${color}60, 0 0 ${30 * scanGlow}px ${color}20, 0 1px 4px rgba(0,0,0,0.6)`
                : `0 0 ${8 * scanGlow}px ${color}80`,
          }}
        >
          {ch}
        </span>
      )
    })

    const beamYPx = scanY * height
    const beamLineH = 3
    const beamGlowH = 60 * scanGlow
    const trailH = 80

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(38px, 10.5vw, 136px)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>

        {/* Scanner beam */}
        {beamVisible && (
          <>
            {/* Afterglow trail above beam */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: beamYPx - trailH,
                height: trailH,
                background: `linear-gradient(180deg, transparent, ${color}08 60%, ${color}18 100%)`,
                pointerEvents: 'none',
              }}
            />

            {/* Beam glow halo */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: beamYPx - beamGlowH / 2,
                height: beamGlowH,
                background: `linear-gradient(180deg,
                  transparent,
                  ${color}10 30%,
                  ${color}30 50%,
                  ${color}10 70%,
                  transparent
                )`,
                pointerEvents: 'none',
              }}
            />

            {/* Beam core */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: beamYPx - beamLineH / 2,
                height: beamLineH,
                background: `linear-gradient(90deg,
                  transparent 0%,
                  ${color}60 10%,
                  ${color}cc 30%,
                  ${color}ff 50%,
                  ${color}cc 70%,
                  ${color}60 90%,
                  transparent 100%
                )`,
                filter: 'blur(0.5px)',
                boxShadow: `0 0 ${8 * scanGlow}px ${color}80`,
                pointerEvents: 'none',
              }}
            />

            {/* Edge tick marks */}
            {[0.02, 0.98].map((xFrac, ti) => (
              <div
                key={`tick${ti}`}
                style={{
                  position: 'absolute',
                  left: `${xFrac * 100}%`,
                  top: beamYPx - 6,
                  width: 2,
                  height: 12,
                  background: `${color}aa`,
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </>
        )}
      </div>
    )
  },
}

function ScanRevealComponent(props: MotionGraphicProps<ScanRevealConfig>) {
  ;(globalThis as any).__scanRevealConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scan-reveal',
  title: 'Kinetic Scan Reveal',
  description: 'A luminous scanner beam sweeps top-to-bottom materializing text with left-to-right character stagger — clean, modern, and cinematic for transition words',
  tags: ['kinetic', 'typography', 'scan', 'reveal', 'beam', 'tech', 'modern', 'transition', 'cinematic', 'hud', 'clean'],
  category: 'captions',
  component: ScanRevealComponent as any,
  defaultConfig: {
    words: ['Meanwhile...', 'Cut to...', 'Next up', 'And then'],
    colors: ['#7DF0FF', '#60E0FF', '#A0F4FF', '#50D8FF'],
    bgColor: '#040d14',
    cycleDuration: 1.2,
    scanGlow: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['Meanwhile...', 'Cut to...', 'Next up', 'And then'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#7DF0FF', '#60E0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040d14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'scanGlow', label: 'Beam Glow Intensity', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
  ],
})
