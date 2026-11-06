import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageFrame } from '../components/PageFrame'
import { loanLinks, site } from '../site'

type Action = {
  label: string
  href: string
}

type Section = {
  heading: string
  paragraphs: string[]
}

type Story = {
  eyebrow: string
  title: string
  lede: string
  sections: Section[]
  primary?: Action
  secondary?: Action
}

const quote = { label: 'Get a free quote', href: '/apply' }

export const stories = {
  purchase: {
    eyebrow: 'Purchase',
    title: 'Find out how much home you can afford.',
    lede: 'Know what you can afford before you start searching. A purchase qualifier is free.',
    sections: [
      {
        heading: 'How a purchase loan works here',
        paragraphs: [
          'Choosing a purchase loan means matching the program to your goals, then seeing the options that fit your situation.',
          'EZ Loans Group helps first-time buyers and people who have bought before compare programs, starting with a free pre-approval request.',
        ],
      },
      {
        heading: 'The steps',
        paragraphs: [
          'Complete the purchase qualifier.',
          'Review the options that come back for your situation.',
          'Choose the program that fits, with help comparing the differences.',
        ],
      },
    ],
    primary: { label: 'Start the purchase qualifier', href: site.purchaseQualifier },
    secondary: quote,
  },
  refinance: {
    eyebrow: 'Refinance',
    title: 'See whether a refinance fits.',
    lede: 'A refinance checker is free. It shows whether a new loan could change your rate or payment.',
    sections: [
      {
        heading: 'How a refinance works here',
        paragraphs: [
          'A refinance replaces your current mortgage with a new one. The right program depends on your goals, your current loan, and your timeline.',
          'EZ Loans Group starts with a free refinance analysis so you can compare programs before you decide.',
        ],
      },
      {
        heading: 'The steps',
        paragraphs: [
          'Complete the refinance rate checker.',
          'Review the options based on your loan.',
          'Decide whether to move ahead. There is no charge to check.',
        ],
      },
    ],
    primary: { label: 'Check a refinance', href: site.refinanceChecker },
    secondary: quote,
  },
  rates: {
    eyebrow: "Today's rates",
    title: 'Compare a rate for your loan.',
    lede: 'A rate depends on the loan, the property, and your situation. EZ Loans Group does not publish one number for every borrower.',
    sections: [
      {
        heading: 'Get a quote instead of a generic table',
        paragraphs: [
          'The free rate quote uses the same tool as the current EZ Loans site. It asks for your scenario and returns options for that scenario.',
          'A quote is not a commitment to lend, and it is not a lock.',
        ],
      },
    ],
    primary: { label: "See today's rates", href: site.rates },
    secondary: quote,
  },
  about: {
    eyebrow: 'About',
    title: 'Mortgages made EZ.',
    lede: 'Fast. Friendly. EZ. EZ Loans Group is a mortgage team in Troy, Michigan.',
    sections: [
      {
        heading: 'What we do',
        paragraphs: [
          'The mortgage process should be simple, clear, and calm. Whether you are buying, refinancing, or comparing programs, EZ Loans Group walks the file from application to closing.',
          site.mission,
          `Office: ${site.address}. Call ${site.phoneDisplay} or email ${site.email}. NMLS #2273319. Powered by United Lending Team, INC.`,
        ],
      },
    ],
    primary: { label: 'Contact the office', href: '/contact' },
    secondary: quote,
  },
  apply: {
    eyebrow: 'Apply',
    title: 'Start a mortgage application.',
    lede: 'The secure application is the same one EZ Loans Group uses today. Use your best estimate if a document is not in front of you.',
    sections: [
      {
        heading: 'What you will be asked for',
        paragraphs: [
          'Social Security number, contact information, and employment information.',
          'Best estimates of income, assets, and liabilities.',
          'After you submit, the team follows up to finish the package and help you compare programs.',
        ],
      },
    ],
    primary: { label: 'Apply online', href: site.secureApplication },
    secondary: quote,
  },
  tools: {
    eyebrow: 'Free tools',
    title: 'Check a number before you apply.',
    lede: 'Qualifiers, a payment estimate, home search, and a home value check. The qualifier tools open the same secure forms as ezloansmi.com.',
    sections: [
      {
        heading: 'On this site',
        paragraphs: ['The payment calculator runs here. It is an estimate, not a quote and not a loan offer.'],
      },
    ],
    primary: { label: 'Open the calculator', href: '/tools/calculator' },
    secondary: { label: 'Purchase qualifier', href: site.purchaseQualifier },
  },
  loans: {
    eyebrow: 'Loan options',
    title: 'Five ways to finance a home.',
    lede: '30-year fixed, 15-year fixed, adjustable-rate, FHA, and VA. A free quote shows which ones fit.',
    sections: [
      {
        heading: 'Pick a program to read',
        paragraphs: ['Each page explains how that loan works. None of them is a rate offer.'],
      },
    ],
    primary: quote,
    secondary: { label: 'Talk to the office', href: '/contact' },
  },
} satisfies Record<string, Story>

export const loanStories = [
  {
    slug: '30-year-fixed',
    navLabel: '30 Year Fixed',
    story: {
      eyebrow: '30-year fixed',
      title: 'A payment that stays the same.',
      lede: 'The rate and the principal-and-interest payment stay constant for the life of a 30-year fixed loan.',
      sections: [
        {
          heading: 'When people look at it',
          paragraphs: [
            'Borrowers often consider a 30-year fixed loan when they expect to stay in the home for a long time and want the payment to stay predictable.',
            'If you expect to move sooner, a shorter fixed term or an adjustable-rate loan may be worth comparing. A quote shows the difference for your file.',
          ],
        },
      ],
      primary: quote,
      secondary: { label: 'All loan options', href: '/loans' },
    },
  },
  {
    slug: '15-year-fixed',
    navLabel: '15 Year Fixed',
    story: {
      eyebrow: '15-year fixed',
      title: 'Pay the loan off in 15 years.',
      lede: 'A 15-year fixed loan amortizes over 15 years. The payment stays constant, and it is higher than the payment on a 30-year loan for the same amount.',
      sections: [
        {
          heading: 'The tradeoff',
          paragraphs: [
            'You own the home sooner, and the rate is often lower than a 30-year fixed loan. The monthly payment is higher because the term is shorter.',
            'Some people take a 30-year fixed loan and pay extra when they can, instead of committing to the higher required payment. A quote is the way to compare those two paths.',
          ],
        },
      ],
      primary: quote,
      secondary: { label: 'All loan options', href: '/loans' },
    },
  },
  {
    slug: 'adjustable-rate',
    navLabel: 'Adjustable Rate',
    story: {
      eyebrow: 'Adjustable-rate',
      title: 'A rate that can change.',
      lede: 'An adjustable-rate mortgage starts at one rate and can change later on a set schedule. The starting rate is often lower than a fixed-rate loan.',
      sections: [
        {
          heading: 'When people look at it',
          paragraphs: [
            'An ARM is often considered by someone who expects to own the home for only a few years, or who expects income to rise before the rate can adjust.',
            'The payment can go up when the rate adjusts. Read the adjustment schedule in the quote before you choose it over a fixed loan.',
          ],
        },
      ],
      primary: quote,
      secondary: { label: 'All loan options', href: '/loans' },
    },
  },
  {
    slug: 'fha',
    navLabel: 'FHA Loans',
    story: {
      eyebrow: 'FHA',
      title: 'A loan insured by the FHA.',
      lede: 'An FHA loan is insured by the Federal Housing Administration. The insurance reduces the lender’s risk if a borrower defaults.',
      sections: [
        {
          heading: 'What that means',
          paragraphs: [
            'FHA insurance is why some borrowers who would not fit a conventional loan can still be approved. The loan has mortgage insurance costs that a quote should show next to the rate.',
            'EZ Loans Group can compare an FHA option with conventional, VA, and fixed programs for the same purchase or refinance.',
          ],
        },
      ],
      primary: quote,
      secondary: { label: 'All loan options', href: '/loans' },
    },
  },
  {
    slug: 'va',
    navLabel: 'VA Loans',
    story: {
      eyebrow: 'VA',
      title: 'Financing for eligible veterans.',
      lede: 'A VA loan is guaranteed by the U.S. Department of Veterans Affairs. It is for eligible veterans, service members, and certain surviving spouses.',
      sections: [
        {
          heading: 'Eligibility comes first',
          paragraphs: [
            'The lender makes the loan. The VA guarantee is what changes the terms. Eligibility depends on service and, for a surviving spouse, on whether they have remarried.',
            'A quote confirms whether a VA loan is available for your service and how it compares with other programs.',
          ],
        },
      ],
      primary: quote,
      secondary: { label: 'All loan options', href: '/loans' },
    },
  },
]

export function StoryView({ story, extra }: { story: Story; extra?: ReactNode }) {
  return (
    <PageFrame
      eyebrow={story.eyebrow}
      title={story.title}
      lede={story.lede}
      primary={story.primary}
      secondary={story.secondary}
    >
      <div className="grid gap-12 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-10">
          {story.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-neutral-700">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
          {extra}
        </div>
        <aside className="h-fit rounded-[28px] bg-neutral-100 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Loan options</p>
          <ul className="mt-4 space-y-3">
            {loanLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="font-medium hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </PageFrame>
  )
}
