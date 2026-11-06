import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import { SiteLayout } from './components/SiteLayout'
import { ContactPage } from './pages/ContactPage'
import { AccessibilityPage, PrivacyPage } from './pages/LegalPages'
import { HomePage } from './pages/HomePage'
import { StoryView, loanStories, stories } from './pages/StoryPage'
import { CalculatorPage, ToolsPage } from './pages/ToolsPage'

function LoanPage() {
  const { slug } = useParams()
  const loan = loanStories.find((item) => item.slug === slug)
  if (!loan) {
    return (
      <StoryView
        story={{
          ...stories.loans,
          title: 'That loan page is not on this site.',
          lede: 'Choose one of the five loan options.',
        }}
      />
    )
  }
  return <StoryView story={loan.story} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="purchase" element={<StoryView story={stories.purchase} />} />
          <Route path="refinance" element={<StoryView story={stories.refinance} />} />
          <Route path="rates" element={<StoryView story={stories.rates} />} />
          <Route path="about" element={<StoryView story={stories.about} />} />
          <Route path="apply" element={<StoryView story={stories.apply} />} />
          <Route path="loans" element={<StoryView story={stories.loans} />} />
          <Route path="loans/:slug" element={<LoanPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="tools/calculator" element={<CalculatorPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="accessibility" element={<AccessibilityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
