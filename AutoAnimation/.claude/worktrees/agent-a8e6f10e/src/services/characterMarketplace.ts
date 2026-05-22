/**
 * Shared helper for auto-publishing characters to the marketplace.
 * Called from all 4 character stores after successful cloud push.
 */
import { createListing } from './marketplaceService'
import type { MarketplaceListingCategory } from '@/types/marketplace'

export async function publishCharacterToMarketplace(opts: {
  characterId: string
  characterType: '2d' | '3d' | '1d' | 'avatar'
  name: string
  description: string
  thumbnailDataUrl?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const category: MarketplaceListingCategory =
      opts.characterType === '3d' ? '3d-characters' : 'characters'

    // Build the asset URL referencing the cloud storage path
    const prefixMap: Record<string, string> = {
      '2d': 'characters',
      '3d': '3d-characters',
      '1d': 'pixelart',
      avatar: 'avatar',
    }
    const prefix = prefixMap[opts.characterType] || opts.characterType
    const assetUrl = `characters/${prefix}/${opts.characterId}.json`

    await createListing({
      title: opts.name || `${opts.characterType.toUpperCase()} Character`,
      description: opts.description || `A ${opts.characterType} character`,
      category,
      asset_url: assetUrl,
      thumbnail_url: opts.thumbnailDataUrl?.slice(0, 50_000) || undefined,
      metadata: {
        characterType: opts.characterType,
        characterId: opts.characterId,
        ...opts.metadata,
      },
    })
  } catch {
    // Marketplace publishing is non-critical — fail silently
  }
}
