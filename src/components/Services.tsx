import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const services = [
  {
    href: '/purchase',
    tag: 'Purchase',
    title: 'Buy a home',
    body: 'Shop purchase options and use the home purchase qualifier to see what you qualify for.',
    action: 'Start a purchase',
    video: '/media/purchase.mp4',
    focus: 'center',
    alt: 'A modern house with a garden, glass balcony, and palm trees',
  },
  {
    href: '/refinance',
    tag: 'Refinance',
    title: 'Refinance your mortgage',
    body: 'Check whether a refinance fits, then review the numbers with the refinance rate checker.',
    action: 'Check refinance',
    video: '/media/refinance.mp4',
    focus: 'center',
    alt: 'A bright open living room with wood floors and a staircase',
  },
  {
    href: '/loans',
    tag: 'Loan options',
    title: 'Fixed, ARM, FHA, and VA',
    body: '30-year fixed, 15-year fixed, adjustable-rate, FHA, and VA loans.',
    action: 'See loan options',
    video: '/media/loans.mp4',
    focus: 'center 68%',
    alt: 'A modern house with a patio and glass doors',
  },
] as const

function ScrollClip({
  src,
  label,
  focus,
  reverse = false,
}: {
  src: string
  label: string
  focus: string
  reverse?: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    const card = video?.closest('a')
    if (!video || !card) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let frame = 0
    const update = () => {
      frame = 0
      const rect = card.getBoundingClientRect()
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
      const clamped = Math.min(1, Math.max(0, progress))
      const visible = rect.bottom > 80 && rect.top < window.innerHeight - 80

      if (reduce) {
        video.pause()
        return
      }

      if (visible) {
        if (video.paused) void video.play().catch(() => undefined)
      } else if (!video.paused) {
        video.pause()
      }

      const travel = reverse ? clamped : 1 - clamped
      const scale = 1.12 + clamped * 0.08
      const shift = (travel - 0.5) * -5
      video.style.transform = `translate3d(0, ${shift}%, 0) scale(${scale})`
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [reverse])

  return (
    <video
      ref={ref}
      className="scroll-photo"
      style={{ objectPosition: focus }}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
    />
  )
}

export function Services() {
  return (
    <section id="services" className="bg-black px-6 py-24 text-white md:px-12 lg:px-16">
      <div className="mx-auto max-w-[1240px] text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">How we help</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
          Purchase, refinance, or compare loan options.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-gray-300">
          Start with a qualifier, check a refinance, or look through fixed, adjustable, FHA, and VA loans.
        </p>
      </div>
      <div className="mx-auto mt-14 grid max-w-[1240px] gap-5 lg:grid-cols-3">
        {services.map((service) => (
          <Link
            key={service.title}
            to={service.href}
            className="group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[40px] border border-white/10 p-8"
          >
            <ScrollClip
              src={service.video}
              label={service.alt}
              focus={service.focus}
              reverse={service.href === '/refinance'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="relative">
              <span className="inline-flex rounded-full bg-brand/20 px-3 py-1 text-xs font-medium text-brand">
                {service.tag}
              </span>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-200">{service.body}</p>
              <span className="mt-5 inline-flex text-sm font-medium text-brand">{service.action} →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
