import { Link } from 'react-router-dom'
import { site } from '../site'

export function QuoteBand() {
  return (
    <section id="quote" className="bg-black px-6 py-24 md:px-12 lg:px-16">
      <div className="liquid-glass mx-auto max-w-[1240px] rounded-[48px] px-6 py-16 text-center md:px-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Troy, Michigan</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          Get a free rate quote.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-balance text-base leading-relaxed text-gray-300">
          Apply online or call the Troy office at {site.address}.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/apply" className="rounded-lg bg-brand px-8 py-3 font-medium text-white transition-colors hover:bg-white hover:text-brand">
            Get a FREE rate quote
          </Link>
          <a href={site.phoneHref} className="text-lg font-medium text-brand">
            {site.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  )
}
