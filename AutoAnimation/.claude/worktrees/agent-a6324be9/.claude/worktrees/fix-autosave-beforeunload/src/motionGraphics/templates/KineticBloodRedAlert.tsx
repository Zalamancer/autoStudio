import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BloodRedAlertConfig extends KineticBaseConfig {
  flickerRate: number
}

// Deceleration that stutters — feels like something struggling to stop
function easeOutStutter(t: number): number {
  if (t >= 1) return 1
  // Three stutter-stops before settling
  const s1 = t < 0.4 ? t * 1.8 : 0.72
  const s2 = t < 0.7 ? s1 : s1 + (t - 0.7) * 2.1
  const s3 = t < 0.88 ? s2 : s2 + (t - 0.88) * 2.4
  return Math.min(1, s3)
}

// Ease-in that accelerates harshly — no warning
function easeInCubicHard(t: number): number {
  return t * t * t
}

function seededRand(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Candle-flicker intensity — low-frequency organic variation
    const flicker1 = 0.85 + Math.sin(time * 7.3) * 0.08 + Math.sin(time * 19.1) * 0.04 + Math.sin(time * 3.7) * 0.03
    const flicker2 = 0.9 + Math.sin(time * 11.7 + 1.3) * 0.06 + Math.sin(time * 5.1) * 0.04
    // Pulse: slow ominous breathing on the bg light
    const pulse = 0.5 + Math.sin(time * 1.1) * 0.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Deep red vignette that breathes — ominous ambient light */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 100%, rgba(140,0,0,${0.22 * pulse * flicker1}) 0%, transparent 65%)`,
          }}
        />
        {/* Top shadow — like something looming overhead */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.4) 100%)',
          }}
        />
        {/* Candle-light glow at bottom center — warm unsettling light source */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '40%',
            background: `radial-gradient(ellipse at 50% 100%, rgba(180,60,0,${0.18 * flicker2}) 0%, transparent 70%)`,
          }}
        />
        {/* Grain texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px',
            opacity: 0.6,
            mixBlendMode: 'overlay',
          }}
        />
        {/* WARNING label — barely legible, top right */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 18,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `rgba(160,0,0,${0.3 + seededRand(Math.floor(time * 2)) * 0.25})`,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          WARNING
        </div>
        {/* Thin horizontal blood-red rule at 1/3 and 2/3 height */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '33%',
            height: 1,
            background: `rgba(120,0,0,${0.12 * flicker1})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '67%',
            height: 1,
            background: `rgba(120,0,0,${0.12 * flicker2})`,
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
    fps,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.55), 156)
    const time = (frame ?? 0) / (fps ?? 30)

    // Candle flicker on hold — organic, never quite steady
    const holdFlicker =
      0.92 +
      Math.sin(time * 11.3) * 0.05 +
      Math.sin(time * 23.7) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
          }}
        >
          {chars.map((char, ci) => {
            // Stagger: later chars arrive slightly after
            const stagger = ci * 0.05
            let opacity = 0
            let scaleY = 1
            let scaleX = 1
            let translateY = 0
            let blur = 0
            let textShadow = `0 0 0px ${color}00`
            let charColor = color

            if (phase === 'enter') {
              // Branded onto the screen — smashes down from above with stutter deceleration
              const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.6)))
              const eased = easeOutStutter(t)
              translateY = -(1 - eased) * (fontSize * 1.8)
              opacity = Math.min(1, t * 2.5)
              scaleY = 0.5 + eased * 0.5
              scaleX = eased < 0.5 ? 1 + (0.5 - eased) * 0.4 : 1
              blur = (1 - eased) * 3
              // Blood-red glow intensifies as it hits
              const impactGlow = eased > 0.85 ? (1 - (eased - 0.85) / 0.15) * 30 : 0
              textShadow = `0 0 ${impactGlow + 8}px ${color}90, 0 ${impactGlow * 0.5}px ${impactGlow * 1.5}px ${color}40`
            } else if (phase === 'hold') {
              opacity = holdFlicker
              // Subtle char-by-char flicker — the light is dying
              const charFlicker = seededRand(Math.floor(time * 18) + ci * 7 + index * 3)
              const doCharFlick = charFlicker > 0.93
              opacity = doCharFlick ? holdFlicker * 0.3 : holdFlicker
              // Occasional single-char color shift to near-black — like blood drying
              const doDarken = seededRand(Math.floor(time * 8) + ci * 11 + index * 5) > 0.92
              charColor = doDarken ? '#3a0000' : color
              // Micro-sway — like watching something breathe
              translateY = Math.sin(time * 2.1 + ci * 0.7) * 0.8
              textShadow = `0 0 14px ${color}60, 0 0 35px ${color}20`
            } else {
              // Exit: drains away downward — like blood dripping off screen
              const t = Math.max(0, Math.min(1, (exitProgress - stagger * 0.5) / (1 - stagger * 0.5)))
              const eased = easeInCubicHard(t)
              translateY = eased * (fontSize * 1.6)
              opacity = 1 - eased * 1.1
              scaleX = 1 - eased * 0.1
              scaleY = 1 + eased * 0.3
              blur = eased * 2
              textShadow = `0 ${eased * 15}px ${20 + eased * 20}px ${color}40`
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: charColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  transform: `translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
                  opacity: Math.max(0, opacity),
                  filter: blur > 0.1 ? `blur(${blur}px)` : 'none',
                  textShadow,
                  transition: 'none',
                  willChange: 'transform',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            )
          })}
        </div>

        {/* Impact flash at moment of landing — enter only */}
        {phase === 'enter' && enterProgress > 0.6 && enterProgress < 0.8 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(120,0,0,${(0.8 - enterProgress) / 0.2 * 0.12})`,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          />
        )}
      </div>
    )
  },
}

function BloodRedAlertComponent(props: MotionGraphicProps<BloodRedAlertConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blood-red-alert',
  title: 'Blood Red Alert',
  description:
    'Horror-grade kinetic typography. Words brand themselves onto screen with stutter-deceleration, hold with organic candle-flicker and per-character dying-light variation, then drain downward like blood. Deep red glow, film grain, barely-visible warning label. Built for: WARNING, EXPOSED, THEY KNOW, RUN.',
  tags: [
    'kinetic',
    'typography',
    'dark',
    'horror',
    'blood',
    'thriller',
    'true-crime',
    'warning',
    'moody',
    'red',
    'ominous',
    'flicker',
  ],
  category: 'captions',
  component: BloodRedAlertComponent as any,
  defaultConfig: {
    words: ['WARNING', 'THEY KNOW', 'GET OUT', 'NOW'],
    colors: ['#cc0000', '#b00000', '#e01010', '#cc0000'],
    bgColor: '#060404',
    cycleDuration: 1.3,
    flickerRate: 0.7,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WARNING', 'THEY KNOW', 'GET OUT', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#cc0000', '#b00000', '#e01010', '#cc0000'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060404', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.4,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'flickerRate',
      label: 'Flicker Rate',
      type: 'number',
      defaultValue: 0.7,
      min: 0,
      max: 1,
      group: 'Animation',
    },
  ],
})
