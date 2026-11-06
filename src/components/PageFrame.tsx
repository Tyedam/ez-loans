import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'

type Action = {
  label: string
  href: string
}

type PageFrameProps = {
  eyebrow: string
  title: string
  lede: string
  primary?: Action
  secondary?: Action
  children?: ReactNode
}

function ActionLink({ action, tone }: { action: Action; tone: 'solid' | 'ghost' }) {
  const className =
    tone === 'solid'
      ? 'rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand'
      : 'rounded-lg border border-black/15 px-5 py-3 text-sm font-medium text-black transition-colors hover:border-brand hover:text-brand'
  if (action.href.startsWith('/')) {
    return (
      <Link to={action.href} className={className}>
        {action.label}
      </Link>
    )
  }
  return (
    <a href={action.href} className={className}>
      {action.label}
    </a>
  )
}

export function PageFrame({ eyebrow, title, lede, primary, secondary, children }: PageFrameProps) {
  return (
    <>
      <div className="bg-black text-white">
        <div className="px-6 pt-6 md:px-12 lg:px-16">
          <SiteHeader />
        </div>
        <header className="mx-auto max-w-[1240px] px-6 pb-16 pt-14 md:px-12 lg:px-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{lede}</p>
        </header>
      </div>
      <div className="bg-white px-6 py-16 text-black md:px-12 lg:px-16">
        <div className="mx-auto max-w-[1240px]">
          {children}
          {primary || secondary ? (
            <div className="mt-10 flex flex-wrap gap-3">
              {primary ? <ActionLink action={primary} tone="solid" /> : null}
              {secondary ? <ActionLink action={secondary} tone="ghost" /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
