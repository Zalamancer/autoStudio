/**
 * Utility functions for working with deep object paths in template snapshots.
 * Used by the variable binding system to read/write snapshot properties.
 */

/**
 * Get a value from a nested object using dot-notation path.
 * Supports array indices: "dialogueLines.0.script"
 */
export function getByPath(obj: unknown, path: string): unknown {
  const segments = path.split('.')
  let current: unknown = obj
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

/**
 * Set a value in a nested object using dot-notation path.
 * Creates intermediate objects/arrays as needed.
 * Mutates the object in place and returns it.
 */
export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const segments = path.split('.')
  let current: Record<string, unknown> = obj

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    const nextSegment = segments[i + 1]

    if (current[segment] == null || typeof current[segment] !== 'object') {
      // Create intermediate container: array if next segment looks numeric, else object
      current[segment] = /^\d+$/.test(nextSegment) ? [] : {}
    }

    current = current[segment] as Record<string, unknown>
  }

  const lastSegment = segments[segments.length - 1]
  current[lastSegment] = value
  return obj
}

/**
 * Collect all leaf paths from an object (for variable binding discovery).
 * Returns an array of dot-notation paths to all non-object leaf values.
 * Arrays are traversed with numeric indices.
 *
 * @param maxDepth - Maximum recursion depth to prevent infinite loops (default 8)
 */
export function collectLeafPaths(
  obj: unknown,
  prefix = '',
  maxDepth = 8,
): string[] {
  if (maxDepth <= 0) return []
  if (obj == null) return prefix ? [prefix] : []

  if (Array.isArray(obj)) {
    const paths: string[] = []
    for (let i = 0; i < obj.length; i++) {
      const itemPrefix = prefix ? `${prefix}.${i}` : `${i}`
      paths.push(...collectLeafPaths(obj[i], itemPrefix, maxDepth - 1))
    }
    return paths
  }

  if (typeof obj === 'object') {
    const paths: string[] = []
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const childPrefix = prefix ? `${prefix}.${key}` : key
      paths.push(
        ...collectLeafPaths(
          (obj as Record<string, unknown>)[key],
          childPrefix,
          maxDepth - 1,
        ),
      )
    }
    return paths
  }

  // Leaf value (string, number, boolean)
  return prefix ? [prefix] : []
}

/**
 * Detect suggested variables from a snapshot by scanning common paths.
 * Returns an array of suggested variable definitions with their bindings.
 */
export interface VariableSuggestion {
  key: string
  label: string
  type: 'text' | 'text-multiline' | 'color' | 'number' | 'boolean' | 'character' | 'voice'
  defaultValue: string | number | boolean
  snapshotPaths: string[]
  group: string
}

export function suggestVariables(snapshot: Record<string, unknown>): VariableSuggestion[] {
  const suggestions: VariableSuggestion[] = []
  let varIdx = 0

  const nextKey = (prefix: string) => `${prefix}_${++varIdx}`

  // Text overlays → text variables
  const textOverlays = snapshot.textOverlays as Array<Record<string, unknown>> | undefined
  if (textOverlays?.length) {
    for (let i = 0; i < textOverlays.length; i++) {
      const overlay = textOverlays[i]
      suggestions.push({
        key: nextKey('text'),
        label: `Text: ${String(overlay.presetType || 'overlay')} ${i + 1}`,
        type: 'text',
        defaultValue: String(overlay.content || ''),
        snapshotPaths: [`textOverlays.${i}.content`],
        group: 'Text',
      })
    }
  }

  // Dialogue lines → text variables
  const dialogueLines = snapshot.dialogueLines as Array<Record<string, unknown>> | undefined
  if (dialogueLines?.length) {
    for (let i = 0; i < dialogueLines.length; i++) {
      const line = dialogueLines[i]
      suggestions.push({
        key: nextKey('dialogue'),
        label: `Dialogue Line ${i + 1}`,
        type: 'text-multiline',
        defaultValue: String(line.script || ''),
        snapshotPaths: [`dialogueLines.${i}.script`],
        group: 'Dialogue',
      })
    }
  }

  // Shapes → color variables
  const shapes = snapshot.shapes as Array<Record<string, unknown>> | undefined
  if (shapes?.length) {
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i]
      if (shape.fill && shape.fill !== 'transparent') {
        suggestions.push({
          key: nextKey('color'),
          label: `${String(shape.name || `Shape ${i + 1}`)} Fill`,
          type: 'color',
          defaultValue: String(shape.fill),
          snapshotPaths: [`shapes.${i}.fill`],
          group: 'Colors',
        })
      }
    }
  }

  // Dialogue characters → character variables
  const dialogueCharacters = snapshot.dialogueCharacters as Array<Record<string, unknown>> | undefined
  if (dialogueCharacters?.length) {
    for (let i = 0; i < dialogueCharacters.length; i++) {
      const char = dialogueCharacters[i]
      suggestions.push({
        key: nextKey('character'),
        label: `Character: ${String(char.name || `Character ${i + 1}`)}`,
        type: 'character',
        defaultValue: String(char.savedCharacterId || ''),
        snapshotPaths: [`dialogueCharacters.${i}.savedCharacterId`],
        group: 'Characters',
      })
    }
  }

  // HTML template configs → matching type variables
  const htmlTemplates = snapshot.htmlTemplates as Array<Record<string, unknown>> | undefined
  if (htmlTemplates?.length) {
    for (let i = 0; i < htmlTemplates.length; i++) {
      const tpl = htmlTemplates[i]
      const customConfig = tpl.customConfig as Array<Record<string, unknown>> | undefined
      if (customConfig?.length) {
        for (let j = 0; j < customConfig.length; j++) {
          const prop = customConfig[j]
          const propType = String(prop.type || 'text')
          let varType: VariableSuggestion['type'] = 'text'
          if (propType === 'color') varType = 'color'
          else if (propType === 'number' || propType === 'range') varType = 'number'
          else if (propType === 'boolean' || propType === 'checkbox') varType = 'boolean'

          suggestions.push({
            key: nextKey('config'),
            label: `${String(tpl.name || `Template ${i + 1}`)}: ${String(prop.label || prop.key)}`,
            type: varType,
            defaultValue: prop.value != null ? (prop.value as string | number | boolean) : '',
            snapshotPaths: [`htmlTemplates.${i}.customConfig.${j}.value`],
            group: 'Templates',
          })
        }
      }
    }
  }

  return suggestions
}
