import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@shared/ui/ErrorBoundary'
import { AuthProvider } from '@features/auth/auth'
import { LocaleProvider } from '@features/i18n/i18n'
import { RequireAuth } from '@features/auth/requireAuth'
import { RequireAppUser } from '@features/auth/requireAppUser'
import { RequireSeller } from '@features/auth/requireSeller'
import { RequireInvestor } from '@features/auth/requireInvestor'
import { RequireInstitutional } from '@features/auth/requireInstitutional'
import { RequireAdmin } from '@features/auth/requireAdmin'

const PublicLayout = lazy(async () => ({ default: (await import('@widgets/layout/PublicLayout')).PublicLayout }))
const AppLayout = lazy(async () => ({ default: (await import('@widgets/layout/AppLayout')).AppLayout }))
const AdminLayout = lazy(async () => ({ default: (await import('@widgets/layout/AdminLayout')).AdminLayout }))

const LandingPage = lazy(async () => ({ default: (await import('@pages/public/LandingPage')).LandingPage }))
const CatalogPage = lazy(async () => ({ default: (await import('@pages/public/CatalogPage')).CatalogPage }))
const ProductDetailPage = lazy(async () => ({ default: (await import('@pages/public/ProductDetailPage')).ProductDetailPage }))
const SellerDetailPage = lazy(async () => ({ default: (await import('@pages/public/SellerDetailPage')).SellerDetailPage }))
const AnalyticsFeedPage = lazy(async () => ({ default: (await import('@pages/public/AnalyticsFeedPage')).AnalyticsFeedPage }))
const AnalyticsArticlePage = lazy(async () => ({ default: (await import('@pages/public/AnalyticsArticlePage')).AnalyticsArticlePage }))
const AboutPage = lazy(async () => ({ default: (await import('@pages/public/AboutPage')).AboutPage }))
const InvestmentsPage = lazy(async () => ({ default: (await import('@pages/public/InvestmentsPage')).InvestmentsPage }))
const InvestmentDetailPage = lazy(async () => ({ default: (await import('@pages/public/InvestmentDetailPage')).InvestmentDetailPage }))
const ContactsPage = lazy(async () => ({ default: (await import('@pages/public/ContactsPage')).ContactsPage }))
const LoginPage = lazy(async () => ({ default: (await import('@pages/public/LoginPage')).LoginPage }))
const RegisterPage = lazy(async () => ({ default: (await import('@pages/public/RegisterPage')).RegisterPage }))
const RequestAccessPage = lazy(async () => ({ default: (await import('@pages/public/RequestAccessPage')).RequestAccessPage }))
const EmailVerifyPage = lazy(async () => ({ default: (await import('@pages/public/EmailVerifyPage')).EmailVerifyPage }))
const NotFoundPage = lazy(async () => ({ default: (await import('@pages/public/NotFoundPage')).NotFoundPage }))

const VerificationPage = lazy(async () => ({ default: (await import('@pages/public/VerificationPage')).VerificationPage }))

const AppHomePage = lazy(async () => ({ default: (await import('@pages/app/AppHomePage')).AppHomePage }))
const AppCatalogPage = lazy(async () => ({ default: (await import('@pages/app/AppCatalogPage')).AppCatalogPage }))
const AppCatalogProductPage = lazy(async () => ({ default: (await import('@pages/app/AppCatalogProductPage')).AppCatalogProductPage }))
const AppDealsPage = lazy(async () => ({ default: (await import('@pages/app/AppDealsPage')).AppDealsPage }))
const AppDealDetailPage = lazy(async () => ({ default: (await import('@pages/app/AppDealDetailPage')).AppDealDetailPage }))
const AppMessagesPage = lazy(async () => ({ default: (await import('@pages/app/AppMessagesPage')).AppMessagesPage }))
const AppProductsDetailPage = lazy(async () => ({ default: (await import('@pages/app/AppProductsDetailPage')).AppProductsDetailPage }))
const AppProductsListPage = lazy(async () => ({ default: (await import('@pages/app/AppProductsListPage')).AppProductsListPage }))
const AppProductsUpsertPage = lazy(async () => ({ default: (await import('@pages/app/AppProductsUpsertPage')).AppProductsUpsertPage }))
const AppSettingsPage = lazy(async () => ({ default: (await import('@pages/app/AppSettingsPage')).AppSettingsPage }))
const AppInvestmentRequestsPage = lazy(async () => ({ default: (await import('@pages/app/AppInvestmentRequestsPage')).AppInvestmentRequestsPage }))
const AppInvestmentsListPage = lazy(async () => ({ default: (await import('@pages/app/AppInvestmentsListPage')).AppInvestmentsListPage }))
const AppInvestmentUpsertPage = lazy(async () => ({ default: (await import('@pages/app/AppInvestmentUpsertPage')).AppInvestmentUpsertPage }))
const AppRfqListPage = lazy(async () => ({ default: (await import('@pages/app/AppRfqListPage')).AppRfqListPage }))
const AppRfqUpsertPage = lazy(async () => ({ default: (await import('@pages/app/AppRfqUpsertPage')).AppRfqUpsertPage }))
const AppRfqDetailPage = lazy(async () => ({ default: (await import('@pages/app/AppRfqDetailPage')).AppRfqDetailPage }))
const AppInstitutionalVerificationPage = lazy(async () => ({ default: (await import('@pages/app/AppInstitutionalVerificationPage')).AppInstitutionalVerificationPage }))
const AppInstitutionalDealsPage = lazy(async () => ({ default: (await import('@pages/app/AppInstitutionalDealsPage')).AppInstitutionalDealsPage }))
const AppInstitutionalInvestmentsPage = lazy(async () => ({ default: (await import('@pages/app/AppInstitutionalInvestmentsPage')).AppInstitutionalInvestmentsPage }))
const AppInstitutionalReportsPage = lazy(async () => ({ default: (await import('@pages/app/AppInstitutionalReportsPage')).AppInstitutionalReportsPage }))

const AdminDashboardPage = lazy(async () => ({ default: (await import('@pages/admin/AdminDashboardPage')).AdminDashboardPage }))
const AdminDealsPage = lazy(async () => ({ default: (await import('@pages/admin/AdminDealsPage')).AdminDealsPage }))
const AdminDealDetailPage = lazy(async () => ({ default: (await import('@pages/admin/AdminDealDetailPage')).AdminDealDetailPage }))
const AdminStatisticsPage = lazy(async () => ({ default: (await import('@pages/admin/AdminStatisticsPage')).AdminStatisticsPage }))
const AdminAnalyticsPage = lazy(async () => ({ default: (await import('@pages/admin/AdminAnalyticsPage')).AdminAnalyticsPage }))
const AdminReportsPage = lazy(async () => ({ default: (await import('@pages/admin/AdminReportsPage')).AdminReportsPage }))
const AdminDocumentsPage = lazy(async () => ({ default: (await import('@pages/admin/AdminDocumentsPage')).AdminDocumentsPage }))
const AdminMessagesPage = lazy(async () => ({ default: (await import('@pages/admin/AdminMessagesPage')).AdminMessagesPage }))
const AdminUsersPage = lazy(async () => ({ default: (await import('@pages/admin/AdminUsersPage')).AdminUsersPage }))
const AdminUserDetailPage = lazy(async () => ({ default: (await import('@pages/admin/AdminUserDetailPage')).AdminUserDetailPage }))
const AdminCatalogPage = lazy(async () => ({ default: (await import('@pages/admin/AdminCatalogPage')).AdminCatalogPage }))
const AdminCatalogProductPage = lazy(async () => ({ default: (await import('@pages/admin/AdminCatalogProductPage')).AdminCatalogProductPage }))
const AdminSettingsPage = lazy(async () => ({ default: (await import('@pages/admin/AdminSettingsPage')).AdminSettingsPage }))
const AdminVerificationPage = lazy(async () => ({ default: (await import('@pages/admin/AdminVerificationPage')).AdminVerificationPage }))
const AdminInvestmentsPage = lazy(async () => ({ default: (await import('@pages/admin/AdminInvestmentsPage')).AdminInvestmentsPage }))
const AdminAuditLogPage = lazy(async () => ({ default: (await import('@pages/admin/AdminAuditLogPage')).AdminAuditLogPage }))
const AdminNewsPage = lazy(async () => ({ default: (await import('@pages/admin/AdminNewsPage')).AdminNewsPage }))
const AdminNewsEditorPage = lazy(async () => ({ default: (await import('@pages/admin/AdminNewsEditorPage')).AdminNewsEditorPage }))

/**
 * Canonical route tree for the product.
 * Every migration step should preserve this public/app/admin structure,
 * redirects, and guard behavior unless an explicit compatibility layer
 * replaces it one-to-one.
 */
export default function App() {
  return (
    <ErrorBoundary>
    <LocaleProvider>
    <AuthProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Загрузка интерфейса...</div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/product/:slug" element={<ProductDetailPage />} />
            <Route path="/catalog/seller/:id" element={<SellerDetailPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/analytics" element={<AnalyticsFeedPage />} />
            <Route path="/analytics/:slug" element={<AnalyticsArticlePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/investments/:id" element={<InvestmentDetailPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/request-access" element={<RequestAccessPage />} />
            <Route path="/verify-email" element={<EmailVerifyPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<RequireAppUser />}>
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<AppHomePage />} />
                <Route path="catalog" element={<AppCatalogPage />} />
                <Route path="catalog/product/:slug" element={<AppCatalogProductPage />} />
                <Route path="products" element={<RequireSeller />}>
                  <Route index element={<AppProductsListPage />} />
                  <Route path="new" element={<AppProductsUpsertPage mode="create" />} />
                  <Route path=":id" element={<AppProductsDetailPage />} />
                  <Route path=":id/edit" element={<AppProductsUpsertPage mode="edit" />} />
                </Route>
                <Route path="rfq">
                  <Route index element={<AppRfqListPage />} />
                  <Route path="new" element={<AppRfqUpsertPage mode="create" />} />
                  <Route path=":id" element={<AppRfqDetailPage />} />
                  <Route path=":id/edit" element={<AppRfqUpsertPage mode="edit" />} />
                </Route>
                <Route path="messages" element={<AppMessagesPage />} />
                <Route path="messages/:threadId" element={<AppMessagesPage />} />
                <Route path="deals" element={<AppDealsPage />} />
                <Route path="deals/:id" element={<AppDealDetailPage />} />
                <Route path="settings" element={<AppSettingsPage />} />
                <Route path="verification" element={<VerificationPage />} />
                <Route path="investment-requests" element={<AppInvestmentRequestsPage />} />
                <Route path="investments" element={<RequireInvestor />}>
                  <Route index element={<AppInvestmentsListPage />} />
                  <Route path="new" element={<AppInvestmentUpsertPage mode="create" />} />
                  <Route path=":id/edit" element={<AppInvestmentUpsertPage mode="edit" />} />
                </Route>
                <Route path="institutional" element={<RequireInstitutional />}>
                  <Route path="verification" element={<AppInstitutionalVerificationPage />} />
                  <Route path="deals" element={<AppInstitutionalDealsPage />} />
                  <Route path="investments" element={<AppInstitutionalInvestmentsPage />} />
                  <Route path="reports" element={<AppInstitutionalReportsPage />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="deals" element={<AdminDealsPage />} />
                <Route path="deals/:id" element={<AdminDealDetailPage />} />
                <Route path="documents" element={<AdminDocumentsPage />} />
                <Route path="messages" element={<AdminMessagesPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="users/:id" element={<AdminUserDetailPage />} />
                <Route path="catalog" element={<AdminCatalogPage />} />
                <Route path="catalog/:id" element={<AdminCatalogProductPage />} />
                <Route path="statistics" element={<AdminStatisticsPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="verification" element={<AdminVerificationPage />} />
                <Route path="investments" element={<AdminInvestmentsPage />} />
                <Route path="audit-log" element={<AdminAuditLogPage />} />
                <Route path="news" element={<AdminNewsPage />} />
                <Route path="news/new" element={<AdminNewsEditorPage mode="create" />} />
                <Route path="news/:id/edit" element={<AdminNewsEditorPage mode="edit" />} />
                {/* RFQ — admin views the buyer/seller RFQ pages mounted here
                    so they stay inside AdminLayout. Auth-aware basePath inside
                    the components handles the routing. */}
                <Route path="rfq">
                  <Route index element={<AppRfqListPage />} />
                  <Route path=":id" element={<AppRfqDetailPage />} />
                </Route>
                {/* Legacy redirect */}
                <Route path="purchase-intents" element={<Navigate to="/admin/deals" replace />} />
                <Route path="purchase-intents/:id" element={<Navigate to="/admin/deals" replace />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
    </LocaleProvider>
    </ErrorBoundary>
  )
}
