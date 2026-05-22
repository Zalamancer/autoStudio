import { createContext, useContext } from 'react'

export interface CompositionContextValue {
  frame: number
  fps: number
  durationInFrames: number
  width: number
  height: number
}

const CompositionCtx = createContext<CompositionContextValue | null>(null)

export const CompositionProvider = CompositionCtx.Provider

export function useFrame(): number {
  const ctx = useContext(CompositionCtx)
  if (!ctx) throw new Error('useFrame must be used inside a CompositionProvider')
  return ctx.frame
}

export function useComposition(): CompositionContextValue {
  const ctx = useContext(CompositionCtx)
  if (!ctx) throw new Error('useComposition must be used inside a CompositionProvider')
  return ctx
}
