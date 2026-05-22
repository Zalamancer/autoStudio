import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UberArrivalConfig extends KineticBaseConfig {}

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
    // Car drives across bottom
    const carX = (time * 0.12) % 1.3 - 0.1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Map tile mockup */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #1a2332 0%, #1e2d42 100%)',
          }}
        />
        {/* Road */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: 0,
            right: 0,
            height: 'clamp(12px, 2.5vw, 20px)',
            background: '#2a3848',
          }}
        >
          {/* Road dashes */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${(i * 12 + (time * 8) % 12)}%`,
                transform: 'translateY(-50%)',
                width: '6%',
                height: 2,
                background: 'rgba(255,255,0,0.3)',
                borderRadius: 1,
              }}
            />
          ))}
        </div>

        {/* Grid street lines */}
        {[0.2, 0.4, 0.6, 0.8].map((x, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(255,255,255,0.05)',
            }}
          />
        ))}
        {[0.25, 0.5, 0.75].map((y, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${y * 100}%`,
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(255,255,255,0.05)',
            }}
          />
        ))}

        {/* Moving car */}
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(15% + clamp(6px, 1.2vw, 10px))',
            left: `${carX * 100}%`,
            fontSize: 'clamp(14px, 2.8vw, 22px)',
            transform: 'translateX(-50%)',
          }}
        >
          🚗
        </div>

        {/* Pin at destination */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 'clamp(14px, 2.8vw, 22px)',
              height: 'clamp(14px, 2.8vw, 22px)',
              borderRadius: '50% 50% 50% 0',
              background: '#000',
              transform: 'rotate(-45deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.8)',
            }}
          />
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              color: 'rgba(255,255,255,0.6)',
              marginTop: 3,
              background: 'rgba(0,0,0,0.6)',
              padding: '2px 6px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            Your location
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Arrival notification slides up from bottom
    const notifP = easeOutBack(Math.min(1, enterProgress / 0.4))
    const notifY = (1 - easeOutExpo(Math.min(1, enterProgress / 0.4))) * 60
    const notifOpacity = phase === 'exit'
      ? Math.max(0, 1 - exitProgress * 3)
      : Math.min(1, enterProgress * 5) * (phase === 'enter' && enterProgress > 0.5 ? Math.max(0, 1 - (enterProgress - 0.5) * 5) : 1)

    // Word slams in like arrival alert
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.55) / 0.45)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.5) * 5))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.08) * 0.012 : 1

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Uber arrival bottom sheet */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fff',
            borderRadius: '20px 20px 0 0',
            padding: 'clamp(10px, 2.5vw, 20px)',
            transform: `translateY(${notifY}px) scale(${notifP})`,
            opacity: notifOpacity,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Handle bar */}
          <div
            style={{
              width: 'clamp(24px, 6vw, 48px)',
              height: 4,
              background: 'rgba(0,0,0,0.12)',
              borderRadius: 100,
              margin: '0 auto clamp(6px, 1.5vw, 12px)',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 16px)',
            }}
          >
            {/* Driver avatar */}
            <div
              style={{
                width: 'clamp(28px, 5.5vw, 44px)',
                height: 'clamp(28px, 5.5vw, 44px)',
                borderRadius: '50%',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(12px, 2.4vw, 19px)',
                flexShrink: 0,
              }}
            >
              👤
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 'clamp(9px, 1.7vw, 13px)',
                  fontWeight: 800,
                  color: '#000',
                }}
              >
                Your driver is arriving
              </div>
              <div
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 'clamp(7px, 1.2vw, 10px)',
                  color: 'rgba(0,0,0,0.5)',
                }}
              >
                Toyota Camry · ABC 1234 · ★ 4.96
              </div>
            </div>
            {/* Black car icon */}
            <div
              style={{
                background: '#000',
                borderRadius: 8,
                padding: 'clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px)',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 'clamp(6px, 1.1vw, 9px)',
                color: '#fff',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Track
            </div>
          </div>
        </div>

        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${wordP * pulse})`,
            opacity: wordOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(34px, 8.5vw, 118px)',
              fontWeight: 900,
              color,
              textShadow: `0 0 20px ${color}55`,
              letterSpacing: -2,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function UberArrivalComponent(props: MotionGraphicProps<UberArrivalConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-uber-arrival',
  title: 'Kinetic Uber Arrival',
  description:
    'Uber map view with a moving car icon and destination pin — the arrival bottom sheet slides up with driver details, then the word punches out over the dark map background',
  tags: ['kinetic', 'typography', 'uber', 'rideshare', 'map', 'arrival', 'platform', 'digital-native', 'interaction'],
  category: 'captions',
  component: UberArrivalComponent as any,
  defaultConfig: {
    words: ['HERE', 'ARRIVE', 'LFG', 'LETS GO'],
    colors: ['#000000', '#1DB954', '#007AFF', '#FF3B30'],
    bgColor: '#1a2332',
    cycleDuration: 2.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HERE', 'ARRIVE', 'LFG', 'LETS GO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#000000', '#1DB954', '#007AFF', '#FF3B30'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a2332', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
