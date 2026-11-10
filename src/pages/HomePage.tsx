import { Hero } from '../components/Hero'
import { Marquee } from '../components/Marquee'
import { QuoteBand } from '../components/QuoteBand'
import { Services } from '../components/Services'
import { Stats } from '../components/Stats'

export function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Marquee />
      <Services />
      <QuoteBand />
    </>
  )
}
