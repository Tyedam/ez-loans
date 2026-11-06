import { useState } from 'react'
import { Link } from 'react-router-dom'
import { navLinks, site } from '../site'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <nav className="liquid-glass flex items-center justify-between rounded-xl px-4 py-2">
        <Link to="/" className="inline-flex items-center rounded-md bg-white px-2.5 py-1" onClick={() => setOpen(false)}>
          <img src="/ez-logo.png" alt={site.name} className="h-7 w-auto" />
        </Link>
        <div className="hidden items-center gap-6 text-sm lg:flex lg:gap-8">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.href} className="transition-colors hover:text-brand">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white lg:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
          <Link
            to="/apply"
            className="rounded-lg bg-brand px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand"
            onClick={() => setOpen(false)}
          >
            Apply
          </Link>
        </div>
      </nav>
      {open ? (
        <div className="liquid-glass mt-2 flex flex-col gap-3 rounded-xl px-5 py-4 text-sm lg:hidden">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.href} className="hover:text-brand" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
