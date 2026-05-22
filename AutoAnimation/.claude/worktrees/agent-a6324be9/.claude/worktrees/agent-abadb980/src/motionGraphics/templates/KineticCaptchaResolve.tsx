import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CaptchaResolveConfig extends KineticBaseConfig {}

// Deterministic seeded pseudo-random
function seededVal(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, bgColor, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Grid of faint CAPTCHA image tiles (the "select traffic lights" grid) */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            right: '5%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            width: 'clamp(60px, 12vw, 110px)',
            opacity: 0.12,
          }}
        >
          {Array.from({ length: 9 }, (_, i) => {
            const hue = Math.floor(seededVal(i * 7 + 3) * 360)
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  background: `hsl(${hue}, 30%, 50%)`,
                  borderRadius: 2,
                }}
              />
            )
          })}
        </div>

        {/* reCAPTCHA card chrome */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#F9F9F9',
            border: '1px solid #D3D3D3',
            borderRadius: 4,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            opacity: 0.2,
            width: 'clamp(140px, 30vw, 280px)',
          }}
        >
          {/* Checkbox */}
          <div
            style={{
              width: 'clamp(14px, 2.5vw, 22px)',
              height: 'clamp(14px, 2.5vw, 22px)',
              border: '2px solid #BABABA',
              borderRadius: 2,
              background: '#FFF',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: 'clamp(8px, 1.5vw, 13px)',
              color: '#555',
            }}
          >
            I'm not a robot
          </span>
          {/* reCAPTCHA logo placeholder */}
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 'clamp(20px, 3.5vw, 32px)',
                height: 'clamp(20px, 3.5vw, 32px)',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4285F4, #EA4335, #FBBC04, #34A853)',
                opacity: 0.6,
              }}
            />
            <span
              style={{
                fontFamily: 'Roboto, Arial, sans-serif',
                fontSize: 'clamp(5px, 0.9vw, 8px)',
                color: '#999',
                marginTop: 2,
              }}
            >
              reCAPTCHA
            </span>
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const totalChars = word.length

    // Enter: the word starts distorted/blurry (like CAPTCHA challenge text) and resolves
    let opacity = 1
    let blur = 0
    let letterSpacing = 0
    let skewX = 0
    let checkmarkProgress = 0

    if (phase === 'enter') {
      // Phase 1 (0-0.5): distorted CAPTCHA text
      // Phase 2 (0.5-1.0): resolves to clean text as "verified"
      if (enterProgress < 0.6) {
        const t = enterProgress / 0.6
        blur = (1 - t) * 6
        letterSpacing = (1 - t) * 8
        skewX = Math.sin(t * Math.PI * 3) * (1 - t) * 8
        opacity = 0.4 + t * 0.6
      } else {
        const t = (enterProgress - 0.6) / 0.4
        blur = 0
        letterSpacing = 0
        skewX = 0
        opacity = 1
        checkmarkProgress = t
      }
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
      checkmarkProgress = 1
    } else {
      checkmarkProgress = 1
    }

    // Checkbox state
    const checkSize = checkmarkProgress
    const boxBorderColor = checkmarkProgress > 0.3 ? '#4285F4' : '#BABABA'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 18px)',
        }}
      >
        {/* Checkbox row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 14px)',
            background: '#F9F9F9',
            border: '1px solid #D3D3D3',
            borderRadius: 4,
            padding: 'clamp(4px, 1vw, 10px) clamp(8px, 2vw, 18px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          {/* Animated checkbox */}
          <div
            style={{
              width: 'clamp(16px, 3.5vw, 30px)',
              height: 'clamp(16px, 3.5vw, 30px)',
              border: `2px solid ${boxBorderColor}`,
              borderRadius: 2,
              background: checkmarkProgress > 0.3 ? '#4285F4' : '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s',
              flexShrink: 0,
            }}
          >
            {checkmarkProgress > 0.3 && (
              <svg
                width="60%"
                height="60%"
                viewBox="0 0 12 10"
                style={{ opacity: Math.min(1, (checkmarkProgress - 0.3) / 0.4) }}
              >
                <polyline
                  points="1,5 4.5,9 11,1"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="18"
                  strokeDashoffset={18 - Math.min(1, (checkmarkProgress - 0.3) / 0.5) * 18}
                />
              </svg>
            )}
          </div>
          <span
            style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: 'clamp(10px, 2vw, 16px)',
              color: '#555',
              whiteSpace: 'nowrap',
            }}
          >
            {checkmarkProgress > 0.7 ? 'Verified' : "I'm not a robot"}
          </span>
        </div>

        {/* The main word — distorted CAPTCHA style resolving to clean */}
        <div
          style={{
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: 'clamp(32px, 8.5vw, 120px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: `${letterSpacing}px`,
            filter: blur > 0 ? `blur(${blur}px)` : 'none',
            transform: `skewX(${skewX}deg)`,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CaptchaResolveComponent(props: MotionGraphicProps<CaptchaResolveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-captcha-resolve',
  title: 'Kinetic CAPTCHA Resolve',
  description:
    'reCAPTCHA verification UI — text starts blurry and distorted like CAPTCHA challenge text, checkbox fills with checkmark as word resolves into clean readable text',
  tags: ['kinetic', 'typography', 'captcha', 'recaptcha', 'verify', 'ui', 'digital', 'internet'],
  category: 'captions',
  component: CaptchaResolveComponent as any,
  defaultConfig: {
    words: ['VERIFIED', 'TRUSTED', 'HUMAN', 'CONFIRMED'],
    colors: ['#4285F4', '#34A853', '#4285F4', '#34A853'],
    bgColor: '#FFFFFF',
    cycleDuration: 2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['VERIFIED', 'TRUSTED', 'HUMAN', 'CONFIRMED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#4285F4', '#34A853', '#4285F4', '#34A853'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
