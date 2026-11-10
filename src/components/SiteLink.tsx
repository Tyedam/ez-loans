import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type SiteLinkProps = {
  href: string
  className?: string
  children: ReactNode
}

/** Routes paths on this site through the router and leaves everything else as a plain link. */
export function SiteLink({ href, className, children }: SiteLinkProps) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}
