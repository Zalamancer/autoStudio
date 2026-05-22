import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CertifiedMailConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const envW = Math.min(width * 0.65, height * 0.48)
    const envH = envW * 0.65

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Counter surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0.05), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        {/* Envelope */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: envW,
            height: envH,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(145deg, #f5f0e6 0%, #ece4d4 100%)',
            borderRadius: 2,
            boxShadow: '0 3px 14px rgba(0,0,0,0.18)',
          }}
        >
          {/* Green certified mail label strip */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '5%',
              width: '55%',
              height: '18%',
              background: 'linear-gradient(90deg, #2d8a4e, #34a058, #2d8a4e)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '4%',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: envW * 0.032,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              CERTIFIED MAIL
            </div>
          </div>
          {/* Tracking number barcode area */}
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '5%',
              width: '60%',
            }}
          >
            {/* Barcode */}
            <div
              style={{
                display: 'flex',
                gap: 1.5,
                marginBottom: 3,
              }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: i % 4 === 0 ? 3 : 1.5,
                    height: 14,
                    background: '#1a1a1a',
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
            {/* Tracking number text */}
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: envW * 0.025,
                color: '#444',
                letterSpacing: 1,
              }}
            >
              7019 1640 0001 2345 6789
            </div>
          </div>
          {/* Signature required checkbox */}
          <div
            style={{
              position: 'absolute',
              bottom: '12%',
              left: '5%',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                border: '1.5px solid #555',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                color: '#2d8a4e',
                fontWeight: 700,
              }}
            >
              &#10003;
            </div>
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: envW * 0.022,
                color: '#666',
              }}
            >
              SIGNATURE REQUIRED
            </div>
          </div>
          {/* Return receipt stamp area */}
          <div
            style={{
              position: 'absolute',
              bottom: '12%',
              right: '5%',
              padding: '3px 8px',
              border: '1.5px solid rgba(180,40,40,0.3)',
              borderRadius: 2,
            }}
          >
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: envW * 0.02,
                color: 'rgba(180,40,40,0.5)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              RETURN RECEIPT
            </div>
          </div>
          {/* Address lines */}
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${55 + i * 10}%`,
                left: '30%',
                width: `${42 - i * 6}%`,
                height: 1,
                background: 'rgba(80,60,40,0.07)',
              }}
            />
          ))}
          {/* Postage stamp */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              right: '5%',
              width: envW * 0.1,
              height: envW * 0.12,
              background: 'linear-gradient(135deg, #2d8a4e, #1a6030)',
              borderRadius: 1,
              opacity: 0.5,
            }}
          />
        </div>
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
  }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0
    let stampOpacity = 0

    if (phase === 'enter') {
      if (enterProgress < 0.3) {
        // Envelope slides into view
        const t = enterProgress / 0.3
        opacity = t
        translateY = (1 - t) * 30
        scale = 0.95 + t * 0.05
      } else if (enterProgress < 0.6) {
        // Official stamp / label application
        const t = (enterProgress - 0.3) / 0.3
        opacity = 1
        translateY = 0
        stampOpacity = t
        scale = 1
      } else {
        // Text solidifies — certified
        const t = (enterProgress - 0.6) / 0.4
        opacity = 1
        translateY = 0
        stampOpacity = 1
        scale = 1 + Math.sin(t * Math.PI) * 0.015
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
      stampOpacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.005
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * 20
      stampOpacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
        }}
      >
        {/* Official format container */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          {/* Small "CERTIFIED" label above */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 2vw, 16px)',
              fontWeight: 700,
              color: '#2d8a4e',
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 4,
              opacity: stampOpacity,
            }}
          >
            &#9632; CERTIFIED &#9632;
          </div>
          {/* Main word */}
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(28px, 8vw, 80px)',
              fontWeight: 700,
              color,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
            }}
          >
            {word}
          </div>
          {/* Tracking info below */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(6px, 1.5vw, 12px)',
              color: 'rgba(100,100,100,0.4)',
              letterSpacing: 2,
              marginTop: 4,
              opacity: stampOpacity,
            }}
          >
            TRACKING# 7019-1640-0001
          </div>
        </div>
      </div>
    )
  },
}

function CertifiedMailComponent(props: MotionGraphicProps<CertifiedMailConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-certified-mail',
  title: 'Kinetic Certified Mail',
  description:
    'Official certified mail envelope with green CERTIFIED label, tracking barcode, signature-required checkbox, and return receipt. Text appears in official postal format.',
  tags: ['kinetic', 'typography', 'certified', 'registered', 'mail', 'postal', 'tracking', 'official', 'barcode'],
  category: 'captions',
  component: CertifiedMailComponent as any,
  defaultConfig: {
    words: ['URGENT', 'SIGNED', 'RETURN', 'PROOF'],
    colors: ['#1a2a3a', '#1a2a3a', '#1a2a3a', '#1a2a3a'],
    bgColor: '#d8d0c2',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['URGENT', 'SIGNED', 'RETURN', 'PROOF'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a2a3a', '#1a2a3a', '#1a2a3a', '#1a2a3a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#d8d0c2', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
