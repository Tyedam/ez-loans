import { marqueeItems } from '../site'

export function Marquee() {
  return (
    <section className="bg-black px-6 pb-20 md:px-12 lg:px-16" aria-label="Loan options">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-5 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:gap-14">
        <p className="shrink-0 text-xs uppercase tracking-[0.14em] text-white/45">
          Mortgage options from EZ Loans Group
        </p>
        <div className="marquee min-w-0 flex-1">
          <div className="marquee-track">
            {marqueeItems.map((item) => (
              <span key={item} className="text-lg font-medium text-white/60">
                {item}
              </span>
            ))}
            {marqueeItems.map((item) => (
              <span key={`${item}-repeat`} className="text-lg font-medium text-white/60" aria-hidden="true">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
