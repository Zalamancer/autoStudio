import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface AnimatedCounterProps {
  target: number
  suffix?: string
  prefix?: string
  label: string
}

export function AnimatedCounter({ target, suffix = '', prefix = '', label }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!ref.current) return
    const obj = { val: 0 }
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 85%',
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => {
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          snap: { val: 1 },
          onUpdate: () => setValue(Math.round(obj.val)),
        })
      },
    })
    return () => trigger.kill()
  }, [target])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white">
        {prefix}{value}{suffix}
      </div>
      <div className="mt-2 text-sm text-zinc-400">{label}</div>
    </div>
  )
}
