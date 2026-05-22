/**
 * Brand Kit Service — Supabase persistence for brand kits.
 *
 * Handles CRUD operations, logo/watermark upload to Supabase Storage,
 * and brand extraction from URLs via Gemini vision.
 */

import type { BrandKit } from '@/types/brandKit'
import { supabase } from '@/services/supabase'
import { logger } from '@/utils/logger'
import { callGeminiProxy } from '@/services/aiProxy'
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_API_URL = GEMINI_MODEL // model name for callGeminiProxy

/**
 * Fetch all brand kits for the authenticated user from Supabase.
 */
export async function fetchUserBrandKits(userId: string): Promise<BrandKit[]> {
  try {
    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[brandKitService] Fetch error:', error)
      return []
    }

    return (data || []).map(dbRowToBrandKit)
  } catch (err) {
    logger.error('[brandKitService] Fetch exception:', err)
    return []
  }
}

/**
 * Upsert (create or update) a brand kit in Supabase.
 */
export async function upsertBrandKit(kit: BrandKit): Promise<BrandKit> {
  const { id, logoUrl, watermarkUrl, createdAt: _createdAt, updatedAt: _updatedAt, userId, ...configFields } = kit

  try {
    const { data, error } = await supabase
      .from('brand_kits')
      .upsert(
        {
          id,
          user_id: userId || undefined,
          name: kit.name,
          config: configFields,
          logo_url: logoUrl || null,
          watermark_url: watermarkUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single()

    if (error) {
      logger.error('[brandKitService] Upsert error:', error)
      return kit
    }

    return dbRowToBrandKit(data)
  } catch (err) {
    logger.error('[brandKitService] Upsert exception:', err)
    return kit
  }
}

/**
 * Delete a brand kit from Supabase.
 */
export async function deleteBrandKit(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('brand_kits').delete().eq('id', id)
    if (error) {
      logger.error('[brandKitService] Delete error:', error)
    }
  } catch (err) {
    logger.error('[brandKitService] Delete exception:', err)
  }
}

/**
 * Upload a brand asset (logo or watermark) to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadBrandAsset(file: File, kitId: string, type: 'logo' | 'watermark'): Promise<string> {
  if (!supabase) {
    // Fallback to base64 for offline mode
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const ext = file.name.split('.').pop() || 'png'
  const path = `brand-assets/${kitId}/${type}.${ext}`

  try {
    const { error: uploadError } = await supabase.storage.from('brand-assets').upload(path, file, { upsert: true })

    if (uploadError) {
      logger.error('[brandKitService] Upload error:', uploadError)
      throw uploadError
    }

    const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    logger.error('[brandKitService] Upload exception:', err)
    // Fallback to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

/**
 * Extract brand identity (colors, fonts) from a website URL using Gemini vision.
 */
export async function extractBrandFromUrl(url: string): Promise<Partial<BrandKit>> {
  const prompt = `Analyze this website URL and extract the brand identity. URL: ${url}

Look at common patterns: primary color is usually the most prominent brand color, secondary might be used for buttons or accents, accent is typically used for highlights.

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "bgColor": "#hex",
  "headingFont": "font family name",
  "bodyFont": "font family name",
  "tone": "professional|casual|playful|energetic|luxury|minimalist|bold|friendly|corporate|creative"
}`

  try {
    const resp = await callGeminiProxy(GEMINI_API_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
    })

    if (!resp.ok) throw new Error('Gemini API error')

    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch[0])
    return {
      primaryColor: parsed.primaryColor || '#3B82F6',
      secondaryColor: parsed.secondaryColor || '#1E40AF',
      accentColor: parsed.accentColor || '#F59E0B',
      bgColor: parsed.bgColor,
      headingFont: parsed.headingFont || 'Inter',
      bodyFont: parsed.bodyFont || 'Inter',
      tone: parsed.tone || 'professional',
    }
  } catch (err) {
    logger.error('[brandKitService] Brand extraction failed:', err)
    throw err
  }
}

// ── Helpers ──

function dbRowToBrandKit(row: Record<string, unknown>): BrandKit {
  const config = (row.config as Record<string, unknown>) || {}
  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    name: row.name as string,
    primaryColor: (config.primaryColor as string) || '#3B82F6',
    secondaryColor: (config.secondaryColor as string) || '#1E40AF',
    accentColor: (config.accentColor as string) || '#F59E0B',
    bgColor: config.bgColor as string | undefined,
    headingFont: (config.headingFont as string) || 'Inter',
    bodyFont: (config.bodyFont as string) || 'Inter',
    logoUrl: row.logo_url as string | undefined,
    watermarkUrl: row.watermark_url as string | undefined,
    introTemplateId: config.introTemplateId as string | undefined,
    outroTemplateId: config.outroTemplateId as string | undefined,
    defaultVoiceId: config.defaultVoiceId as string | undefined,
    tone: (config.tone as string) || 'professional',
    captionPresetId: config.captionPresetId as string | undefined,
    captionStyle: config.captionStyle as BrandKit['captionStyle'],
    textOverlayDefaults: config.textOverlayDefaults as BrandKit['textOverlayDefaults'],
    shapeDefaults: config.shapeDefaults as BrandKit['shapeDefaults'],
    musicMood: config.musicMood as string | undefined,
    watermarkPosition: config.watermarkPosition as BrandKit['watermarkPosition'],
    watermarkOpacity: config.watermarkOpacity as number | undefined,
    customFontUrls: config.customFontUrls as string[] | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
