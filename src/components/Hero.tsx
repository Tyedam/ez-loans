import { AnimatedHeading, type HeadingLine } from './AnimatedHeading'
import { FadeIn } from './FadeIn'
import { SiteHeader } from './SiteHeader'
import { site } from '../site'

export const HERO_VIDEO = '/media/detroit-night.mp4'

const headline: readonly HeadingLine[] = [
  { text: 'Shop mortgage options.' },
  { text: 'Compare rates for free.', serif: true },
]

type HeroProps = {
  /**
   * Lay the hero over the pinned scroll story, which is already playing the skyline clip behind it.
   * The story slides the copy away by setting --hero-shift.
   */
  pinned?: boolean
}

export function Hero({ pinned = false }: HeroProps) {
  return (
    <section
      id="top"
      className={
        pinned ? 'absolute inset-0 text-white' : 'relative h-screen min-h-[620px] overflow-hidden bg-black text-white'
      }
    >
      {pinned ? null : (
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      )}
      {/* A short fade under the type only, so the towers and the river stay visible. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
        aria-hidden="true"
      />

      <div
        className="relative z-10 flex h-full flex-col"
        style={pinned ? { transform: 'translate3d(0, var(--hero-shift, 0px), 0)' } : undefined}
      >
        <div className="px-6 pt-6 md:px-12 lg:px-16">
          <SiteHeader />
        </div>

        <div className="mt-auto px-6 pb-7 md:px-12 lg:px-16 lg:pb-9">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-end lg:gap-16">
            <div className="hero-copy">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-white/80">Metro Detroit</p>
              <AnimatedHeading lines={headline} />
              <FadeIn delay={800} duration={1000}>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-white/90 md:text-base">
                  Use one of our quick and easy tools to find out what you qualify for.
                </p>
              </FadeIn>
            </div>

            <FadeIn delay={1200} duration={1000}>
              <p className="hidden max-w-sm text-sm leading-relaxed text-white/90 lg:block">{site.mission}</p>
              <div className="flex flex-wrap gap-3 lg:mt-6">
                <a
                  href={site.purchaseQualifier}
                  className="rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand"
                >
                  Purchase qualifier
                </a>
                <a
                  href={site.refinanceChecker}
                  className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-brand"
                >
                  Refinance checker
                </a>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={1400} duration={1000}>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-white/25 pt-4 text-xs text-white/85">
              <p>
                {site.nmls} <span className="mx-2 text-white/40">/</span> {site.licensedIn}
              </p>
              <a href={site.phoneHref} className="transition-colors hover:text-brand">
                {site.phoneDisplay}
              </a>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
