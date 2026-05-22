import type { MotionDesignPlan } from '@/types/faceSwap'

interface MotionBlock {
  type: 'reveal' | 'slide' | 'bounce' | 'fade' | 'scale' | 'rotate' | 'typewriter' | 'wave'
  text?: string
  duration?: number
  delay?: number
  easing?: string
  direction?: 'left' | 'right' | 'up' | 'down'
  properties?: Record<string, number | string>
}

function parseMotionCode(code: string): MotionBlock[] {
  const blocks: MotionBlock[] = []
  const lines = code.trim().split('\n').filter((l) => l.trim())

  for (const line of lines) {
    const trimmed = line.trim()

    // Parse motion commands like: reveal "Hello World" 1s ease-out
    const match = trimmed.match(/^(\w+)\s*(?:"([^"]*)")?\s*(?:(\d+(?:\.\d+)?)\s*s?)?\s*(?:(ease-in|ease-out|ease-in-out|linear|bounce|spring))?\s*(?:(left|right|up|down))?/i)
    if (match) {
      const [, type, text, duration, easing, direction] = match
      const normalizedType = type.toLowerCase() as MotionBlock['type']
      const validTypes = ['reveal', 'slide', 'bounce', 'fade', 'scale', 'rotate', 'typewriter', 'wave']

      if (validTypes.includes(normalizedType)) {
        blocks.push({
          type: normalizedType,
          text: text || undefined,
          duration: duration ? parseFloat(duration) : 1,
          easing: easing || 'ease-out',
          direction: direction as MotionBlock['direction'] || undefined,
        })
      }
    }
  }

  return blocks
}

function blockToKeyframes(block: MotionBlock, startTime: number, _fps: number): Array<{
  time: number
  properties: Record<string, number | string>
  easing: string
}> {
  const duration = block.duration ?? 1
  const easing = block.easing ?? 'ease-out'
  const keyframes: Array<{
    time: number
    properties: Record<string, number | string>
    easing: string
  }> = []

  switch (block.type) {
    case 'reveal':
      keyframes.push(
        { time: startTime, properties: { opacity: 0, scale: 0.8 }, easing },
        { time: startTime + duration, properties: { opacity: 1, scale: 1 }, easing }
      )
      break
    case 'slide': {
      const dir = block.direction ?? 'left'
      const offset = dir === 'left' || dir === 'right' ? 'translateX' : 'translateY'
      const sign = dir === 'left' || dir === 'up' ? -100 : 100
      keyframes.push(
        { time: startTime, properties: { [offset]: sign, opacity: 0 }, easing },
        { time: startTime + duration, properties: { [offset]: 0, opacity: 1 }, easing }
      )
      break
    }
    case 'bounce':
      keyframes.push(
        { time: startTime, properties: { translateY: -50, opacity: 0 }, easing: 'bounce' },
        { time: startTime + duration * 0.6, properties: { translateY: 10, opacity: 1 }, easing: 'bounce' },
        { time: startTime + duration * 0.8, properties: { translateY: -5, opacity: 1 }, easing: 'bounce' },
        { time: startTime + duration, properties: { translateY: 0, opacity: 1 }, easing: 'bounce' }
      )
      break
    case 'fade':
      keyframes.push(
        { time: startTime, properties: { opacity: 0 }, easing },
        { time: startTime + duration, properties: { opacity: 1 }, easing }
      )
      break
    case 'scale':
      keyframes.push(
        { time: startTime, properties: { scale: 0, opacity: 0 }, easing },
        { time: startTime + duration, properties: { scale: 1, opacity: 1 }, easing }
      )
      break
    case 'rotate':
      keyframes.push(
        { time: startTime, properties: { rotation: -180, opacity: 0 }, easing },
        { time: startTime + duration, properties: { rotation: 0, opacity: 1 }, easing }
      )
      break
    case 'typewriter':
      keyframes.push(
        { time: startTime, properties: { clipWidth: 0, opacity: 1 }, easing: 'linear' },
        { time: startTime + duration, properties: { clipWidth: 100, opacity: 1 }, easing: 'linear' }
      )
      break
    case 'wave':
      keyframes.push(
        { time: startTime, properties: { translateY: 20, opacity: 0 }, easing },
        { time: startTime + duration * 0.5, properties: { translateY: -10, opacity: 1 }, easing },
        { time: startTime + duration, properties: { translateY: 0, opacity: 1 }, easing }
      )
      break
  }

  return keyframes
}

export function generateVibeMotion(code: string, fps: number = 30): MotionDesignPlan {
  const blocks = parseMotionCode(code)
  const allKeyframes: MotionDesignPlan['keyframes'] = []

  let currentTime = 0
  for (const block of blocks) {
    const delay = block.delay ?? 0
    const blockKeyframes = blockToKeyframes(block, currentTime + delay, fps)
    allKeyframes.push(...blockKeyframes)
    currentTime += (block.duration ?? 1) + delay
  }

  return {
    keyframes: allKeyframes,
    duration: currentTime,
    fps,
  }
}
