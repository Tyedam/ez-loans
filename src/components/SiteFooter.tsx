import { Link } from 'react-router-dom'
import { SiteLink } from './SiteLink'
import { companyLinks, loanLinks, site, toolLinks } from '../site'

const columns = [
  { title: 'Loans', links: loanLinks },
  { title: 'Free tools', links: toolLinks },
  { title: 'Company', links: companyLinks },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 pb-10 pt-16 text-white md:px-12 lg:px-16">
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-12">
        <div className="max-w-sm">
          <Link to="/" className="inline-flex items-center rounded-md bg-white px-2.5 py-1">
            <img src="/ez-logo.png" alt={site.name} className="h-7 w-auto" />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">{site.mission}</p>
          <p className="mt-4 text-sm leading-relaxed text-gray-300">
            <SiteLink href={`mailto:${site.email}`} className="hover:text-brand">
              {site.email}
            </SiteLink>
            <br />
            <SiteLink href={site.phoneHref} className="hover:text-brand">
              {site.phoneDisplay}
            </SiteLink>
            <br />
            {site.address}
            <br />
            <SiteLink href={site.facebook} className="hover:text-brand">
              Facebook
            </SiteLink>
            {' · '}
            <SiteLink href={site.instagram} className="hover:text-brand">
              Instagram
            </SiteLink>
          </p>
        </div>
        <div className="flex flex-wrap gap-16">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <SiteLink href={link.href} className="text-sm text-gray-300 hover:text-brand">
                      {link.label}
                    </SiteLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-14 max-w-[1240px] border-t border-white/10 pt-6 text-sm text-gray-400">
        <div className="flex flex-wrap justify-between gap-4">
          <p>© 2026 EZ Loans Group. Powered by United Lending Team, INC.</p>
          <p>
            <SiteLink href={site.privacy} className="hover:text-brand">
              Privacy Policy
            </SiteLink>
            {' · '}
            <SiteLink href={site.accessibility} className="hover:text-brand">
              Site Accessibility
            </SiteLink>
            {' · '}
            <SiteLink href={site.nmlsAccess} className="hover:text-brand">
              nmlsconsumeraccess.org
            </SiteLink>
          </p>
        </div>
        <p className="mt-4 max-w-[90ch] leading-relaxed">{site.license}</p>
      </div>
    </footer>
  )
}
