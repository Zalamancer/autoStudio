import { Check } from 'lucide-react'

interface PlanCardProps {
  name: string
  price: string
  period: string
  credits: string
  features: string[]
  isCurrent: boolean
  onSelect: () => void
  highlight?: boolean
}

export function PlanCard({ name, price, period, credits, features, isCurrent, onSelect, highlight }: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 transition-all ${
        highlight
          ? 'border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10'
          : 'border-zinc-700/50 bg-zinc-800/50'
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black uppercase tracking-wide">
          Popular
        </span>
      )}
      <h3 className="text-lg font-bold text-white">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{price}</span>
        {period && <span className="text-sm text-zinc-400">/{period}</span>}
      </div>
      <p className="mt-2 text-sm text-zinc-400">{credits}</p>

      <ul className="mt-4 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
            <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrent}
        className={`mt-5 w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
          isCurrent
            ? 'bg-zinc-700 text-zinc-400 cursor-default'
            : highlight
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-zinc-600 hover:bg-zinc-500 text-white'
        }`}
      >
        {isCurrent ? 'Current Plan' : 'Upgrade'}
      </button>
    </div>
  )
}
