import { getSupabaseAdmin } from '../middleware/supabaseAuth'

interface TemplateCatalogEntry {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl: string | null
  motionDesignDescription: Record<string, unknown>
  configSchema: Array<Record<string, unknown>>
  defaultConfig: Record<string, unknown>
}

let cache: TemplateCatalogEntry[] | null = null
let cacheTime = 0
const CACHE_TTL_MS = 5 * 60 * 1000

export async function getTemplateCatalog(): Promise<TemplateCatalogEntry[]> {
  if (cache && Date.now() - cacheTime < CACHE_TTL_MS) return cache

  try {
    const supabase = getSupabaseAdmin()
    const { data: files, error } = await supabase.storage
      .from('template-definitions')
      .list('', { limit: 200 })

    if (error || !files || files.length === 0) {
      console.warn('[TemplateCatalog] No templates in storage, using empty catalog')
      cache = []
      cacheTime = Date.now()
      return cache
    }

    const entries: TemplateCatalogEntry[] = []
    for (const file of files) {
      if (!file.name.endsWith('.json')) continue
      try {
        const { data } = await supabase.storage.from('template-definitions').download(file.name)
        if (!data) continue
        const text = await data.text()
        const parsed = JSON.parse(text)
        entries.push({
          id: parsed.id || file.name.replace('.json', ''),
          title: parsed.name || 'Untitled',
          description: parsed.description || '',
          category: parsed.category || 'kinetic-typography',
          tags: parsed.tags || [],
          thumbnailUrl: parsed.thumbnailUrl || null,
          motionDesignDescription: parsed,
          configSchema: parsed.configSchema || [],
          defaultConfig: parsed.defaultConfig || {},
        })
      } catch (e) {
        console.error(`[TemplateCatalog] Failed to parse ${file.name}:`, e)
      }
    }

    cache = entries
    cacheTime = Date.now()
    return entries
  } catch (e) {
    console.error('[TemplateCatalog] Fetch error:', e)
    return cache || []
  }
}

export async function getTemplateById(id: string): Promise<TemplateCatalogEntry | undefined> {
  const catalog = await getTemplateCatalog()
  return catalog.find((t) => t.id === id)
}

export function invalidateCache(): void {
  cache = null
}
