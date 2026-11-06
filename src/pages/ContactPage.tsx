import type { FormEvent } from 'react'
import { PageFrame } from '../components/PageFrame'
import { site } from '../site'

export function ContactPage() {
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '')
    const phone = String(data.get('phone') ?? '')
    const message = String(data.get('message') ?? '')
    const body = `Name: ${name}\nPhone: ${phone}\n\n${message}`
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent('EZ Loans website')}&body=${encodeURIComponent(body)}`
  }

  return (
    <PageFrame
      eyebrow="Contact"
      title="Call, email, or send a note."
      lede={`${site.address}. ${site.phoneDisplay}. ${site.email}.`}
    >
      <div className="grid gap-12 lg:grid-cols-2">
        <form onSubmit={send} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Name
            <input name="name" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Phone
            <input name="phone" required className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Message
            <textarea name="message" required rows={5} className="rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
          <button type="submit" className="w-fit rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-black">
            Email the office
          </button>
        </form>
        <div className="text-base leading-relaxed text-neutral-700">
          <p>
            <a className="font-medium text-brand" href={site.phoneHref}>
              {site.phoneDisplay}
            </a>
          </p>
          <p className="mt-2">
            <a className="font-medium text-brand" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </p>
          <p className="mt-4">{site.address}</p>
        </div>
      </div>
    </PageFrame>
  )
}
