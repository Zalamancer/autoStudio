import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GradientText } from './ui/GradientText'
import { GlowButton } from './ui/GlowButton'

gsap.registerPlugin(ScrollTrigger)

export function FooterCTA() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.children, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="py-24 px-6">
      <div ref={ref} className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Ready to <GradientText>Create</GradientText>?
        </h2>
        <p className="mt-4 text-lg text-zinc-400">
          Join thousands of creators making animated videos with AI.
        </p>
        <div className="mt-8">
          <GlowButton to="/dashboard" className="text-base py-4 px-10 animate-glow-pulse">
            Try for free
          </GlowButton>
        </div>
      </div>
    </section>
  )
}
