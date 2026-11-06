import { site } from '../site'

const stats = [
  {
    value: '36',
    unit: '+DC',
    label: 'Licensed in 36 states and Washington, DC.',
    accent: true,
  },
  {
    value: '5',
    unit: '',
    label: '30-year fixed, 15-year fixed, ARM, FHA, and VA.',
    accent: false,
  },
  {
    value: '6',
    unit: '',
    label: 'Pre-approval, refinance analysis, calculator, home search, value, and insurance.',
    accent: false,
  },
  {
    value: 'Troy',
    unit: '',
    label: '1019 Naughton Rd, Troy, MI 48083.',
    accent: false,
  },
] as const

export function Stats() {
  return (
    <section id="facts" className="bg-white px-6 py-24 text-black md:px-12 lg:px-16">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">The facts</p>
          <h2 className="mt-4 max-w-xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Compare mortgage options in one place.
          </h2>
        </div>
        <p className="max-w-[42ch] text-base leading-relaxed text-neutral-600">{site.mission}</p>
      </div>
      <div className="mx-auto mt-14 grid max-w-[1240px] gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.value}
            className={`flex min-h-[220px] flex-col rounded-[28px] p-7 transition duration-500 hover:-translate-y-1.5 ${
              stat.accent ? 'bg-brand text-white' : 'bg-neutral-100 text-black'
            }`}
          >
            <p className="mt-auto text-5xl font-semibold tracking-tight">
              {stat.value}
              {stat.unit ? <span className="text-2xl">{stat.unit}</span> : null}
            </p>
            <p className={`mt-3 text-sm leading-relaxed ${stat.accent ? 'text-white/70' : 'text-neutral-600'}`}>
              {stat.label}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
