import type {
  FreepikSearchRequest,
  FreepikAsset,
  ImageStoryStyle,
} from '@/types/imageStory'

const STYLE_MODIFIERS: Record<ImageStoryStyle, string[]> = {
  Cartoon: ['cartoon', 'illustration'],
  Realistic: ['photo', 'stock'],
  Minimalist: ['flat', 'minimal', 'icon'],
  Watercolor: ['watercolor', 'painted'],
  Flat: ['flat design', '2d'],
  '3D Render': ['3d render', 'isometric'],
}

export async function searchFreepik(
  request: FreepikSearchRequest,
): Promise<FreepikAsset[]> {
  const res = await fetch('/api/proxy/freepik/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    console.warn(`[freepik] Search failed for "${request.query}": ${res.status}`)
    return []
  }

  const data = await res.json()
  return data.results || []
}

export async function searchWithFallback(
  searchTerm: string,
  assetType: FreepikSearchRequest['assetType'],
  style: ImageStoryStyle,
  transparency = false,
): Promise<FreepikAsset[]> {
  // Attempt 1: with style modifier
  const styleModifier = STYLE_MODIFIERS[style]?.[0] || ''
  let results = await searchFreepik({
    query: `${searchTerm} ${styleModifier}`.trim(),
    assetType,
    style,
    transparency,
    limit: 5,
  })

  if (results.length >= 2) return results

  // Attempt 2: without style modifier
  results = await searchFreepik({
    query: searchTerm,
    assetType,
    transparency,
    limit: 5,
  })

  if (results.length >= 2) return results

  // Attempt 3: simplified term (first word only)
  const simplified = searchTerm.split(' ')[0]
  if (simplified !== searchTerm) {
    results = await searchFreepik({
      query: simplified,
      assetType,
      transparency,
      limit: 5,
    })
  }

  return results
}

export function getSearchTerm(
  baseTerm: string,
  type: 'background' | 'element' | 'character',
): string {
  switch (type) {
    case 'background':
      return `${baseTerm} background scene`
    case 'character':
      return `${baseTerm} character`
    case 'element':
    default:
      return baseTerm
  }
}
