import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { SocketProvider } from '@/context/SocketContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import RoleRoute from '@/components/RoleRoute'
import MainLayoutShell from '@/layouts/MainLayoutShell'

// ─── Pages publiques (chargées dans le bundle initial) ───────────────
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

// ─── Chargement différé ─────────────────────────────────────────────
// Chaque route.Downloaded on demand. Sans cela, un visiteur de la page
// d'accueil téléchargeait les 40+ écrans de l'application (2,48 Mo) alors
// qu'il n'en affiche aucun.
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))

// Candidat
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const AnalyticsPage = lazy(() => import('@/pages/dashboard/AnalyticsPage'))
const NotificationsPage = lazy(() => import('@/pages/dashboard/NotificationsPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const CVPage = lazy(() => import('@/pages/profile/CVPage'))
const PortfolioPage = lazy(() => import('@/pages/profile/PortfolioPage'))
const SearchPreferencesPage = lazy(() => import('@/pages/profile/SearchPreferencesPage'))
const JobOffersPage = lazy(() => import('@/pages/jobOffers/JobOffersPage'))
const JobOfferDetailPage = lazy(() => import('@/pages/jobOffers/JobOfferDetailPage'))
const ScrapingConfigPage = lazy(() => import('@/pages/jobOffers/ScrapingConfigPage'))
const SavedJobsPage = lazy(() => import('@/pages/jobOffers/SavedJobsPage'))
const ApplicationsPage = lazy(() => import('@/pages/applications/ApplicationsPage'))
const InternalApplicationsPage = lazy(() => import('@/pages/applications/InternalApplicationsPage'))
const ApplicationDetailPage = lazy(() => import('@/pages/applications/ApplicationDetailPage'))
const ComposeEmailPage = lazy(() => import('@/pages/applications/ComposeEmailPage'))
const EmailTemplatesPage = lazy(() => import('@/pages/applications/EmailTemplatesPage'))
const RecruitersPage = lazy(() => import('@/pages/recruiters/RecruitersPage'))
const RecruiterDetailPage = lazy(() => import('@/pages/recruiters/RecruiterDetailPage'))
const NetworkPage = lazy(() => import('@/pages/recruiters/NetworkPage'))
const MessagesPage = lazy(() => import('@/pages/shared/MessagesPage'))
const CompanyEmailsPage = lazy(() => import('@/pages/companyEmails/CompanyEmailsPage'))

// Recruteur
const RecruiterDashboardPage = lazy(() => import('@/pages/recruiter/RecruiterDashboardPage'))
const RecruiterJobsPage = lazy(() => import('@/pages/recruiter/RecruiterJobsPage'))
const RecruiterJobCreatePage = lazy(() => import('@/pages/recruiter/RecruiterJobCreatePage'))
const RecruiterJobDetailPage = lazy(() => import('@/pages/recruiter/RecruiterJobDetailPage'))
const RecruiterCandidatesPage = lazy(() => import('@/pages/recruiter/RecruiterCandidatesPage'))
const RecruiterApplicationsPage = lazy(() => import('@/pages/recruiter/RecruiterApplicationsPage'))
const RecruiterProfilePage = lazy(() => import('@/pages/recruiter/RecruiterProfilePage'))

// Admin
import AdminGuard from '@/components/AdminGuard'
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminRecruitersPage = lazy(() => import('@/pages/admin/AdminRecruitersPage'))
const AdminCompaniesPage = lazy(() => import('@/pages/admin/AdminCompaniesPage'))
const AdminJobsPage = lazy(() => import('@/pages/admin/AdminJobsPage'))

/** Affiché pendant le téléchargement d'un écran. */
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <span className="sr-only">Chargement en cours…</span>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
        <BrowserRouter>
          <Toaster />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Routes protégées */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<ProtectedRoute requireOnboarding={false} />}>
              <Route element={<MainLayoutShell />}>
                {/* Candidat routes */}
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
                <Route path="/applications/internal" element={<InternalApplicationsPage />} />
                <Route path="/recruiters" element={<RecruitersPage />} />
                <Route path="/recruiters/:id" element={<RecruiterDetailPage />} />
                <Route path="/network" element={<NetworkPage />} />
                <Route path="/company-emails" element={<CompanyEmailsPage />} />
                <Route path="/messages" element={<MessagesPage />} />

                {/* Recruteur routes — réservées aux recruteurs et administrateurs */}
                <Route element={<RoleRoute roles={['recruiter', 'admin']} redirectTo="/dashboard" />}>
                  <Route path="/recruiter-space/dashboard" element={<RecruiterDashboardPage />} />
                  <Route path="/recruiter-space/jobs" element={<RecruiterJobsPage />} />
                  <Route path="/recruiter-space/jobs/new" element={<RecruiterJobCreatePage />} />
                  <Route path="/recruiter-space/jobs/:id" element={<RecruiterJobDetailPage />} />
                  <Route path="/recruiter-space/candidates" element={<RecruiterCandidatesPage />} />
                  <Route path="/recruiter-space/applications" element={<RecruiterApplicationsPage />} />
                  <Route path="/recruiter-space/profile" element={<RecruiterProfilePage />} />
                </Route>

                {/* Admin routes */}
                <Route element={<AdminGuard />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/recruiters" element={<AdminRecruitersPage />} />
                  <Route path="/admin/companies" element={<AdminCompaniesPage />} />
                  <Route path="/admin/jobs" element={<AdminJobsPage />} />
                </Route>
              </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
