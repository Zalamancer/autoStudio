import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NotificationFloodConfig extends KineticBaseConfig {}

const NOTIFICATION_DATA = [
  { app: 'Messages', body: 'Hey are you free tonight?', badge: 3, icon: '💬' },
  { app: 'Instagram', body: 'liked your photo', badge: 47, icon: '\uD83D\uDCF8' },
  { app: 'Email', body: 'Your order has shipped!', badge: 12, icon: '\uD83D\uDCE7' },
  { app: 'TikTok', body: 'started following you', badge: 99, icon: '\uD83C\uDFB5' },
  { app: 'Slack', body: 'mentioned you in #general', badge: 5, icon: '\uD83D\uDCAC' },
  { app: 'News', body: 'Breaking: Major event', badge: 1, icon: '\uD83D\uDCF0' },
]

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, bgColor }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Lock screen wallpaper feel: blurred gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(236,72,153,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Notification banners stacking down from top */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(160px, 50vw, 320px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {NOTIFICATION_DATA.map((notif, i) => {
            const delay = i * 0.2
            const appearTime = time - delay
            if (appearTime < 0) return null

            const slideProgress = Math.min(1, appearTime / 0.2)
            const translateY = -(1 - slideProgress) * 30
            const notifOpacity = Math.min(0.6, slideProgress * 0.8)

            return (
              <div
                key={i}
                style={{
                  background: 'rgba(30, 30, 30, 0.88)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 12,
                  padding: 'clamp(5px, 1.2vw, 10px) clamp(8px, 1.8vw, 14px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(5px, 1vw, 8px)',
                  transform: `translateY(${translateY}px)`,
                  opacity: notifOpacity,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* App icon */}
                <div
                  style={{
                    width: 'clamp(16px, 3vw, 24px)',
                    height: 'clamp(16px, 3vw, 24px)',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(9px, 1.8vw, 14px)',
                    flexShrink: 0,
                  }}
                >
                  {notif.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: 'clamp(6px, 1.1vw, 9px)',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {notif.app}
                  </div>
                  <div
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: 'clamp(6px, 1.2vw, 10px)',
                      color: 'rgba(255,255,255,0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {notif.body}
                  </div>
                </div>
                {/* Badge */}
                <div
                  style={{
                    background: '#FF3B30',
                    borderRadius: 100,
                    minWidth: 'clamp(11px, 2vw, 16px)',
                    height: 'clamp(11px, 2vw, 16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: 'clamp(5px, 0.9vw, 8px)',
                    fontWeight: 700,
                    color: '#FFF',
                    padding: '0 3px',
                    flexShrink: 0,
                  }}
                >
                  {notif.badge > 99 ? '99+' : notif.badge}
                </div>
              </div>
            )
          })}
        </div>

        {/* Home indicator bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(80px, 18vw, 130px)',
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 100,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    let opacity = 1
    let scale = 1
    let translateY = 0
    let badgeScale = 0

    if (phase === 'enter') {
      // Slides down like a notification banner, bounces in
      const t = enterProgress
      translateY = -(1 - t) * 40
      opacity = Math.min(1, t * 2.5)
      scale = 0.85 + t * 0.15
      badgeScale = Math.min(1, Math.max(0, (t - 0.6) * 5))
    } else if (phase === 'hold') {
      // Subtle notification pulse
      const pulse = 1 + Math.sin(f * 0.1) * 0.008
      scale = pulse
      badgeScale = 1
    } else {
      // Slide up and out like dismissed notification
      translateY = -exitProgress * 50
      opacity = 1 - exitProgress * 1.5
      badgeScale = Math.max(0, 1 - exitProgress * 2)
    }

    // Badge count — increases with frame for drama
    const badgeCount = Math.min(99, 1 + Math.floor(f * 0.3))

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '50%',
          transform: `translateX(-50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          width: 'clamp(180px, 55vw, 420px)',
        }}
      >
        {/* Notification banner chrome wrapping the word */}
        <div
          style={{
            background: 'rgba(25, 25, 25, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 14,
            padding: 'clamp(8px, 2vw, 16px) clamp(10px, 2.5vw, 20px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            position: 'relative',
          }}
        >
          {/* App icon */}
          <div
            style={{
              width: 'clamp(28px, 5.5vw, 44px)',
              height: 'clamp(28px, 5.5vw, 44px)',
              borderRadius: 10,
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 'clamp(14px, 2.8vw, 22px)',
            }}
          >
            🔔
          </div>

          {/* Word */}
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
              fontSize: 'clamp(24px, 6vw, 86px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: -1,
              flex: 1,
            }}
          >
            {word}
          </div>

          {/* Animated badge */}
          <div
            style={{
              position: 'absolute',
              top: -8,
              right: -6,
              background: '#FF3B30',
              borderRadius: 100,
              minWidth: 'clamp(18px, 3.5vw, 28px)',
              height: 'clamp(18px, 3.5vw, 28px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(8px, 1.5vw, 12px)',
              fontWeight: 800,
              color: '#FFF',
              padding: '0 4px',
              transform: `scale(${badgeScale})`,
              border: '2px solid rgba(25,25,25,0.95)',
            }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </div>
        </div>
      </div>
    )
  },
}

function NotificationFloodComponent(props: MotionGraphicProps<NotificationFloodConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-notification-flood',
  title: 'Kinetic Notification Flood',
  description:
    'iOS/Android notification banner flood — app notifications cascade down the screen as the main word appears in its own banner with an animated red badge counter',
  tags: ['kinetic', 'typography', 'notifications', 'ios', 'android', 'banner', 'badge', 'ui', 'digital'],
  category: 'captions',
  component: NotificationFloodComponent as any,
  defaultConfig: {
    words: ['VIRAL', 'TRENDING', 'BREAKING', 'LIVE'],
    colors: ['#FF3B30', '#34C759', '#007AFF', '#FF9500'],
    bgColor: '#000000',
    cycleDuration: 2.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['VIRAL', 'TRENDING', 'BREAKING', 'LIVE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF3B30', '#34C759', '#007AFF', '#FF9500'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
