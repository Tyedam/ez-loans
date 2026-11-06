import { AnimatedHeading } from './AnimatedHeading'
import { FadeIn } from './FadeIn'
import { SiteHeader } from './SiteHeader'
import { site } from '../site'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4'

export function Hero() {
  return (
    <section id="top" className="relative h-screen overflow-hidden bg-black text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="px-6 pt-6 md:px-12 lg:px-16">
          <SiteHeader />
        </div>

        <div className="flex flex-1 flex-col justify-end px-6 pb-12 md:px-12 lg:px-16 lg:pb-16">
          <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] lg:items-end lg:gap-10">
            <div>
              <AnimatedHeading text={'Shop mortgage options.\nCompare rates for free.'} />
              <FadeIn delay={800} duration={1000}>
                <p className="mb-6 max-w-md text-base leading-relaxed text-white/85 md:text-lg">
                  Use one of our quick and easy tools to find out what you qualify for.
                </p>
              </FadeIn>
              <FadeIn delay={1200} duration={1000}>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={site.purchaseQualifier}
                    className="rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand sm:text-base"
                  >
                    Purchase qualifier
                  </a>
                  <a
                    href={site.refinanceChecker}
                    className="rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-brand sm:text-base"
                  >
                    Refinance checker
                  </a>
                </div>
              </FadeIn>
            </div>

            <div className="mt-8 flex items-end justify-start lg:mt-0 lg:justify-end">
              <FadeIn delay={1400} duration={1000}>
                <div className="liquid-glass rounded-xl border border-white/20 px-5 py-4 text-left">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/70">Licensed in</p>
                  <p className="mt-1 text-2xl font-medium leading-none text-brand">36 states + DC</p>
                  <p className="mt-2 text-sm text-white/80">NMLS #2273319</p>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
