import { useState, useCallback } from 'react'
import type { TemplateVariable } from '@/types/projectTemplate'
import { ColorPicker } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'

interface TemplateVariableFormProps {
  variables: TemplateVariable[]
  values: Record<string, string | number | boolean>
  onChange: (key: string, value: string | number | boolean) => void
}

export function TemplateVariableForm({
  variables,
  values,
  onChange,
}: TemplateVariableFormProps) {
  // Group variables
  const groups = new Map<string, TemplateVariable[]>()
  for (const v of variables) {
    const group = v.group || 'General'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(v)
  }

  // Sort within groups by order
  for (const [, vars] of groups) {
    vars.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([groupName, vars]) => (
        <div key={groupName}>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {groupName}
          </h4>
          <div className="space-y-3">
            {vars.map((variable) => (
              <VariableInput
                key={variable.key}
                variable={variable}
                value={values[variable.key] ?? variable.defaultValue}
                onChange={(val) => onChange(variable.key, val)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function VariableInput({
  variable,
  value,
  onChange,
}: {
  variable: TemplateVariable
  value: string | number | boolean
  onChange: (val: string | number | boolean) => void
}) {
  const id = `var-${variable.key}`

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-300 mb-1">
        {variable.label}
      </label>
      {variable.description && (
        <p className="text-[11px] text-gray-500 mb-1">{variable.description}</p>
      )}

      {variable.type === 'text' && (
        <input
          id={id}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-panel-surface border border-panel-border rounded-md text-white focus:border-blue-500 focus:outline-none"
          maxLength={variable.validation?.maxLength}
        />
      )}

      {variable.type === 'text-multiline' && (
        <textarea
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-1.5 text-sm bg-panel-surface border border-panel-border rounded-md text-white focus:border-blue-500 focus:outline-none resize-y"
          maxLength={variable.validation?.maxLength}
        />
      )}

      {variable.type === 'number' && (
        <PanelSlider
          label={variable.label}
          value={Number(value)}
          onChange={(v) => onChange(v)}
          min={variable.validation?.min ?? 0}
          max={variable.validation?.max ?? 9999}
          step={1}
          compact
        />
      )}

      {variable.type === 'color' && (
        <ColorPicker color={String(value)} onChange={(c) => onChange(c)} />
      )}

      {variable.type === 'boolean' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-panel-border bg-panel-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-gray-300">{variable.label}</span>
        </label>
      )}

      {variable.type === 'select' && (
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-panel-surface border border-panel-border rounded-md text-white focus:border-blue-500 focus:outline-none"
        >
          {variable.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {variable.type === 'font' && (
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-panel-surface border border-panel-border rounded-md text-white focus:border-blue-500 focus:outline-none"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      )}

      {variable.type === 'image' && (
        <ImageInput value={String(value)} onChange={(v) => onChange(v)} />
      )}

      {variable.type === 'voice' && (
        <input
          id={id}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Voice ID"
          className="w-full px-3 py-1.5 text-sm bg-panel-surface border border-panel-border rounded-md text-white focus:border-blue-500 focus:outline-none"
        />
      )}

      {variable.type === 'character' && (
        <input
          id={id}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Saved character ID"
          className="w-full px-3 py-1.5 text-sm bg-panel-surface border border-panel-border rounded-md text-white focus:border-blue-500 focus:outline-none"
        />
      )}
    </div>
  )
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [preview, setPreview] = useState(value)

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setPreview(dataUrl)
        onChange(dataUrl)
      }
      reader.readAsDataURL(file)
    },
    [onChange],
  )

  return (
    <div className="space-y-2">
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-16 h-16 object-cover rounded border border-panel-border"
        />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="block w-full text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-panel-surface file:text-gray-300 hover:file:bg-panel-surface-hover"
      />
    </div>
  )
}

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Space Mono',
  'Poppins', 'Open Sans', 'Lato', 'Oswald', 'Raleway',
  'Merriweather', 'PT Sans', 'Nunito', 'Ubuntu', 'Bebas Neue',
  'Archivo Black', 'Permanent Marker', 'Pacifico', 'Dancing Script',
  'Caveat', 'Bangers', 'Righteous', 'Abril Fatface', 'Alfa Slab One',
  'Fredoka', 'Comfortaa',
]
