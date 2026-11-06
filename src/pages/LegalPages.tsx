import { PageFrame } from '../components/PageFrame'
import { site } from '../site'

const privacyParagraphs = [
  'This privacy policy applies to this site and the products and services offered by EZ Loans Group.',
  'EZ Loans Group may collect personal information when you register, subscribe, respond to a survey, or fill out a form. That can include your name, email address, and phone number. You can browse without submitting that information. Refusing it may limit some site activities.',
  'The site may also collect non-personal information such as browser type, device type, operating system, and internet provider.',
  'The site may use cookies. You can set your browser to refuse cookies. Some parts of the site may not work if you do.',
  'No mobile information will be shared with third parties or affiliates for their marketing. Text-message opt-in data and consent are not shared with third parties.',
  'EZ Loans Group uses security measures meant to protect personal information from unauthorized access, alteration, disclosure, or destruction.',
  'Links on this site can leave for other companies. Those sites have their own policies. EZ Loans Group does not control them.',
  'The site does not knowingly collect information from children under 13, and it is not structured to attract them.',
  'EZ Loans Group may update this policy. Continued use of the site after a change means you accept the update. The source policy was last updated on February 16, 2017.',
  `Questions: EZ Loans Group, ${site.address}, ${site.phoneDisplay}, ${site.email}.`,
]

export function PrivacyPage() {
  return (
    <PageFrame
      eyebrow="Privacy"
      title="How EZ Loans Group handles information."
      lede="This page restates the privacy policy published by EZ Loans Group."
    >
      <div className="max-w-3xl space-y-4 text-base leading-relaxed text-neutral-700">
        {privacyParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </PageFrame>
  )
}

export function AccessibilityPage() {
  return (
    <PageFrame
      eyebrow="Accessibility"
      title="Need the site another way?"
      lede="Call or email and the office will help you get the same information."
      primary={{ label: 'Email access help', href: `mailto:${site.email}?subject=${encodeURIComponent('Website accessibility')}` }}
    >
      <div className="max-w-3xl space-y-4 text-base leading-relaxed text-neutral-700">
        <p>
          If a page is hard to use, contact EZ Loans Group at {site.phoneDisplay} or {site.email}. Include the page you were on and what you needed.
        </p>
        <p>Office: {site.address}.</p>
      </div>
    </PageFrame>
  )
}
