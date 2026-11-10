import { useState } from 'react'
import { Link } from 'react-router-dom'
import { navLinks, site } from '../site'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-none">
      <nav className="flex items-center justify-between">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center rounded-md bg-white px-2.5 py-1"
          onClick={() => setOpen(false)}
        >
          <img src="/ez-logo.png" alt={site.name} className="h-7 w-auto" />
        </Link>
        <div className="hidden items-center text-sm lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="pointer-events-auto rounded-md px-3 py-2 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.85)] transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.85)] lg:hidden"
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
        <div className="mt-2 flex flex-col text-sm lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="pointer-events-auto rounded-md px-3 py-3 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.85)] hover:text-brand"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
