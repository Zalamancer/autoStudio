import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DeploySuccessConfig extends KineticBaseConfig {}

// CI/CD pipeline stages
const PIPELINE_STAGES = [
  { label: 'install', icon: '⬇', color: '#79c0ff' },
  { label: 'lint', icon: '◈', color: '#f0883e' },
  { label: 'test', icon: '✓', color: '#56d364' },
  { label: 'build', icon: '⚙', color: '#79c0ff' },
  { label: 'deploy', icon: '🚀', color: '#56d364' },
]

function seeded(n: number) {
  const x = Math.sin(n * 6173 + 1291) * 8191
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* GitHub Actions style header */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 32,
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 8,
          }}
        >
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            github.com / actions / runs
          </span>
          <span
            style={{
              marginLeft: 'auto',
              paddingRight: 12,
              fontFamily: "'Fira Code', monospace",
              fontSize: 11,
              color: 'rgba(86,211,100,0.4)',
            }}
          >
            ● passed
          </span>
        </div>

        {/* Pipeline stage indicators */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          {PIPELINE_STAGES.map((stage, i) => {
            const stageTime = time - i * 0.3
            const done = stageTime > 0
            const running = stageTime > 0 && stageTime < 0.4
            const spinAngle = running ? (frame * 6) % 360 : 0

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    opacity: done ? 0.15 : 0.05,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: done ? stage.color : 'rgba(255,255,255,0.3)',
                      transform: `rotate(${spinAngle}deg)`,
                      display: 'inline-block',
                    }}
                  >
                    {stage.icon}
                  </span>
                  <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                    {stage.label}
                  </span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div
                    style={{
                      width: 24,
                      height: 1,
                      background: done ? 'rgba(86,211,100,0.2)' : 'rgba(255,255,255,0.05)',
                      margin: '0 4px',
                      marginBottom: 14,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Log output lines in background */}
        {Array.from({ length: 6 }, (_, i) => {
          const logLines = [
            '> npm ci --prefix ./app',
            '> eslint src/**/*.ts --fix',
            '> jest --coverage --ci',
            '> vite build --mode production',
            '> docker push registry/app:latest',
            '✓ Deployment complete in 47s',
          ]
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 14,
                bottom: 28 + i * 16,
                fontFamily: "'Fira Code', monospace",
                fontSize: 9,
                color: 'rgba(255,255,255,0.05)',
                whiteSpace: 'nowrap',
              }}
            >
              {logLines[i]}
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Pipeline stages tick off one by one as enter progresses
      const stagesVisible = Math.floor(enterProgress * (PIPELINE_STAGES.length + 1))
      const wordAppearAt = 0.8
      const wordProgress = Math.max(0, (enterProgress - wordAppearAt) / (1 - wordAppearAt))

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          {/* Pipeline steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {PIPELINE_STAGES.map((stage, i) => {
              const isComplete = i < stagesVisible
              const isRunning = i === stagesVisible - 1
              const spinAngle = isRunning ? (f * 5) % 360 : 0

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 'clamp(10px, 2.5vw, 28px)',
                      color: isComplete ? stage.color : 'rgba(255,255,255,0.2)',
                      transform: `rotate(${spinAngle}deg)`,
                      display: 'inline-block',
                    }}
                  >
                    {isComplete ? '✓' : '○'}
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(9px, 2vw, 22px)',
                      color: isComplete ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {stage.label}
                  </span>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 'clamp(9px, 2vw, 22px)' }}>›</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Word fading in */}
          {wordProgress > 0 && (
            <div
              style={{
                opacity: wordProgress,
                fontSize: 'clamp(24px, 7vw, 90px)',
                fontWeight: 700,
                color,
                textShadow: `0 0 14px ${color}50`,
              }}
            >
              {word}
            </div>
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // All checks green, SUCCESS banner, word glowing
      const pulse = 0.9 + Math.sin(f * 0.1) * 0.1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          {/* All green pipeline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 'clamp(10px, 2.5vw, 28px)', color: '#56d364' }}>✓</span>
                <span style={{ fontSize: 'clamp(9px, 2vw, 22px)', color: 'rgba(86,211,100,0.6)' }}>
                  {stage.label}
                </span>
                {i < PIPELINE_STAGES.length - 1 && (
                  <span style={{ color: 'rgba(86,211,100,0.3)', fontSize: 'clamp(9px, 2vw, 22px)' }}>›</span>
                )}
              </div>
            ))}
          </div>

          {/* SUCCESS label */}
          <div
            style={{
              fontSize: 'clamp(10px, 2.5vw, 28px)',
              color: '#56d364',
              letterSpacing: 4,
              opacity: 0.8,
              fontWeight: 700,
            }}
          >
            ● DEPLOY SUCCESSFUL
          </div>

          {/* The word — the thing that was deployed */}
          <div
            style={{
              fontSize: 'clamp(28px, 8vw, 110px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 ${16 * pulse}px ${color}60, 0 0 30px ${color}30`,
              letterSpacing: 2,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontSize: 'clamp(28px, 8vw, 110px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function DeploySuccessComponent(props: MotionGraphicProps<DeploySuccessConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-deploy-success',
  title: 'Kinetic Deploy Success',
  description:
    'CI/CD GitHub Actions pipeline: install → lint → test → build → deploy stages tick green, then DEPLOY SUCCESSFUL banner with the word revealed',
  tags: ['kinetic', 'typography', 'cicd', 'deploy', 'github', 'devops', 'pipeline', 'developer', 'tech'],
  category: 'captions',
  component: DeploySuccessComponent as any,
  defaultConfig: {
    words: ['SHIPPED', 'LIVE', 'LAUNCHED', 'DEPLOYED'],
    colors: ['#56d364', '#56d364', '#56d364', '#56d364'],
    bgColor: '#0d1117',
    cycleDuration: 2.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHIPPED', 'LIVE', 'LAUNCHED', 'DEPLOYED'], group: 'Content' },
    { key: 'colors', label: 'Success Color', type: 'text-array', defaultValue: ['#56d364'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1117', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.6, min: 1, max: 7, group: 'Timing' },
  ],
})
