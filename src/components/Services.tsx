import { Link } from 'react-router-dom'

const services = [
  {
    href: '/purchase',
    tag: 'Purchase',
    title: 'Buy a home',
    body: 'Shop purchase options and use the home purchase qualifier to see what you qualify for.',
    action: 'Start a purchase',
    image:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=70',
    alt: 'A modern house with a lawn and warm exterior lighting',
  },
  {
    href: '/refinance',
    tag: 'Refinance',
    title: 'Refinance your mortgage',
    body: 'Check whether a refinance fits, then review the numbers with the refinance rate checker.',
    action: 'Check refinance',
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=70',
    alt: 'A house key and a small model home on a table',
  },
  {
    href: '/loans',
    tag: 'Loan options',
    title: 'Fixed, ARM, FHA, and VA',
    body: '30-year fixed, 15-year fixed, adjustable-rate, FHA, and VA loans.',
    action: 'See loan options',
    image:
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=70',
    alt: 'A light-colored suburban house with a front porch',
  },
] as const

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
            <img
              src={service.image}
              alt={service.alt}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
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
