import type { ReactNode } from 'react'
import { CharacterProvider, useCharacterContext } from '../../contexts/CharacterContext'
import { ViewportProvider } from '../../contexts/ViewportContext'
import { ToolProvider } from '../../contexts/ToolContext'
import { AnimationProvider } from '../../contexts/AnimationContext'
import { EngineContextProvider, useEngineContext } from '../../contexts/EngineContext'
import { useBoneRiggingEngine } from '../../hooks/useBoneRiggingEngine'
import type { SerializedRigData, CharacterLibraryEntry } from '@bonerigging/core'

// Re-use the editor context from RiggingEditor for onSave/onCancel/initialData
import { createContext, useContext, useEffect, useRef } from 'react'

export interface BoneRiggingProviderProps {
  children: ReactNode
  onSave?: (data: SerializedRigData) => void
  onCancel?: () => void
  initialData?: SerializedRigData | null
  initialImageUrl?: string
  characterLibrary?: CharacterLibraryEntry[]
  activeCharacterId?: string | null
}

// Editor-level context (passes props down to engine)
interface EditorPropsContextValue {
  onSave?: (data: SerializedRigData) => void
  onCancel?: () => void
  initialData?: SerializedRigData | null
  initialImageUrl?: string
  activeCharacterId?: string | null
}

const EditorPropsContext = createContext<EditorPropsContextValue>({})
export function useEditorPropsContext() {
  return useContext(EditorPropsContext)
}

/**
 * Internal: Syncs the characterLibrary prop into CharacterContext
 * and auto-selects the active dialogue character (if any).
 * Must be rendered INSIDE CharacterProvider.
 */
function CharacterLibrarySync({
  library,
  activeCharacterId,
}: {
  library?: CharacterLibraryEntry[]
  activeCharacterId?: string | null
}) {
  const { state, dispatch } = useCharacterContext()
  useEffect(() => {
    if (library && library.length > 0) {
      dispatch({ type: 'SET_CHARACTER_LIBRARY', library })
    }
  }, [library, dispatch])

  // Auto-select the active character when the library is populated
  // and no character is selected yet (or the active one changed).
  useEffect(() => {
    if (!activeCharacterId || !library || library.length === 0) return
    const match = library.find((c) => c.id === activeCharacterId)
    if (match && state.activeCharacterId !== activeCharacterId) {
      dispatch({ type: 'SET_ACTIVE_CHARACTER', id: activeCharacterId })
    }
  }, [activeCharacterId, library, state.activeCharacterId, dispatch])

  return null
}

/**
 * Returns true if a URL is a blob: URL (transient, not safe to persist/reload).
 */
function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:')
}

/**
 * Sanitize a SerializedRigData by replacing any stale blob URLs with the
 * current live image URL. The auto-saver captures blob: URLs for
 * sourceImageUrl every 30s; those blobs are revoked when the session ends,
 * making the persisted data unloadable on the next session.
 */
function sanitizeRigData(data: SerializedRigData, liveImageUrl: string): SerializedRigData {
  if (isBlobUrl(data.sourceImageUrl)) {
    return { ...data, sourceImageUrl: liveImageUrl }
  }
  return data
}

/**
 * Internal: Loads initialData or initialImageUrl into the engine on mount.
 * Must be rendered INSIDE EngineContextProvider.
 */
function InitialDataLoader() {
  const { initialData, initialImageUrl, activeCharacterId } = useEditorPropsContext()
  const engine = useEngineContext()
  const { state: charState } = useCharacterContext()
  const loadedRef = useRef(false)

  // Resolve the current live image URL for the active character from the library
  const liveImageUrl = activeCharacterId
    ? charState.characterLibrary.find((c) => c.id === activeCharacterId)?.imageUrl
    : undefined

  useEffect(() => {
    if (loadedRef.current) return
    const imageUrl = liveImageUrl || initialImageUrl

    if (initialData && imageUrl) {
      // Use saved rig data — but sanitize any stale blob URLs first so
      // loadSerializedData can actually fetch the source image.
      loadedRef.current = true
      const sanitized = sanitizeRigData(initialData, imageUrl)
      engine.loadSerializedData(sanitized)
    } else if (imageUrl) {
      // No saved rig — fall back to auto-rig from the character image.
      loadedRef.current = true
      engine.loadCharacterFromUrl(imageUrl)
    }
  }, [initialData, initialImageUrl, liveImageUrl, engine])

  return null
}

/**
 * Internal: Initializes the engine and provides it via EngineContext.
 * Must be rendered INSIDE all 4 context providers.
 */
function EngineBootstrap({ children }: { children: ReactNode }) {
  const engine = useBoneRiggingEngine()
  return (
    <EngineContextProvider value={engine}>
      <InitialDataLoader />
      {children}
    </EngineContextProvider>
  )
}

/**
 * BoneRiggingProvider — wraps children with all bonerigging context providers + engine.
 * Used by AutoStudio's EditorLayout to provide shared state across all 3 panels.
 */
export function BoneRiggingProvider({
  children,
  onSave,
  onCancel,
  initialData,
  initialImageUrl,
  characterLibrary,
  activeCharacterId,
}: BoneRiggingProviderProps) {
  return (
    <EditorPropsContext.Provider value={{ onSave, onCancel, initialData, initialImageUrl, activeCharacterId }}>
      <CharacterProvider>
        <CharacterLibrarySync library={characterLibrary} activeCharacterId={activeCharacterId} />
        <ViewportProvider>
          <ToolProvider>
            <AnimationProvider>
              <EngineBootstrap>{children}</EngineBootstrap>
            </AnimationProvider>
          </ToolProvider>
        </ViewportProvider>
      </CharacterProvider>
    </EditorPropsContext.Provider>
  )
}
