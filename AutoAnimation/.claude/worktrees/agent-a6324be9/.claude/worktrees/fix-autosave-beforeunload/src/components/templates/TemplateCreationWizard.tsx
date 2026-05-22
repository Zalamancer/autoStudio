import { useState, useCallback, useMemo } from 'react'
import { X, ChevronRight, ChevronLeft, Loader2, Check, Plus, Trash2 } from 'lucide-react'
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
  type TemplateVariable,
  type TemplateBinding,
  type TemplateVariableType,
} from '@/types/projectTemplate'
import { captureSnapshot, createTemplate } from '@/services/templateService'
import { suggestVariables, type VariableSuggestion } from '@/services/snapshotUtils'
import { generateProjectThumbnail } from '@/utils/thumbnail'

interface TemplateCreationWizardProps {
  onClose: () => void
  onCreated?: (templateId: string) => void
}

type WizardStep = 'metadata' | 'variables' | 'review'

export function TemplateCreationWizard({
  onClose,
  onCreated,
}: TemplateCreationWizardProps) {
  const [step, setStep] = useState<WizardStep>('metadata')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Metadata
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('other')
  const [tagsInput, setTagsInput] = useState('')

  // Step 2: Variables
  const [suggestions, setSuggestions] = useState<VariableSuggestion[]>([])
  const [selectedSuggestionKeys, setSelectedSuggestionKeys] = useState<Set<string>>(new Set())
  const [customVariables, setCustomVariables] = useState<TemplateVariable[]>([])
  const [suggestionsGenerated, setSuggestionsGenerated] = useState(false)

  // Snapshot (captured once when entering step 2)
  const [snapshot, setSnapshot] = useState<ReturnType<typeof captureSnapshot> | null>(null)

  const tags = useMemo(
    () => tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    [tagsInput],
  )

  const handleNextFromMetadata = useCallback(() => {
    if (!name.trim()) {
      setError('Please enter a template name')
      return
    }
    setError(null)

    // Capture snapshot and generate suggestions
    const snap = captureSnapshot()
    setSnapshot(snap)

    if (!suggestionsGenerated) {
      const sugs = suggestVariables(snap as unknown as Record<string, unknown>)
      setSuggestions(sugs)
      setSelectedSuggestionKeys(new Set(sugs.map((s) => s.key)))
      setSuggestionsGenerated(true)
    }

    setStep('variables')
  }, [name, suggestionsGenerated])

  const handleToggleSuggestion = useCallback((key: string) => {
    setSelectedSuggestionKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleAddCustomVariable = useCallback(() => {
    const key = `custom_${Date.now()}`
    setCustomVariables((prev) => [
      ...prev,
      {
        key,
        label: '',
        type: 'text' as TemplateVariableType,
        defaultValue: '',
        group: 'Custom',
        order: prev.length,
      },
    ])
  }, [])

  const handleRemoveCustomVariable = useCallback((key: string) => {
    setCustomVariables((prev) => prev.filter((v) => v.key !== key))
  }, [])

  const handleUpdateCustomVariable = useCallback(
    (key: string, updates: Partial<TemplateVariable>) => {
      setCustomVariables((prev) =>
        prev.map((v) => (v.key === key ? { ...v, ...updates } : v)),
      )
    },
    [],
  )

  const handleSubmit = useCallback(async () => {
    if (!snapshot) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Build variables and bindings from selected suggestions + custom
      const variables: TemplateVariable[] = []
      const bindings: TemplateBinding[] = []

      for (const sug of suggestions) {
        if (!selectedSuggestionKeys.has(sug.key)) continue
        variables.push({
          key: sug.key,
          label: sug.label,
          type: sug.type,
          defaultValue: sug.defaultValue,
          group: sug.group,
          order: variables.length,
        })
        for (const path of sug.snapshotPaths) {
          bindings.push({
            variableKey: sug.key,
            snapshotPath: path,
            transform: 'direct',
          })
        }
      }

      // Add custom variables (no auto-bindings — user would use binding editor)
      for (const cv of customVariables) {
        if (!cv.label.trim()) continue
        variables.push(cv)
      }

      // Generate thumbnail
      let thumbnailUrl: string | null = null
      try {
        const thumbDataUrl = await generateProjectThumbnail()
        thumbnailUrl = thumbDataUrl || null
      } catch {
        // Non-fatal
      }

      const templateId = await createTemplate({
        name,
        description,
        category,
        tags,
        snapshot,
        variables,
        bindings,
        isPublished: false,
        thumbnailUrl,
      })

      onCreated?.(templateId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    snapshot, suggestions, selectedSuggestionKeys, customVariables,
    name, description, category, tags, onClose, onCreated,
  ])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] rounded-xl border border-[#3a3a3a] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <div>
            <h2 className="text-lg font-semibold text-white">Save as Template</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Step {step === 'metadata' ? '1' : step === 'variables' ? '2' : '3'} of 3
              {' — '}
              {step === 'metadata'
                ? 'Template Info'
                : step === 'variables'
                  ? 'Define Variables'
                  : 'Review & Save'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-5 pt-3">
          {(['metadata', 'variables', 'review'] as WizardStep[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                s === step
                  ? 'bg-blue-500'
                  : i < ['metadata', 'variables', 'review'].indexOf(step)
                    ? 'bg-blue-500/40'
                    : 'bg-[#2a2a2a]'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 'metadata' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Animation Template"
                  className="w-full px-3 py-2 text-sm bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this template creates..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:border-blue-500 focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="w-full px-3 py-2 text-sm bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:border-blue-500 focus:outline-none"
                >
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="funny, meme, trending"
                  className="w-full px-3 py-2 text-sm bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:border-blue-500 focus:outline-none"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/15 text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'variables' && (
            <>
              <p className="text-xs text-gray-500">
                Variables let template users customize the project. Check the suggested variables you want to include, or add custom ones.
              </p>

              {/* Auto-suggested variables */}
              {suggestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Suggested Variables
                  </h4>
                  <div className="space-y-1.5">
                    {suggestions.map((sug) => (
                      <label
                        key={sug.key}
                        className="flex items-start gap-2 px-3 py-2 rounded-md bg-[#2a2a2a] cursor-pointer hover:bg-[#333]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuggestionKeys.has(sug.key)}
                          onChange={() => handleToggleSuggestion(sug.key)}
                          className="mt-0.5 w-3.5 h-3.5 rounded border-[#555] bg-[#1a1a1a] text-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{sug.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-500 capitalize">
                              {sug.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5 truncate">
                            {sug.snapshotPaths.join(', ')}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom variables */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Custom Variables
                  </h4>
                  <button
                    onClick={handleAddCustomVariable}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] text-blue-400 hover:text-blue-300 rounded hover:bg-blue-500/10"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>

                {customVariables.length === 0 ? (
                  <p className="text-[11px] text-gray-600">
                    No custom variables. Use the "Add" button to create one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customVariables.map((cv) => (
                      <div
                        key={cv.key}
                        className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#2a2a2a]"
                      >
                        <input
                          type="text"
                          value={cv.label}
                          onChange={(e) =>
                            handleUpdateCustomVariable(cv.key, { label: e.target.value })
                          }
                          placeholder="Variable label"
                          className="flex-1 px-2 py-1 text-xs bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
                        />
                        <select
                          value={cv.type}
                          onChange={(e) =>
                            handleUpdateCustomVariable(cv.key, {
                              type: e.target.value as TemplateVariableType,
                            })
                          }
                          className="px-2 py-1 text-xs bg-[#1a1a1a] border border-[#3a3a3a] rounded text-white"
                        >
                          {VARIABLE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveCustomVariable(cv.key)}
                          className="p-1 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <div className="space-y-3">
                <div className="px-3 py-3 rounded-md bg-[#2a2a2a]">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Template Info</h4>
                  <p className="text-sm text-white font-medium">{name}</p>
                  {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
                  <p className="text-xs text-gray-600 mt-1 capitalize">
                    Category: {category.replace('-', ' ')}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-[#1a1a1a] text-gray-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-3 py-3 rounded-md bg-[#2a2a2a]">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">
                    Variables ({selectedSuggestionKeys.size + customVariables.filter((v) => v.label.trim()).length})
                  </h4>
                  {selectedSuggestionKeys.size === 0 && customVariables.length === 0 ? (
                    <p className="text-xs text-gray-600">
                      No variables — template will be a direct clone.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {suggestions
                        .filter((s) => selectedSuggestionKeys.has(s.key))
                        .map((s) => (
                          <div key={s.key} className="flex items-center gap-2 text-xs">
                            <Check size={12} className="text-green-500 shrink-0" />
                            <span className="text-gray-300">{s.label}</span>
                            <span className="text-gray-600 capitalize">({s.type})</span>
                          </div>
                        ))}
                      {customVariables
                        .filter((v) => v.label.trim())
                        .map((v) => (
                          <div key={v.key} className="flex items-center gap-2 text-xs">
                            <Check size={12} className="text-blue-500 shrink-0" />
                            <span className="text-gray-300">{v.label}</span>
                            <span className="text-gray-600 capitalize">({v.type})</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-600">
                  The template will be saved as a draft. You can publish it later from "My Templates".
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#2a2a2a]">
          <button
            onClick={step === 'metadata' ? onClose : () => setStep(step === 'review' ? 'variables' : 'metadata')}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            {step === 'metadata' ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft size={14} />
                Back
              </>
            )}
          </button>

          {step === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Save Template
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                if (step === 'metadata') handleNextFromMetadata()
                else setStep('review')
              }}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const VARIABLE_TYPES: TemplateVariableType[] = [
  'text',
  'text-multiline',
  'number',
  'color',
  'boolean',
  'image',
  'character',
  'voice',
  'select',
  'font',
]
