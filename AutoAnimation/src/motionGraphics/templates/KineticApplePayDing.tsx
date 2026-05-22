import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ApplePayDingConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Ripple rings from tap point
    const ringCount = 3
    const rings = Array.from({ length: ringCount }, (_, i) => {
      const delay = i * 0.25
      const t = Math.max(0, (time - delay) % 2) / 1.5
      return { scale: 1 + t * 1.8, opacity: Math.max(0, (1 - t) * 0.4) }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ripple rings */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(40px, 8vw, 64px)',
            height: 'clamp(40px, 8vw, 64px)',
          }}
        >
          {rings.map((ring, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid rgba(0,122,255,0.6)',
                transform: `scale(${ring.scale})`,
                opacity: ring.opacity,
              }}
            />
          ))}
        </div>

        {/* iPhone-style payment UI */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(8px, 2vw, 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(120px, 36vw, 240px)',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: 'clamp(8px, 2vw, 16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(4px, 0.8vw, 6px)',
          }}
        >
          {/* Apple Pay logo */}
          <div
            style={{
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontSize: 'clamp(10px, 2vw, 16px)',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: -0.3,
            }}
          >
            Apple Pay
          </div>
          {/* Merchant */}
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Paying · Coffee Shop
          </div>
          {/* Amount */}
          <div
            style={{
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontSize: 'clamp(14px, 2.8vw, 22px)',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            $4.75
          </div>
          {/* Card chip */}
          <div
            style={{
              width: 'clamp(30px, 7vw, 56px)',
              height: 'clamp(14px, 3vw, 24px)',
              background: 'linear-gradient(135deg, rgba(255,215,0,0.4), rgba(255,180,0,0.6))',
              borderRadius: 4,
              border: '1px solid rgba(255,215,0,0.5)',
            }}
          />
        </div>

        {/* NFC field lines */}
        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 3,
            alignItems: 'center',
          }}
        >
          {[0.3, 0.5, 0.7].map((h, i) => (
            <div
              key={i}
              style={{
                width: `${6 + i * 3}px`,
                height: `${10 + i * 4}px`,
                borderRadius: '50%',
                border: '1.5px solid rgba(0,122,255,0.35)',
                opacity: 0.3 + Math.sin(time * 4 + i) * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Checkmark appears first
    const checkP = easeOutBack(Math.min(1, enterProgress / 0.35))
    const checkOpacity = Math.min(1, enterProgress * 6) * (phase === 'enter' && enterProgress > 0.5 ? Math.max(0, 1 - (enterProgress - 0.5) * 4) : 1) * (phase === 'exit' ? Math.max(0, 1 - exitProgress * 4) : 1)

    // Word slides up like a receipt
    const wordP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - 0.45) / 0.55)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.4) * 4))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.08) * 0.01 : 1
    const wordY = (1 - wordP) * 25

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Payment approved checkmark */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${checkP})`,
            opacity: checkOpacity,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 'clamp(36px, 7.5vw, 60px)',
              height: 'clamp(36px, 7.5vw, 60px)',
              borderRadius: '50%',
              background: '#34C759',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(52,199,89,0.5)',
              fontSize: 'clamp(16px, 3.5vw, 28px)',
              color: '#fff',
              fontWeight: 900,
            }}
          >
            ✓
          </div>
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(8px, 1.5vw, 12px)',
              color: '#34C759',
              fontWeight: 600,
              marginTop: 'clamp(4px, 0.8vw, 6px)',
              whiteSpace: 'nowrap',
            }}
          >
            Payment Approved
          </div>
        </div>

        {/* Main word like a transaction confirmation */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: `translateX(-50%) translateY(${wordY}px) scale(${pulse})`,
            opacity: wordOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontSize: 'clamp(34px, 8.5vw, 118px)',
              fontWeight: 800,
              color,
              letterSpacing: -2,
              textShadow: `0 0 20px ${color}44`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function ApplePayDingComponent(props: MotionGraphicProps<ApplePayDingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-apple-pay-ding',
  title: 'Kinetic Apple Pay Ding',
  description:
    'Apple Pay tap-to-pay moment — NFC ripple rings pulse, payment card UI appears, green checkmark bounces in with "Payment Approved", then the word drops clean and crisp',
  tags: ['kinetic', 'typography', 'apple-pay', 'payment', 'nfc', 'ios', 'platform', 'digital-native', 'interaction'],
  category: 'captions',
  component: ApplePayDingComponent as any,
  defaultConfig: {
    words: ['PAID', 'APPROVED', 'DONE', 'EASY'],
    colors: ['#34C759', '#007AFF', '#FF9500', '#FF3B30'],
    bgColor: '#000000',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PAID', 'APPROVED', 'DONE', 'EASY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#34C759', '#007AFF', '#FF9500', '#FF3B30'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
