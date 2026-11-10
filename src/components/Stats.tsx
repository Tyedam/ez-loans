import { useEffect, useRef } from 'react'
import { loanLinks, site, toolLinks } from '../site'

const MARK_VIDEO = '/media/loans.mp4'

const stats = [
  {
    value: '36',
    unit: '+ DC',
    label: 'States where EZ Loans is licensed, plus Washington, DC.',
  },
  {
    value: String(loanLinks.length),
    unit: '',
    label: 'Loan options: 30-year fixed, 15-year fixed, adjustable rate, FHA, and VA.',
  },
  {
    value: String(toolLinks.length),
    unit: '',
    label: 'Online tools, from the purchase qualifier to the payment calculator.',
  },
  {
    value: 'Free',
    unit: '',
    label: 'Rate quotes and rate comparisons.',
  },
  {
    value: 'Troy',
    unit: 'MI',
    label: site.address,
  },
] as const

function HouseMark() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void video.play().catch(() => undefined)
        } else {
          video.pause()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="house-mark mx-auto aspect-square w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[480px]"
      role="img"
      aria-label="A house silhouette showing a modern home with a patio and glass doors"
    >
      <video
        ref={ref}
        className="h-full w-full object-cover"
        src={MARK_VIDEO}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
    </div>
  )
}

export function Stats() {
  return (
    <section id="facts" className="bg-black px-6 pb-20 pt-24 text-white md:px-12 lg:px-16 lg:pt-32">
      <div className="mx-auto grid max-w-[1240px] gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center">
        <div>
          <h2 className="text-4xl font-normal leading-[1.08] tracking-tight md:text-5xl">
            Compare mortgage options
            <span className="serif-em block">in one place.</span>
          </h2>
          <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-white/60">{site.mission}</p>

          <div className="mt-12 grid max-w-xl grid-cols-2 gap-x-10 gap-y-9">
            {stats.map((stat) => (
              <div key={stat.value}>
                <p className="text-4xl font-normal tracking-tight md:text-5xl">
                  {stat.value}
                  {stat.unit ? <span className="ml-1.5 text-xl text-brand md:text-2xl">{stat.unit}</span> : null}
                </p>
                <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-white/55">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <HouseMark />
      </div>
    </section>
  )
}
