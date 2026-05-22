/** SliderRow matching Cinema right-panel standard */
export function RPSlider({ label, value, onChange, min, max, step, precision = 0 }: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step: number; precision?: number
}) {
  const display = precision > 0 ? value.toFixed(precision) : String(Math.round(value))
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-gray-400 text-sm w-20 shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1">
        <div className="bg-panel-surface text-white text-sm px-3 py-2 rounded-lg min-w-[48px] text-center">
          {display}
        </div>
        <div className="flex-1 relative h-8 bg-panel-surface rounded-lg overflow-hidden">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-5 bg-accent rounded-md transition-all"
            style={{ left: `${pct}%`, width: '20px', transform: 'translate(-50%, -50%)' }}
          />
        </div>
      </div>
    </div>
  )
}
