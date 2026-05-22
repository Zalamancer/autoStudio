import { describe, it, expect } from 'vitest'
import { LipSyncProcessor } from '../lipSync'
import type { ElevenLabsAlignment, VisemeEvent } from '@/types/voice'

describe('LipSyncProcessor', () => {
  const processor = new LipSyncProcessor(30)

  describe('phoneme-to-viseme mapping', () => {
    it('maps vowel phonemes to correct visemes', () => {
      const mapping = LipSyncProcessor.getPhonemeMapping()
      expect(mapping.AA).toBe('Aa')
      expect(mapping.AE).toBe('Aa')
      expect(mapping.IY).toBe('Ee')
      expect(mapping.AO).toBe('O')
      expect(mapping.UW).toBe('U')
    })

    it('maps consonant phonemes to correct visemes', () => {
      const mapping = LipSyncProcessor.getPhonemeMapping()
      expect(mapping.M).toBe('M')
      expect(mapping.B).toBe('M')
      expect(mapping.P).toBe('M')
      expect(mapping.F).toBe('F')
      expect(mapping.V).toBe('F')
      expect(mapping.S).toBe('S')
      expect(mapping.D).toBe('D')
      expect(mapping.L).toBe('L')
      expect(mapping.W).toBe('W')
    })

    it('maps silence phonemes to Rest', () => {
      const mapping = LipSyncProcessor.getPhonemeMapping()
      expect(mapping.SIL).toBe('Rest')
      expect(mapping.SP).toBe('Rest')
      expect(mapping['']).toBe('Rest')
    })
  })

  describe('processAlignment', () => {
    it('returns empty array for empty alignment', () => {
      const alignment: ElevenLabsAlignment = {
        characters: [],
        character_start_times_seconds: [],
        character_end_times_seconds: [],
        phonemes: [],
        phoneme_start_times_seconds: [],
        phoneme_end_times_seconds: [],
      }
      const result = processor.processAlignment(alignment)
      expect(result).toEqual([])
    })

    it('processes phoneme alignment correctly', () => {
      const alignment: ElevenLabsAlignment = {
        characters: [],
        character_start_times_seconds: [],
        character_end_times_seconds: [],
        phonemes: ['HH', 'AY'],
        phoneme_start_times_seconds: [0.0, 0.1],
        phoneme_end_times_seconds: [0.1, 0.3],
      }
      const result = processor.processAlignment(alignment)
      expect(result.length).toBeGreaterThan(0)
      // HH -> Rest, AY -> Aa, so should produce at least these visemes
      const visemes = result.map((e) => e.viseme)
      expect(visemes).toContain('Aa')
    })

    it('processes character alignment as fallback', () => {
      const alignment: ElevenLabsAlignment = {
        characters: ['h', 'i'],
        character_start_times_seconds: [0.0, 0.1],
        character_end_times_seconds: [0.1, 0.3],
        phonemes: [],
        phoneme_start_times_seconds: [],
        phoneme_end_times_seconds: [],
      }
      const result = processor.processAlignment(alignment)
      expect(result.length).toBeGreaterThan(0)
    })

    it('merges consecutive same visemes', () => {
      const alignment: ElevenLabsAlignment = {
        characters: [],
        character_start_times_seconds: [],
        character_end_times_seconds: [],
        phonemes: ['AA', 'AE', 'AH'], // all map to 'Aa'
        phoneme_start_times_seconds: [0.0, 0.1, 0.2],
        phoneme_end_times_seconds: [0.1, 0.2, 0.3],
      }
      const result = processor.processAlignment(alignment)
      // All three map to 'Aa' — after merging should be a single event (possibly with transitions)
      const aaEvents = result.filter((e) => e.viseme === 'Aa')
      expect(aaEvents.length).toBe(1)
      expect(aaEvents[0].startTime).toBe(0)
      expect(aaEvents[0].endTime).toBe(0.3)
    })
  })

  describe('getVisemeAtFrame', () => {
    const timeline: VisemeEvent[] = [
      { viseme: 'Rest', startFrame: 0, endFrame: 3, startTime: 0, endTime: 0.1 },
      { viseme: 'Aa', startFrame: 3, endFrame: 9, startTime: 0.1, endTime: 0.3 },
      { viseme: 'M', startFrame: 9, endFrame: 12, startTime: 0.3, endTime: 0.4 },
    ]

    it('returns correct viseme at frame boundaries', () => {
      expect(processor.getVisemeAtFrame(timeline, 0)).toBe('Rest')
      expect(processor.getVisemeAtFrame(timeline, 3)).toBe('Aa')
      expect(processor.getVisemeAtFrame(timeline, 9)).toBe('M')
    })

    it('returns Rest for frames beyond timeline', () => {
      expect(processor.getVisemeAtFrame(timeline, 100)).toBe('Rest')
    })

    it('returns correct viseme mid-event', () => {
      expect(processor.getVisemeAtFrame(timeline, 5)).toBe('Aa')
    })
  })

  describe('getVisemeAtTime', () => {
    const timeline: VisemeEvent[] = [
      { viseme: 'Aa', startFrame: 0, endFrame: 9, startTime: 0.0, endTime: 0.3 },
      { viseme: 'Ee', startFrame: 9, endFrame: 15, startTime: 0.3, endTime: 0.5 },
    ]

    it('returns correct viseme at given time', () => {
      expect(processor.getVisemeAtTime(timeline, 0.15)).toBe('Aa')
      expect(processor.getVisemeAtTime(timeline, 0.35)).toBe('Ee')
    })

    it('returns Rest for time outside timeline', () => {
      expect(processor.getVisemeAtTime(timeline, 1.0)).toBe('Rest')
    })
  })

  describe('setFps', () => {
    it('changes FPS for frame calculations', () => {
      const p = new LipSyncProcessor(30)
      const alignment: ElevenLabsAlignment = {
        characters: [],
        character_start_times_seconds: [],
        character_end_times_seconds: [],
        phonemes: ['AA'],
        phoneme_start_times_seconds: [0.0],
        phoneme_end_times_seconds: [1.0],
      }
      const result30 = p.processAlignment(alignment)
      p.setFps(60)
      const result60 = p.processAlignment(alignment)

      // At 60 fps, end frame should be double that of 30 fps
      expect(result60[0].endFrame).toBeGreaterThan(result30[0].endFrame)
    })
  })
})
