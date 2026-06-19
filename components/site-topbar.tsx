'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'

const navLinks = [
  { href: '#features',  label: 'Recursos' },
  { href: '#pricing',   label: 'Produtos' },
  { href: '#faq',       label: 'FAQ' },
]

export function SiteTopbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        scrolled || mobileOpen
          ? 'border-b border-zinc-200/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
      style={{
        backgroundColor: scrolled || mobileOpen ? 'rgba(244, 249, 254, 0.85)' : 'transparent',
      }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group justify-self-start" onClick={() => setMobileOpen(false)}>
          <span className="logo-shimmer-dark logo-glow-dark text-xl sm:text-2xl font-black tracking-tight transition-transform duration-500 group-hover:scale-[1.04]">
            Havoc Bypass
          </span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-1 justify-self-center">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-3 lg:px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors duration-300 group"
            >
              {l.label}
              <span className="absolute left-3 right-3 lg:left-4 lg:right-4 -bottom-0.5 h-px bg-zinc-900/80 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <Link
            href="/login"
            className="button-shine group relative inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-black hover:scale-[1.04] active:scale-[0.97] hover:shadow-[0_0_28px_rgba(0,0,0,0.18)]"
          >
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
            <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden inline-flex items-center justify-center rounded-full border border-zinc-300 w-9 h-9 text-zinc-700 hover:text-zinc-900 hover:border-zinc-500 hover:bg-[rgb(245,245,245)]"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 pb-4">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-[rgb(245,245,245)] hover:text-zinc-900"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
