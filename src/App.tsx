import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import PricingPage from './pages/PricingPage'
import CompletePricingPage from './pages/CompletePricingPage'
import SubscriptionPage from './pages/SubscriptionPage'
import AdminPage from './pages/AdminPage'
import TestSeoPage from './pages/seo/TestSeoPage'
import LandingBasedSeoPage from './pages/seo/LandingBasedSeoPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import ContactPage from './pages/ContactPage'
import PixelTestPage from './pages/PixelTestPage'
import CukrarnaPage from './pages/CukrarnaPage'
import SocialMediaPage from './pages/SocialMediaPage'
import NavodyPage from './pages/NavodyPage'
import { AdminFixPage } from './pages/AdminFixPage'
import ContentMarketingPage from './pages/ContentMarketingPage'
import CookiesBanner from './components/CookiesBanner'
import { useAuthStore } from './store/authStore'

function App() {
  const initAuth = useAuthStore((state) => state.initAuth)

  useEffect(() => {
    const unsubscribe = initAuth()
    return () => unsubscribe()
  }, [initAuth])

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/content-marketing" element={<ContentMarketingPage />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/complete-pricing" element={<CompletePricingPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin-fix-stripe" element={<AdminFixPage />} />
        
        {/* Legal pages */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/navody" element={<NavodyPage />} />
        
        {/* Test routes */}
        <Route path="/test-seo" element={<TestSeoPage />} />
        <Route path="/pixel-test" element={<PixelTestPage />} />
        <Route path="/demo/cukrarna-sladky-raj" element={<CukrarnaPage />} />
        <Route path="/demo/socialni-sila" element={<SocialMediaPage />} />
        
        {/* Dynamic programmatic SEO routes */}
        <Route path="/web-pro-*" element={<LandingBasedSeoPage />} />
        <Route path="/tvorba-webu-*" element={<LandingBasedSeoPage />} />
        <Route path="/templates/*" element={<LandingBasedSeoPage />} />
        <Route path="/examples/*" element={<LandingBasedSeoPage />} />
        
        {/* Fallback for 404 */}
        <Route path="*" element={<HomePage />} />
      </Routes>
      
      {/* Cookies Banner - zobrazuje se na všech stránkách */}
      <CookiesBanner />
    </div>
  )
}

export default App