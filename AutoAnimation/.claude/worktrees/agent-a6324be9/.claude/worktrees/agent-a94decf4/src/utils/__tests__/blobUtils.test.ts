import { dataUrlToBlob, blobToDataUrl, blobToBase64 } from '@/utils/blobUtils'

describe('dataUrlToBlob', () => {
  it('extracts the correct MIME type from a PNG data URL', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo='
    const blob = dataUrlToBlob(dataUrl)
    expect(blob.type).toBe('image/png')
  })

  it('extracts the correct MIME type from a JPEG data URL', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQ'
    const blob = dataUrlToBlob(dataUrl)
    expect(blob.type).toBe('image/jpeg')
  })

  it('falls back to application/octet-stream for malformed MIME', () => {
    // No proper MIME in the prefix
    const dataUrl = 'data:;base64,dGVzdA=='
    const blob = dataUrlToBlob(dataUrl)
    expect(blob.type).toBe('application/octet-stream')
  })

  it('produces a blob with the correct binary size', () => {
    // "Hello" in base64 is "SGVsbG8="
    const dataUrl = 'data:text/plain;base64,SGVsbG8='
    const blob = dataUrlToBlob(dataUrl)
    // "Hello" is 5 bytes
    expect(blob.size).toBe(5)
  })

  it('correctly decodes binary data', async () => {
    // "test" in base64 is "dGVzdA=="
    const dataUrl = 'data:text/plain;base64,dGVzdA=='
    const blob = dataUrlToBlob(dataUrl)

    const arrayBuffer = await blob.arrayBuffer()
    const text = new TextDecoder().decode(arrayBuffer)
    expect(text).toBe('test')
  })
})

describe('blobToDataUrl', () => {
  it('converts a text blob to a data URL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' })
    const dataUrl = await blobToDataUrl(blob)

    expect(dataUrl).toMatch(/^data:text\/plain;base64,/)
  })

  it('converts an empty blob', async () => {
    const blob = new Blob([], { type: 'application/octet-stream' })
    const dataUrl = await blobToDataUrl(blob)

    expect(dataUrl).toMatch(/^data:/)
  })

  it('preserves MIME type in the data URL', async () => {
    const blob = new Blob(['{}'], { type: 'application/json' })
    const dataUrl = await blobToDataUrl(blob)

    expect(dataUrl).toContain('application/json')
  })
})

describe('blobToBase64', () => {
  it('returns only the base64 payload without the data URL prefix', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' })
    const base64 = await blobToBase64(blob)

    // Should not contain "data:" prefix
    expect(base64).not.toContain('data:')
    expect(base64).not.toContain(';base64,')

    // "test" in base64 is "dGVzdA=="
    expect(base64).toBe('dGVzdA==')
  })
})

describe('roundtrip: blob → dataUrl → blob', () => {
  it('preserves text content through a roundtrip', async () => {
    const original = 'Hello, world!'
    const blob1 = new Blob([original], { type: 'text/plain' })

    const dataUrl = await blobToDataUrl(blob1)
    const blob2 = dataUrlToBlob(dataUrl)

    const arrayBuffer = await blob2.arrayBuffer()
    const result = new TextDecoder().decode(arrayBuffer)
    expect(result).toBe(original)
  })

  it('preserves binary content through a roundtrip', async () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 255])
    const blob1 = new Blob([bytes], { type: 'application/octet-stream' })

    const dataUrl = await blobToDataUrl(blob1)
    const blob2 = dataUrlToBlob(dataUrl)

    const arrayBuffer = await blob2.arrayBuffer()
    const result = new Uint8Array(arrayBuffer)
    expect(Array.from(result)).toEqual(Array.from(bytes))
  })

  it('preserves MIME type through a roundtrip', async () => {
    const blob1 = new Blob(['<svg></svg>'], { type: 'image/svg+xml' })

    const dataUrl = await blobToDataUrl(blob1)
    const blob2 = dataUrlToBlob(dataUrl)

    expect(blob2.type).toBe('image/svg+xml')
  })
})
