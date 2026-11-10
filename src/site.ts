export const site = {
  name: 'EZ Loans',
  home: 'https://ezloansmi.com/',
  apply: 'https://ezloansmi.com/apply/',
  purchase: 'https://ezloansmi.com/buy/',
  refinance: 'https://ezloansmi.com/refinance/',
  rates: 'https://ezloansmi.com/funnels/dmabrouk-rates-site-26854.itclix.com',
  calculator: 'https://ezloansmi.com/mortgage-calculator/',
  about: 'https://ezloansmi.com/about-us/',
  contact: 'https://ezloansmi.com/contact/',
  purchaseQualifier: 'https://ezloansmi.com/funnels/dmabrouk-purchase-site-26854.itclix.com',
  refinanceChecker: 'https://ezloansmi.com/funnels/dmabrouk-refinance-site-26854.itclix.com',
  phoneDisplay: '(844) 204-7863',
  phoneHref: 'tel:8442047863',
  email: 'info@ezloansmi.com',
  address: '1019 Naughton Rd, Troy, MI 48083',
  nmls: 'NMLS #2273319',
  licensedIn: 'Licensed in 36 states + DC',
  facebook: 'https://www.facebook.com/people/EZ-Loans/',
  instagram: 'https://www.instagram.com/ezloansmi/',
  secureApplication: 'https://ezloansmi.com/secure-application',
  privacy: '/privacy',
  accessibility: '/accessibility',
  nmlsAccess: 'http://www.nmlsconsumeraccess.org/',
  mission:
    'EZ Loans Group is your online resource for personalized mortgage solutions, fast customized quotes, great rates, and service with integrity.',
  license:
    'NMLS #2273319 | (844) 204-7863. Licensed in: AL, AZ, AR, CA, CO, CT, DC, FL, GA, ID, IL, IN, IA, KS, MD, MA, MI, MN, MT, NE, NH, NJ, NC, ND, OH, OK, OR, PA, SC, SD, TN, TX, UT, VA, WA, WI, WY.',
} as const

export const navLinks = [
  { label: 'Purchase', href: '/purchase' },
  { label: 'Refinance', href: '/refinance' },
  { label: 'Rates', href: '/rates' },
  { label: 'Loans', href: '/loans' },
  { label: 'Tools', href: '/tools' },
  { label: 'About', href: '/about' },
] as const

export const loanLinks = [
  { label: '30 Year Fixed', href: '/loans/30-year-fixed' },
  { label: '15 Year Fixed', href: '/loans/15-year-fixed' },
  { label: 'Adjustable Rate', href: '/loans/adjustable-rate' },
  { label: 'FHA Loans', href: '/loans/fha' },
  { label: 'VA Loans', href: '/loans/va' },
] as const

export const toolLinks = [
  { label: 'Home Purchase Qualifier', href: site.purchaseQualifier },
  { label: 'Refinance Rate Checker', href: site.refinanceChecker },
  { label: 'Pre-Approval Letter', href: 'https://ezloansmi.com/funnels/dmabrouk-pre-approval-letter-site-26854.itclix.com' },
  { label: 'Refinance Analysis', href: 'https://ezloansmi.com/funnels/dmabrouk-refi-analysis-site-26854.itclix.com' },
  { label: 'Payment Calculator', href: '/tools/calculator' },
  { label: 'Search Homes for Sale', href: 'https://ezloansmi.com/funnels/dmabrouk-find-a-home-site-26854.itclix.com' },
  { label: 'Home Value Estimate', href: 'https://ezloansmi.com/funnels/dmabrouk-home-valuation-address-site-26854.itclix.com' },
  { label: 'Home Insurance Quote', href: 'https://ezloansmi.com/funnels/home-site-26854-dm.secure-clix.com' },
] as const

export const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Apply', href: '/apply' },
  { label: "Today's Rates", href: '/rates' },
  { label: 'Purchase', href: '/purchase' },
  { label: 'Refinance', href: '/refinance' },
] as const

export const marqueeItems = [
  '30-Year Fixed',
  '15-Year Fixed',
  'FHA',
  'VA',
  'ARM',
  'Purchase',
  'Refinance',
  'Pre-Approval',
] as const
