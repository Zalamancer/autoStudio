import { generateId } from '@/utils/idGenerator'

describe('generateId', () => {
  describe('uniqueness', () => {
    it('generates unique IDs across multiple calls', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })

    it('generates unique IDs with the same prefix', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 50; i++) {
        ids.add(generateId('test'))
      }
      expect(ids.size).toBe(50)
    })
  })

  describe('prefix', () => {
    it('includes the prefix when provided', () => {
      const id = generateId('layer')
      expect(id).toMatch(/^layer-/)
    })

    it('starts with timestamp when no prefix is provided', () => {
      const id = generateId()
      // Should start with a numeric timestamp (no prefix dash at start)
      expect(id).toMatch(/^\d+/)
      expect(id).not.toMatch(/^[a-z]+-/)
    })

    it('supports different prefix values', () => {
      expect(generateId('kf')).toMatch(/^kf-/)
      expect(generateId('track')).toMatch(/^track-/)
      expect(generateId('shape')).toMatch(/^shape-/)
    })
  })

  describe('format', () => {
    it('contains a timestamp component', () => {
      const before = Date.now()
      const id = generateId()
      const after = Date.now()

      // Extract the timestamp portion (first segment before the random part)
      const timestampStr = id.split('-')[0]
      const timestamp = parseInt(timestampStr, 10)

      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('contains a random alphanumeric suffix', () => {
      const id = generateId()
      // Format: timestamp-random
      const parts = id.split('-')
      expect(parts.length).toBe(2)
      // Random part should be alphanumeric (base36)
      expect(parts[1]).toMatch(/^[a-z0-9]+$/)
    })

    it('has a random suffix of 6 characters', () => {
      const id = generateId()
      const parts = id.split('-')
      expect(parts[1].length).toBe(6)
    })

    it('with prefix has format: prefix-timestamp-random', () => {
      const id = generateId('obj')
      const parts = id.split('-')
      expect(parts.length).toBe(3)
      expect(parts[0]).toBe('obj')
      expect(parts[1]).toMatch(/^\d+$/)
      expect(parts[2]).toMatch(/^[a-z0-9]+$/)
    })
  })
})
