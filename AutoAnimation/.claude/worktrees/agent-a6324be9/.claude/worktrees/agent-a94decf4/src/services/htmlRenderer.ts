/**
 * Render HTML content to a static image using SVG foreignObject.
 * Zero external dependencies — uses only native browser APIs.
 */

/**
 * Render HTML string to a PNG data URL via SVG foreignObject + Canvas.
 */
export async function renderHTMLToImage(
  htmlContent: string,
  width: number,
  height: number,
): Promise<string> {
  // Wrap HTML in SVG foreignObject
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;">
          ${htmlContent}
        </div>
      </foreignObject>
    </svg>
  `

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to render HTML to image'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Generate a small thumbnail from HTML content (400x300).
 */
export async function generateHTMLThumbnail(
  htmlContent: string,
): Promise<string> {
  return renderHTMLToImage(htmlContent, 400, 300)
}
