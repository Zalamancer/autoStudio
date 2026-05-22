import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SectionHeading } from './ui/SectionHeading'
import { PricingCard } from './PricingCard'

gsap.registerPlugin(ScrollTrigger)

const PLANS = {
  monthly: [
    {
      name: 'Free',
      price: '$0',
      priceNote: '/mo',
      features: ['150 credits/day', '720p export', '2 AI voices', '5 templates', 'Basic 2D characters', 'Watermark', 'Community support'],
      cta: 'Get Started',
    },
    {
      name: 'Pro',
      price: '$17',
      priceNote: '/mo',
      popular: true,
      features: ['8,500 credits/month', '2D animation', '1080p export', 'All voices (30+)', '100+ templates', 'No watermark', 'Priority support', 'Social publishing'],
      cta: 'Start Pro Trial',
    },
    {
      name: 'Business',
      price: '$33',
      priceNote: '/mo',
      features: ['25,000 credits/month', '2D + 3D animation', '4K export', 'All voices (30+)', '100+ templates', 'No watermark', 'Priority support', 'Social publishing', 'Team support', 'API access'],
      cta: 'Start Business Trial',
    },
  ],
  yearly: [
    {
      name: 'Free',
      price: '$0',
      priceNote: '/mo',
      features: ['150 credits/day', '720p export', '2 AI voices', '5 templates', 'Basic 2D characters', 'Watermark', 'Community support'],
      cta: 'Get Started',
    },
    {
      name: 'Pro',
      price: '$14',
      priceNote: '/mo billed yearly',
      popular: true,
      features: ['8,500 credits/month', '2D animation', '1080p export', 'All voices (30+)', '100+ templates', 'No watermark', 'Priority support', 'Social publishing'],
      cta: 'Start Pro Trial',
    },
    {
      name: 'Business',
      price: '$27',
      priceNote: '/mo billed yearly',
      features: ['25,000 credits/month', '2D + 3D animation', '4K export', 'All voices (30+)', '100+ templates', 'No watermark', 'Priority support', 'Social publishing', 'Team support', 'API access'],
      cta: 'Start Business Trial',
    },
  ],
}

export function PricingSection() {
  const [yearly, setYearly] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.from('.pricing-card-wrap', {
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  const plans = yearly ? PLANS.yearly : PLANS.monthly

  return (
    <section id="pricing" ref={ref} className="py-24 px-6">
      <SectionHeading
        tag="Pricing"
        title="Simple, transparent pricing"
        description="Start free, upgrade when you're ready"
      />

      <div className="flex items-center justify-center gap-3 mb-12">
        <span className={`text-sm ${!yearly ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-accent' : 'bg-zinc-700'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${yearly ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm ${yearly ? 'text-white' : 'text-zinc-500'}`}>
          Yearly <span className="text-accent text-xs font-medium">Save 20%</span>
        </span>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <div key={plan.name} className="pricing-card-wrap">
            <PricingCard {...plan} yearly={yearly} />
          </div>
        ))}
      </div>
    </section>
  )
}
