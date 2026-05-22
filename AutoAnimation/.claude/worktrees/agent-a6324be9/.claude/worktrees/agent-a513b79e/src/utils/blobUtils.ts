/**
 * Centralized blob/base64/data-URL conversion utilities.
 *
 * Replaces duplicate implementations in recraft.ts, character3dDB.ts,
 * useSpriteBackgroundRemoval.ts, Remotion3DCharacter.tsx, etc.
 */

/** Read a Blob as a full data-URL string (e.g. `data:image/png;base64,…`). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'))
    reader.readAsDataURL(blob)
  })
}

/** Read a Blob and return only the raw base64 payload (no data-URL prefix). */
export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await blobToDataUrl(blob)
  return dataUrl.split(',')[1] || dataUrl
}

/** Convert a data-URL string back into a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const bstr = atob(parts[1])
  const u8arr = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}

/** Convert a raw base64 string (no data-URL prefix) to a blob URL. */
export function base64ToBlobUrl(base64: string, mimeType = 'application/octet-stream'): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })
  return URL.createObjectURL(blob)
}

/**
 * Centralized blob URL manager that tracks and revokes object URLs to prevent
 * memory leaks. Use `create()` instead of `URL.createObjectURL()` and call
 * `revoke()` when done, or use `swap()` to atomically replace an old URL.
 */
export const blobURLManager = {
  _urls: new Set<string>(),

  /** Create a tracked blob URL. */
  create(blob: Blob): string {
    const url = URL.createObjectURL(blob)
    this._urls.add(url)
    return url
  },

  /** Revoke a previously created blob URL. Safe to call with null/undefined. */
  revoke(url: string | null | undefined): void {
    if (!url) return
    if (this._urls.has(url)) {
      URL.revokeObjectURL(url)
      this._urls.delete(url)
    } else if (url.startsWith('blob:')) {
      // Also handle URLs not tracked by us (for migration)
      URL.revokeObjectURL(url)
    }
  },

  /** Revoke old URL and create a new one atomically. */
  swap(oldUrl: string | null | undefined, newBlob: Blob): string {
    this.revoke(oldUrl)
    return this.create(newBlob)
  },
}
