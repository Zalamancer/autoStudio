import { Link } from 'react-router-dom'
import { Logo } from './icons/Logo'
import { TikTokLogo } from './icons/TikTokLogo'
import { YouTubeLogo } from './icons/YouTubeLogo'
import { XLogo } from './icons/XLogo'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Demo', href: '#demo' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Templates', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '#' },
    ],
  },
]

export function Footer() {
  const handleAnchor = (href: string) => {
    if (href.startsWith('#') && href !== '#') {
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="border-t border-white/[0.06] bg-zinc-950/50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Logo size={24} />
              <span className="text-sm font-bold text-white">ProAnimate</span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed">
              AI-powered animation studio for short-form video creation.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="text-zinc-600 hover:text-white transition-colors"><XLogo className="w-4 h-4" /></a>
              <a href="#" className="text-zinc-600 hover:text-white transition-colors"><YouTubeLogo className="w-4 h-4" /></a>
              <a href="#" className="text-zinc-600 hover:text-white transition-colors"><TikTokLogo className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        to={link.href}
                        className="text-sm text-zinc-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        onClick={(e) => {
                          if (link.href.startsWith('#')) {
                            e.preventDefault()
                            handleAnchor(link.href)
                          }
                        }}
                        className="text-sm text-zinc-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-6 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} ProAnimate. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
