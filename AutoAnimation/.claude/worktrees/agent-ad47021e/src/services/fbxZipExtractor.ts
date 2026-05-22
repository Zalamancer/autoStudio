/**
 * Extract FBX + texture files from a ZIP archive or folder upload.
 * Produces a unified FBXBundleContents that fbxConverter can consume.
 *
 * Texture blob URLs are stored under EVERY possible path key that FBXLoader
 * might use to reference a texture:
 * - Exact basename (original + lowercase)
 * - Full ZIP/folder relative path (forward + backslash variants)
 * - All sub-path prefixes (handles FBX relative refs from any directory depth)
 * - Filename stem without extension (for cross-extension matching)
 */

const LOG = '[FBXZipExtractor]'

/** Supported texture file extensions */
const TEXTURE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'bmp', 'tga', 'tif', 'tiff', 'webp',
])

/** Result of extracting an FBX bundle (ZIP or folder) */
export interface FBXBundleContents {
  /** The FBX file as an ArrayBuffer */
  fbxBuffer: ArrayBuffer
  /** The original FBX filename */
  fbxFilename: string
  /** Map of texture path keys to blob URLs.
   *  Each texture is stored under many keys for aggressive matching. */
  textureBlobUrls: Map<string, string>
}

function getExtension(name: string): string {
  return (name.split('.').pop() || '').toLowerCase()
}

function getBasename(path: string): string {
  return path.split('/').pop()?.split('\\').pop() || path
}

/**
 * Register a texture under every possible key that FBXLoader might use.
 * FBX files store texture references with wildly varying path formats
 * (Windows absolute, relative with backslashes, relative with forward slashes,
 * bare filename, etc.), and FBXLoader only strips backslashes — not forward
 * slashes. So we store under ALL possible variants to maximize matches.
 */
function registerTexture(
  map: Map<string, string>,
  filePath: string,
  blobUrl: string,
): void {
  const basename = getBasename(filePath)
  const lowerBasename = basename.toLowerCase()
  const stem = lowerBasename.replace(/\.[^.]+$/, '')

  // 1. Exact basename (original + lowercase)
  map.set(basename, blobUrl)
  map.set(lowerBasename, blobUrl)

  // 2. Full path variants
  map.set(filePath, blobUrl)
  map.set(filePath.toLowerCase(), blobUrl)

  // 3. Path with backslashes (FBX stores Windows paths)
  const backslashPath = filePath.replace(/\//g, '\\')
  map.set(backslashPath, blobUrl)
  map.set(backslashPath.toLowerCase(), blobUrl)

  // 4. All sub-path slices — handles FBX relative refs from any directory depth.
  //    If ZIP has "ModelFolder/textures/diffuse.png" and FBX references
  //    "textures/diffuse.png" or just "diffuse.png", both will match.
  const parts = filePath.split('/')
  for (let i = 1; i < parts.length; i++) {
    const subPath = parts.slice(i).join('/')
    map.set(subPath, blobUrl)
    map.set(subPath.toLowerCase(), blobUrl)
    const subPathBackslash = subPath.replace(/\//g, '\\')
    map.set(subPathBackslash, blobUrl)
    map.set(subPathBackslash.toLowerCase(), blobUrl)
  }

  // 5. Stem only (without extension) — cross-extension matching
  //    FBX may reference "diffuse.png" but ZIP has "diffuse.tga"
  if (stem.length > 0) {
    map.set(stem, blobUrl)
  }
}

/**
 * Extract FBX + textures from a ZIP file.
 */
export async function extractFbxFromZip(zipBlob: Blob): Promise<FBXBundleContents> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(zipBlob)

  let fbxBuffer: ArrayBuffer | null = null
  let fbxFilename = ''
  const textureBlobUrls = new Map<string, string>()
  let textureCount = 0

  const entries = Object.entries(zip.files).filter(([, f]) => !f.dir)
  console.log(LOG, `ZIP contains ${entries.length} files`)

  for (const [path, zipEntry] of entries) {
    const basename = getBasename(path)
    const ext = getExtension(basename)

    if (ext === 'fbx' && !fbxBuffer) {
      fbxBuffer = await zipEntry.async('arraybuffer')
      fbxFilename = basename
      console.log(LOG, `Found FBX: ${basename} (${(fbxBuffer.byteLength / 1024).toFixed(0)} KB)`)
    } else if (TEXTURE_EXTENSIONS.has(ext)) {
      const blob = await zipEntry.async('blob')
      const url = URL.createObjectURL(blob)
      registerTexture(textureBlobUrls, path, url)
      textureCount++
      console.log(LOG, `Found texture: ${path}`)
    }
  }

  if (!fbxBuffer) {
    // Clean up blob URLs
    const revoked = new Set<string>()
    textureBlobUrls.forEach((url) => {
      if (!revoked.has(url)) { URL.revokeObjectURL(url); revoked.add(url) }
    })
    throw new Error('No .fbx file found in ZIP archive')
  }

  console.log(LOG, `Extracted: 1 FBX + ${textureCount} texture(s) (${textureBlobUrls.size} lookup keys)`)
  return { fbxBuffer, fbxFilename, textureBlobUrls }
}

/**
 * Collect FBX + textures from a folder FileList (webkitdirectory).
 */
export async function collectFbxFromFolder(files: FileList): Promise<FBXBundleContents> {
  let fbxFile: File | null = null
  const textureBlobUrls = new Map<string, string>()
  let textureCount = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const basename = file.name
    const ext = getExtension(basename)
    // webkitRelativePath includes the folder structure, e.g. "MyModel/textures/diffuse.png"
    const relativePath = (file as any).webkitRelativePath || basename

    if (ext === 'fbx' && !fbxFile) {
      fbxFile = file
      console.log(LOG, `Found FBX: ${basename} (${(file.size / 1024).toFixed(0)} KB)`)
    } else if (TEXTURE_EXTENSIONS.has(ext)) {
      const url = URL.createObjectURL(file)
      registerTexture(textureBlobUrls, relativePath, url)
      textureCount++
      console.log(LOG, `Found texture: ${relativePath}`)
    }
  }

  if (!fbxFile) {
    const revoked = new Set<string>()
    textureBlobUrls.forEach((url) => {
      if (!revoked.has(url)) { URL.revokeObjectURL(url); revoked.add(url) }
    })
    throw new Error('No .fbx file found in the selected folder')
  }

  const fbxBuffer = await fbxFile.arrayBuffer()
  console.log(LOG, `Collected: 1 FBX + ${textureCount} texture(s) (${textureBlobUrls.size} lookup keys)`)
  return { fbxBuffer, fbxFilename: fbxFile.name, textureBlobUrls }
}

/**
 * Revoke all blob URLs in a bundle to free memory.
 * Call after FBX→GLB conversion is complete.
 */
export function cleanupBundleBlobUrls(bundle: FBXBundleContents): void {
  const revoked = new Set<string>()
  bundle.textureBlobUrls.forEach((url) => {
    if (!revoked.has(url)) {
      URL.revokeObjectURL(url)
      revoked.add(url)
    }
  })
  bundle.textureBlobUrls.clear()
  console.log(LOG, `Cleaned up ${revoked.size} blob URL(s)`)
}
