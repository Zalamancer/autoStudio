import type { AIProviderHandler } from './types'
import { falHandler } from './falHandler'
import { replicateHandler } from './replicateHandler'

const handlers = new Map<string, AIProviderHandler>([
  [falHandler.providerId, falHandler],
  [replicateHandler.providerId, replicateHandler],
])

export function getHandler(providerId: string): AIProviderHandler | undefined {
  return handlers.get(providerId)
}

export function getConfiguredStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {}
  for (const [id, handler] of handlers) {
    status[id] = handler.isConfigured()
  }
  return status
}

export function getAllHandlerIds(): string[] {
  return Array.from(handlers.keys())
}

export type { AIProviderHandler, AIJobStatus } from './types'
