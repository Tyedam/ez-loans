import { Link } from 'react-router-dom'
import { PageFrame } from '../components/PageFrame'
import { toolLinks } from '../site'
import { StoryView, stories } from './StoryPage'

function ToolLink({ href, children }: { href: string; children: string }) {
  const className = 'block rounded-2xl border border-black/10 px-5 py-4 font-medium hover:border-brand hover:text-brand'
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

export function ToolsPage() {
  return (
    <StoryView
      story={stories.tools}
      extra={
        <ul className="grid gap-3 sm:grid-cols-2">
          {toolLinks.map((tool) => (
            <li key={tool.label}>
              <ToolLink href={tool.href}>{tool.label}</ToolLink>
            </li>
          ))}
        </ul>
      }
    />
  )
}

export function CalculatorPage() {
  return (
    <PageFrame
      eyebrow="Payment calculator"
      title="Estimate a monthly payment."
      lede="This is math on the numbers you type. It is not a rate quote, a lock, or a commitment to lend."
      primary={{ label: 'Get a real quote', href: '/apply' }}
    >
      <form
        className="grid max-w-xl gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const amount = Number(data.get('amount'))
          const annualRate = Number(data.get('rate'))
          const years = Number(data.get('years'))
          const output = event.currentTarget.querySelector('[data-result]')
          if (!(output instanceof HTMLElement)) return
          if (!amount || !annualRate || !years) {
            output.textContent = 'Enter a loan amount, a rate, and a term.'
            return
          }
          const monthlyRate = annualRate / 100 / 12
          const payments = years * 12
          const payment = (amount * monthlyRate) / (1 - (1 + monthlyRate) ** -payments)
          output.textContent = `Estimated principal and interest: ${payment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} per month.`
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          Loan amount
          <input name="amount" inputMode="decimal" className="rounded-xl border border-black/15 px-4 py-3 text-base font-normal" placeholder="350000" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Interest rate, percent
          <input name="rate" inputMode="decimal" className="rounded-xl border border-black/15 px-4 py-3 text-base font-normal" placeholder="6.5" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Term, years
          <input name="years" inputMode="numeric" defaultValue="30" className="rounded-xl border border-black/15 px-4 py-3 text-base font-normal" />
        </label>
        <button type="submit" className="w-fit rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-black">
          Calculate
        </button>
        <p data-result className="text-lg font-medium" />
        <p className="text-sm leading-relaxed text-neutral-600">
          Taxes, insurance, and mortgage insurance are not included. Type the rate you want to test. This page does not look up today’s market rate.
        </p>
      </form>
    </PageFrame>
  )
}
