import { marqueeItems } from '../site'

export function Marquee() {
  const items = [...marqueeItems, ...marqueeItems]

  return (
    <section className="border-y border-white/10 bg-black py-10" aria-label="Loan options">
      <p className="mb-6 text-center text-xs uppercase tracking-[0.14em] text-gray-400">
        Mortgage options from EZ Loans Group
      </p>
      <div className="marquee">
        <div className="marquee-track">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className="text-lg font-medium text-brand">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
