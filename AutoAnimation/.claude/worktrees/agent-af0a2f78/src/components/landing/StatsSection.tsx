import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AnimatedCounter } from './ui/AnimatedCounter'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { target: 13, label: 'Pipeline Steps', suffix: '' },
  { target: 100, label: 'Templates', suffix: '+' },
  { target: 24, label: 'Viseme Sprites', suffix: '' },
  { target: 5, label: 'Platforms', suffix: '' },
]

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.from('.stat-item', {
        opacity: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="py-20 px-6 border-y border-white/[0.04]">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <div key={i} className="stat-item">
            <AnimatedCounter
              target={stat.target}
              suffix={stat.suffix}
              label={stat.label}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
