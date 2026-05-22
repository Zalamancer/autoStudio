import { useEffect, useRef } from 'react'
import { useProjectSchemaStore } from '@/stores/useProjectSchemaStore'
import { dispatchSchemaBindings } from '@/services/schemaRuntime'
import type { SchemaBinding } from '@/types/projectSchema'

/**
 * Reactive subscription hook that dispatches schema bindings when variables change.
 * Mount this in EditorLayout alongside existing playback hooks.
 * Pattern from useKeyframePlayback.ts subscription approach.
 */
export function useSchemaRuntime() {
  const prevValuesRef = useRef<Map<string, unknown>>(new Map())

  useEffect(() => {
    const unsub = useProjectSchemaStore.subscribe((state) => {
      const schema = state.schema
      if (!schema) return

      const prevValues = prevValuesRef.current
      const changedKeys: string[] = []
      const currentValues = new Map<string, unknown>()

      for (const variable of schema.variables) {
        currentValues.set(variable.key, variable.value)
        const prevValue = prevValues.get(variable.key)
        if (!Object.is(prevValue, variable.value)) {
          changedKeys.push(variable.key)
        }
      }

      prevValuesRef.current = currentValues

      if (changedKeys.length === 0) return

      dispatchSchemaBindings(
        changedKeys,
        currentValues,
        schema.bindings as (SchemaBinding & { variableKey: string })[],
      )
    })

    return unsub
  }, [])
}
