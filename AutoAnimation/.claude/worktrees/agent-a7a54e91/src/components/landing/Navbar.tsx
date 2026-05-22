import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from './icons/Logo'
import { GlowButton } from './ui/GlowButton'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-zinc-950/70 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-lg font-bold text-white tracking-tight">ProAnimate</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <GlowButton to="/dashboard" className="text-sm py-2 px-4">
              Try for free
            </GlowButton>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-2xl font-semibold text-white"
            >
              {link.label}
            </button>
          ))}
          <div className="flex flex-col items-center gap-4 mt-4">
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="text-lg text-zinc-400"
            >
              Sign In
            </Link>
            <GlowButton to="/dashboard" className="text-lg py-3 px-8">
              Try for free
            </GlowButton>
          </div>
        </div>
      )}
    </>
  )
}
