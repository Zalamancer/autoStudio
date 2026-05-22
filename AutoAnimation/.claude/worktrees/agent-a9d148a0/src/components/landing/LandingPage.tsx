import { useEffect, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Navbar } from './Navbar'
import { HeroSection } from './HeroSection'
import { LogoCloud } from './LogoCloud'
import { HowItWorks } from './HowItWorks'
import { FeatureShowcase } from './FeatureShowcase'
import { DemoSection } from './DemoSection'
import { StatsSection } from './StatsSection'
import { PricingSection } from './PricingSection'
import { FAQSection } from './FAQSection'
import { FooterCTA } from './FooterCTA'
import { Footer } from './Footer'

// Register once at module scope
gsap.registerPlugin(ScrollTrigger)

function LandingPage() {
  // 1) Make body scrollable BEFORE paint, force reflow so browser knows
  useLayoutEffect(() => {
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.documentElement.style.height = 'auto'
    // Force synchronous reflow — browser now knows the page is scrollable
    void document.body.scrollHeight

    return () => {
      document.body.style.overflow = 'hidden'
      document.body.style.height = ''
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
    }
  }, [])

  // 2) After ALL child useEffects have created their ScrollTriggers,
  //    do a full refresh to recalculate positions with correct scroll height
  useEffect(() => {
    // Double-rAF ensures: layout done → paint done → positions correct
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative">
      {/* Full-page grid texture */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      {/* Top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />
      {/* Bottom glow */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[30vh] bg-accent/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <Navbar />
      <HeroSection />
      <LogoCloud />
      <HowItWorks />
      <FeatureShowcase />
      <DemoSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <FooterCTA />
      <Footer />
    </div>
  )
}

export default LandingPage
