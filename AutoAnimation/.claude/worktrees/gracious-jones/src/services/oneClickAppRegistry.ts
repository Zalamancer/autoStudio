import { ALL_APPS } from '@/data/apps'
import type { OneClickApp, AppCategory } from '@/types/oneClickApp'

export function getAllApps(): OneClickApp[] {
  return ALL_APPS
}

export function getAppsByCategory(category: AppCategory): OneClickApp[] {
  return ALL_APPS.filter((app) => app.category === category)
}

export function getAppById(id: string): OneClickApp | undefined {
  return ALL_APPS.find((app) => app.id === id)
}

export function searchApps(query: string): OneClickApp[] {
  const q = query.toLowerCase().trim()
  if (!q) return ALL_APPS
  return ALL_APPS.filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.tags.some((tag) => tag.includes(q))
  )
}

export function buildPromptFromApp(
  app: OneClickApp,
  inputs: Record<string, any>
): string {
  const parts: string[] = []

  if (app.orchestratorConfig.defaultPrompt) {
    parts.push(app.orchestratorConfig.defaultPrompt)
  }

  for (const field of app.inputFields) {
    const value = inputs[field.id]
    if (value != null && value !== '') {
      if (field.type === 'image') {
        parts.push(`[${field.label}: image provided]`)
      } else if (field.type === 'toggle') {
        if (value) parts.push(`Enable ${field.label}`)
      } else {
        parts.push(`${field.label}: ${value}`)
      }
    }
  }

  return parts.join('\n')
}

export const APP_CATEGORIES: { id: AppCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'camera', label: 'Camera' },
  { id: 'enhance', label: 'Enhance' },
  { id: 'face', label: 'Face' },
  { id: 'ads', label: 'Ads' },
  { id: 'games', label: 'Games' },
  { id: 'editing', label: 'Editing' },
  { id: 'asmr', label: 'ASMR' },
  { id: 'trending', label: 'Trending' },
  { id: 'extras', label: 'Extras' },
  { id: 'education', label: 'Education' },
]
