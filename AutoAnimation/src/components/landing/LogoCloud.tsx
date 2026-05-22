import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TikTokLogo } from './icons/TikTokLogo'
import { YouTubeLogo } from './icons/YouTubeLogo'
import { InstagramLogo } from './icons/InstagramLogo'
import { FacebookLogo } from './icons/FacebookLogo'
import { XLogo } from './icons/XLogo'

gsap.registerPlugin(ScrollTrigger)

const PLATFORMS = [
  { name: 'TikTok', Icon: TikTokLogo, color: '#ff0050' },
  { name: 'YouTube', Icon: YouTubeLogo, color: '#ff0000' },
  { name: 'Instagram', Icon: InstagramLogo, color: '#e4405f' },
  { name: 'Facebook', Icon: FacebookLogo, color: '#1877f2' },
  { name: 'X', Icon: XLogo, color: '#ffffff' },
]

export function LogoCloud() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.from('.logo-item', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.1,
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
    <section ref={ref} className="pt-36 pb-16 px-6 border-y border-white/[0.04]">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm text-zinc-500 mb-8 tracking-wide uppercase">Publish directly to</p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-14">
          {PLATFORMS.map(({ name, Icon, color }) => (
            <div
              key={name}
              className="logo-item group flex flex-col items-center gap-2 cursor-pointer"
              style={{ '--brand-color': color } as React.CSSProperties}
            >
              <div className="text-zinc-600 transition-colors duration-300 group-hover:[color:var(--brand-color)]">
                <Icon className="w-7 h-7" />
              </div>
              <span className="text-xs text-zinc-600 group-hover:text-zinc-300 transition-colors">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
