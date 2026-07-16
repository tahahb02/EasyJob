import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import MainLayoutShell from '@/layouts/MainLayoutShell'

// Pages publiques
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'

// Pages protégées
import DashboardPage from '@/pages/dashboard/DashboardPage'
import AnalyticsPage from '@/pages/dashboard/AnalyticsPage'
import NotificationsPage from '@/pages/dashboard/NotificationsPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import CVPage from '@/pages/profile/CVPage'
import PortfolioPage from '@/pages/profile/PortfolioPage'
import SearchPreferencesPage from '@/pages/profile/SearchPreferencesPage'
import JobOffersPage from '@/pages/jobOffers/JobOffersPage'
import JobOfferDetailPage from '@/pages/jobOffers/JobOfferDetailPage'
import ScrapingConfigPage from '@/pages/jobOffers/ScrapingConfigPage'
import SavedJobsPage from '@/pages/jobOffers/SavedJobsPage'
import ApplicationsPage from '@/pages/applications/ApplicationsPage'
import ApplicationDetailPage from '@/pages/applications/ApplicationDetailPage'
import ComposeEmailPage from '@/pages/applications/ComposeEmailPage'
import EmailTemplatesPage from '@/pages/applications/EmailTemplatesPage'
import RecruitersPage from '@/pages/recruiters/RecruitersPage'
import RecruiterDetailPage from '@/pages/recruiters/RecruiterDetailPage'
import NetworkPage from '@/pages/recruiters/NetworkPage'
import MessagesPage from '@/pages/shared/MessagesPage'
import OnboardingPage from '@/pages/OnboardingPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--toast-bg, #1e293b)',
                color: 'var(--toast-color, #f1f5f9)',
                borderRadius: '12px',
                padding: '12px 16px',
              },
            }}
          />
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Routes protégées */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<ProtectedRoute requireOnboarding={false} />}>
              <Route element={<MainLayoutShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/cv" element={<CVPage />} />
                <Route path="/profile/portfolio" element={<PortfolioPage />} />
                <Route path="/profile/search-preferences" element={<SearchPreferencesPage />} />
                <Route path="/jobs" element={<JobOffersPage />} />
                <Route path="/jobs/:id" element={<JobOfferDetailPage />} />
                <Route path="/jobs/scraping-config" element={<ScrapingConfigPage />} />
                <Route path="/jobs/saved" element={<SavedJobsPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/applications/:id" element={<ApplicationDetailPage />} />
                <Route path="/applications/compose/:jobOfferId" element={<ComposeEmailPage />} />
                <Route path="/applications/templates" element={<EmailTemplatesPage />} />
                <Route path="/recruiters" element={<RecruitersPage />} />
                <Route path="/recruiters/:id" element={<RecruiterDetailPage />} />
                <Route path="/network" element={<NetworkPage />} />
                <Route path="/messages" element={<MessagesPage />} />
              </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
