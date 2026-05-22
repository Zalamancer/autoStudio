import { describe, it, expect } from 'vitest'
import { resolveSpritePart, resolveAllSprites } from '../spriteResolver'

describe('resolveSpritePart', () => {
  it('returns selected sprite when index is valid', () => {
    expect(resolveSpritePart(['a.png', 'b.png', 'c.png'], 1)).toBe('b.png')
  })

  it('returns first image when selected index is null', () => {
    expect(resolveSpritePart(['a.png', 'b.png'], null)).toBe('a.png')
  })

  it('returns first image when selected index is out of bounds', () => {
    expect(resolveSpritePart(['a.png'], 5)).toBe('a.png')
  })

  it('returns null when no images available', () => {
    expect(resolveSpritePart([], null)).toBeNull()
    expect(resolveSpritePart([], 0)).toBeNull()
  })
})

describe('resolveAllSprites', () => {
  const savedImages = {
    eye: ['eye1.png'],
    eyebrow: ['brow1.png', 'brow2.png'],
    hair: ['hair1.png'],
    body: ['body1.png'],
    head: ['head1.png'],
    shirt: [],
    pants: [],
    shoes: ['shoe1.png'],
  }

  const selectedSprites = {
    eye: 0 as number | null,
    eyebrow: 1 as number | null,
    hair: null as number | null,
    body: null as number | null,
    head: 0 as number | null,
    shirt: null as number | null,
    pants: null as number | null,
    shoes: null as number | null,
  }

  it('resolves all parts correctly', () => {
    const result = resolveAllSprites(savedImages, selectedSprites)
    expect(result.eye).toBe('eye1.png')
    expect(result.eyebrow).toBe('brow2.png')
    expect(result.hair).toBe('hair1.png')
    expect(result.body).toBe('body1.png')
    expect(result.head).toBe('head1.png')
    expect(result.shirt).toBeNull()
    expect(result.pants).toBeNull()
    expect(result.shoes).toBe('shoe1.png')
  })
})
