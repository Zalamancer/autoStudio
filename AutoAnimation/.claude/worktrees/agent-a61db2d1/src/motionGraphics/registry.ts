import type { MotionGraphicRegistration } from '@/types/motionGraphic'

const registry = new Map<string, MotionGraphicRegistration>()

export function registerMotionGraphic(reg: MotionGraphicRegistration): void {
  registry.set(reg.id, reg)
}

export function getMotionGraphic(id: string): MotionGraphicRegistration | undefined {
  return registry.get(id)
}

export function getAllMotionGraphics(): MotionGraphicRegistration[] {
  return Array.from(registry.values())
}

export function getMotionGraphicsByCategory(category: string): MotionGraphicRegistration[] {
  return Array.from(registry.values()).filter((r) => r.category === category)
}
