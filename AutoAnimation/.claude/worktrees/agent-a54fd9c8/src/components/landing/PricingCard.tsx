import { Check } from 'lucide-react'
import { GlowButton } from './ui/GlowButton'

interface PricingCardProps {
  name: string
  price: string
  priceNote?: string
  features: string[]
  cta: string
  popular?: boolean
  yearly?: boolean
}

export function PricingCard({ name, price, priceNote, features, cta, popular }: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-8 flex flex-col transition-all duration-300 ${
        popular
          ? 'border-accent/40 bg-accent/[0.03] ring-2 ring-accent/20 scale-[1.02] md:scale-105 shadow-glow'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full bg-accent text-black">
          Most Popular
        </span>
      )}

      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <div className="mt-4 mb-1">
        <span className="text-4xl font-bold text-white">{price}</span>
        {priceNote && <span className="text-sm text-zinc-500 ml-1">{priceNote}</span>}
      </div>

      <div className="mt-6 mb-8 flex-1">
        <ul className="space-y-3">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
              <Check size={15} className={`mt-0.5 shrink-0 ${popular ? 'text-accent' : 'text-zinc-600'}`} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <GlowButton
        to="/dashboard"
        variant={popular ? 'solid' : 'ghost'}
        className="w-full justify-center"
      >
        {cta}
      </GlowButton>
    </div>
  )
}
