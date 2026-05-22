/**
 * Animation Style Transfer Store — Manages the current style preset or custom
 * parameters, source animation reference, and affected object selection.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CanvasObjectRef } from '@/types/keyframes'
import type {
  StylePresetId,
  AnimationStyleFeatures,
} from '@/services/animationStyleTransfer'

interface AnimStyleState {
  /** Currently active preset (null = custom parameters) */
  activePresetId: StylePresetId | null

  /** Custom slider parameters (used when activePresetId is null) */
  customIntensity: number // 0.1 .. 3
  customElasticity: number // 0 .. 1
  customSpeedMultiplier: number // 0.25 .. 4
  customRhythmVariation: number // 0 .. 1

  /** Extracted style features from "Learn from Selection" */
  learnedFeatures: AnimationStyleFeatures | null

  /** Objects whose keyframes will be affected by style apply */
  affectedObjects: CanvasObjectRef[]

  // Actions
  setActivePreset: (id: StylePresetId | null) => void
  setCustomIntensity: (v: number) => void
  setCustomElasticity: (v: number) => void
  setCustomSpeedMultiplier: (v: number) => void
  setCustomRhythmVariation: (v: number) => void
  setLearnedFeatures: (f: AnimationStyleFeatures | null) => void
  addAffectedObject: (ref: CanvasObjectRef) => void
  removeAffectedObject: (ref: CanvasObjectRef) => void
  setAffectedObjects: (refs: CanvasObjectRef[]) => void
  clearAffectedObjects: () => void
  selectAllObjects: (refs: CanvasObjectRef[]) => void
}

function refEq(a: CanvasObjectRef, b: CanvasObjectRef): boolean {
  return a.objectType === b.objectType && a.objectId === b.objectId
}

export const useAnimStyleStore = create<AnimStyleState>()(
  immer((set) => ({
    activePresetId: null,
    customIntensity: 1,
    customElasticity: 0,
    customSpeedMultiplier: 1,
    customRhythmVariation: 0,
    learnedFeatures: null,
    affectedObjects: [],

    setActivePreset: (id) =>
      set((s) => {
        s.activePresetId = id
        s.learnedFeatures = null
      }),

    setCustomIntensity: (v) =>
      set((s) => {
        s.customIntensity = v
        s.activePresetId = null
        s.learnedFeatures = null
      }),

    setCustomElasticity: (v) =>
      set((s) => {
        s.customElasticity = v
        s.activePresetId = null
        s.learnedFeatures = null
      }),

    setCustomSpeedMultiplier: (v) =>
      set((s) => {
        s.customSpeedMultiplier = v
        s.activePresetId = null
        s.learnedFeatures = null
      }),

    setCustomRhythmVariation: (v) =>
      set((s) => {
        s.customRhythmVariation = v
        s.activePresetId = null
        s.learnedFeatures = null
      }),

    setLearnedFeatures: (f) =>
      set((s) => {
        s.learnedFeatures = f
        s.activePresetId = null
      }),

    addAffectedObject: (ref) =>
      set((s) => {
        if (!s.affectedObjects.some((o) => refEq(o, ref))) {
          s.affectedObjects.push({ ...ref })
        }
      }),

    removeAffectedObject: (ref) =>
      set((s) => {
        s.affectedObjects = s.affectedObjects.filter((o) => !refEq(o, ref))
      }),

    setAffectedObjects: (refs) =>
      set((s) => {
        s.affectedObjects = refs.map((r) => ({ ...r }))
      }),

    clearAffectedObjects: () =>
      set((s) => {
        s.affectedObjects = []
      }),

    selectAllObjects: (refs) =>
      set((s) => {
        s.affectedObjects = refs.map((r) => ({ ...r }))
      }),
  }))
)
