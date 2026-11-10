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
    <section id="services" className="green-field px-6 py-24 text-white md:px-12 lg:px-16 lg:py-28">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="max-w-3xl text-balance text-4xl font-normal leading-[1.08] tracking-tight md:text-5xl">
            Buying a home or refinancing the one you have, shop your mortgage options and{' '}
            <span className="serif-em">compare rates for free.</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
            Start with a qualifier, check a refinance, or look through fixed, adjustable, FHA, and VA loans.
          </p>
        </div>
        <Link
          to="/apply"
          className="inline-flex shrink-0 self-start rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-brand hover:text-white lg:self-auto"
        >
          Get a free rate quote
        </Link>
      </div>

      <div className="mx-auto mt-16 grid max-w-[1240px] gap-5 lg:mt-24 lg:grid-cols-3">
        {services.map((service, index) => (
          <Link
            key={service.title}
            to={service.href}
            className="group flex flex-col rounded-[28px] border border-white/15 bg-black/25 p-3 backdrop-blur-sm transition-colors hover:border-white/35"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
              <ScrollClip
                src={service.video}
                label={service.alt}
                focus={service.focus}
                reverse={service.href === '/refinance'}
              />
            </div>
            <div className="flex flex-1 flex-col px-3 pb-4 pt-6">
              <p className="text-xs uppercase tracking-[0.14em] text-white/55">
                <span className="text-brand">0{index + 1}</span>
                <span className="mx-2 text-white/30">/</span>
                {service.tag}
              </p>
              <h3 className="mt-3 text-2xl font-normal tracking-tight">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{service.body}</p>
              <span className="mt-auto inline-flex pt-6 text-sm font-medium text-brand transition-transform group-hover:translate-x-1">
                {service.action} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
