import { Link } from 'react-router-dom'
import { site } from '../site'

export function QuoteBand() {
  return (
    <section id="quote" className="bg-black px-6 py-24 text-white md:px-12 lg:px-16">
      <div className="liquid-glass mx-auto max-w-[1240px] rounded-[36px] px-7 py-12 md:px-14 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end lg:gap-16">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/55">Troy, Michigan</p>
            <h2 className="mt-4 text-4xl font-normal leading-[1.05] tracking-tight md:text-6xl">
              Ready to compare?
              <span className="serif-em block">Get a free rate quote.</span>
            </h2>
          </div>
          <div>
            <p className="max-w-sm text-sm leading-relaxed text-white/70 md:text-base">
              Apply online or call the Troy office at {site.address}.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                to="/apply"
                className="rounded-full bg-brand px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand"
              >
                Get a FREE rate quote
              </Link>
              <a href={site.phoneHref} className="text-lg font-medium text-brand transition-colors hover:text-white">
                {site.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
        <p className="mt-12 border-t border-white/15 pt-5 text-xs text-white/55">
          {site.nmls} <span className="mx-2 text-white/30">/</span> {site.licensedIn}
        </p>
      </div>
    </section>
  )
}
