import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { FullScreenSpinner } from '@/components/ui/FullScreenSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppProviders } from '@/app/providers';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { PwaInstallBanner } from '@/components/common/PwaInstallBanner';
import { useThemeInjector } from '@/shared/hooks/useThemeInjector';

/**
 * lazyRetry: Tự động phục hồi khi trình duyệt tải chunk cũ gặp lỗi 404
 * sau các đợt release/build mới mà client chưa F5.
 */
function lazyRetry<T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>,
  componentName = 'chunk'
): React.LazyExoticComponent<React.ComponentType<any>> {
  return lazy(async () => {
    const retryKey = "aegis_chunk_retry_" + componentName;
    try {
      return await factory();
    } catch (error: any) {
      const isChunk = /Failed to fetch dynamically imported module|Loading chunk|Failed to load module script/i.test(
        error?.message || ''
      );
      const hasReloaded = sessionStorage.getItem(retryKey);
      if (isChunk && !hasReloaded) {
        sessionStorage.setItem(retryKey, 'true');
        console.warn(`[lazyRetry] Chunk load failed for ${componentName}. Auto-refreshing once...`);
        window.location.reload();
        return new Promise<T>(() => {});
      }
      throw error;
    }
  });
}

const Dashboard = lazyRetry(() => import('@/pages/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const LandingPage = lazyRetry(() => import('@/pages/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const PracticePage = lazyRetry(() => import('@/pages/practice/PracticePage').then(m => ({ default: m.PracticePage })));
const AttemptRoom = lazyRetry(() => import('@/pages/quiz/AttemptRoom').then(m => ({ default: m.AttemptRoom })));
const AdaptiveExamRoom = lazyRetry(() => import('@/pages/quiz/AdaptiveExamRoom'));
const SecureExamRoom = lazyRetry(() => import('@/pages/quiz/SecureExamRoom'));
const AttemptReview = lazyRetry(() => import('@/pages/quiz/AttemptReview').then(m => ({ default: m.AttemptReview })));
const LeaderboardPage = lazyRetry(() => import('@/pages/gamification/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const AchievementsPage = lazyRetry(() => import('@/pages/gamification/AchievementsPage').then(m => ({ default: m.AchievementsPage })));
const PathExplorer = lazyRetry(() => import('@/pages/paths/PathExplorer').then(m => ({ default: m.PathExplorer })));
const PaywallPage = lazyRetry(() => import('@/pages/paywall/PaywallPage').then(m => ({ default: m.PaywallPage })));
const ArenaHubPage = lazyRetry(() => import('@/pages/arena/ArenaHubPage').then(m => ({ default: m.ArenaHubPage })));
const ArenaJoinPage = lazyRetry(() => import('@/pages/arena/ArenaJoinPage').then(m => ({ default: m.ArenaJoinPage })));
const ArenaRoomPage = lazyRetry(() => import('@/pages/arena/ArenaRoomPage').then(m => ({ default: m.ArenaRoomPage })));
const ArenaStudioPage = lazyRetry(() => import('@/pages/arena/ArenaStudioPage').then(m => ({ default: m.ArenaStudioPage })));
const TeamDashboard = lazyRetry(() => import('@/pages/team-leader/TeamDashboard').then(m => ({ default: m.TeamDashboard })));
const UniversalSymposiumPage = lazyRetry(() => import('@/pages/symposium/UniversalSymposiumPage').then(m => ({ default: m.UniversalSymposiumPage })));
const CreatorZenStudioPage = lazyRetry(() => import('@/pages/creator/studio/CreatorZenStudioPage'));

// Admin Lazy Pages
const AdminLayout = lazyRetry(() => import('@/pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazyRetry(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminQuestionsPage = lazyRetry(() => import('@/pages/admin/questions').then(m => ({ default: m.AdminQuestionsPage })));
const AdminTopicsPage = lazyRetry(() => import('@/pages/admin/topics').then(m => ({ default: m.AdminTopicsPage })));
const AdminParsingRulesPage = lazyRetry(() => import('@/pages/admin/parsing-rules/AdminParsingRulesPage').then(m => ({ default: m.AdminParsingRulesPage })));
const AdminNotebooksPage = lazyRetry(() => import('@/pages/admin/AdminNotebooksPage').then(m => ({ default: m.AdminNotebooksPage })));
const AdminUsersPage = lazyRetry(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminPaymentsPage = lazyRetry(() => import('@/pages/admin/AdminPaymentsPage').then(m => ({ default: m.AdminPaymentsPage })));
const AdminExamsPage = lazyRetry(() => import('@/pages/admin/AdminExamsPage').then(m => ({ default: m.AdminExamsPage })));
const TenantsPage = lazyRetry(() => import('@/pages/admin/tenants/TenantsPage').then(m => ({ default: m.TenantsPage })));
const OrganizationUnitsPage = lazyRetry(() => import('@/pages/admin/org-units/OrganizationUnitsPage').then(m => ({ default: m.OrganizationUnitsPage })));
const AiSettingsPage = lazyRetry(() => import('@/pages/admin/ai/AiSettingsPage').then(m => ({ default: m.AiSettingsPage })));
const PromptForgeAdminPage = lazyRetry(() => import('@/pages/admin/PromptForgeAdminPage').then(m => ({ default: m.PromptForgeAdminPage })));
const SplitScreenStudioPage = lazyRetry(() => import('@/pages/admin/studio').then(m => ({ default: m.SplitScreenStudioPage })));
const TenantThemeCustomizerPage = lazyRetry(() => import('@/pages/admin/white-label').then(m => ({ default: m.TenantThemeCustomizerPage })));

// Auth Lazy Pages
const LoginPage = lazyRetry(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazyRetry(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ResetPasswordPage = lazyRetry(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const CallbackPage = lazyRetry(() => import('@/pages/auth/CallbackPage').then(m => ({ default: m.CallbackPage })));
const QrConfirmPage = lazyRetry(() => import('@/pages/auth/QrConfirmPage').then(m => ({ default: m.QrConfirmPage })));
const ProfilePage = lazyRetry(() => import('@/pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const MobileAppRootPage = lazyRetry(() => import('@/mobile/pages/MobileAppRootPage'));

export default function App() {
  useThemeInjector();
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <Suspense fallback={<FullScreenSpinner />}>
            <Routes>
              {/* [Public Marketing] Landing Page — mặt tiền công khai, không cần đăng nhập */}
              <Route path="/" element={<LandingPage />} />

              {/* Layout for browsing structure context */}
              <Route path="/" element={<MainLayout />}>
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="achievements" element={<AchievementsPage />} />
                <Route path="paths" element={<PathExplorer />} />
                <Route path="arena" element={<ArenaHubPage />} />
                <Route path="team" element={<TeamDashboard />} />
                <Route path="symposium" element={<UniversalSymposiumPage />} />
              </Route>

              {/* [P1 Security] Admin Nested Routes — chỉ Admin mới vào được */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="questions" element={<AdminQuestionsPage />} />`n                <Route path="topics" element={<AdminTopicsPage />} />
                <Route path="parsing-rules" element={<AdminParsingRulesPage />} />
                <Route path="notebooks" element={<AdminNotebooksPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="exams" element={<AdminExamsPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="white-label" element={<TenantThemeCustomizerPage />} />
                <Route path="org-units" element={<OrganizationUnitsPage />} />
                <Route path="ai-settings" element={<AiSettingsPage />} />
                <Route path="ai" element={<AiSettingsPage />} />
                <Route path="prompt-forge" element={<PromptForgeAdminPage />} />
                <Route path="symposium" element={<UniversalSymposiumPage />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<CallbackPage />} />
              <Route path="/auth/qr-confirm" element={<QrConfirmPage />} />
              <Route path="/qr-confirm" element={<QrConfirmPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Practice/Exam is full screen so it stays separate from MainLayout */}
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/creator/studio" element={<ProtectedRoute><CreatorZenStudioPage /></ProtectedRoute>} />
              <Route
                path="/admin/studio"
                element={
                  <ProtectedRoute adminOnly>
                    <SplitScreenStudioPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/paywall" element={<PaywallPage />} />
              <Route path="/arena/join" element={<ArenaJoinPage />} />
              <Route path="/arena/studio" element={<ArenaStudioPage />} />
              <Route path="/arena/:gameCode/:roomId" element={<ArenaRoomPage />} />
              <Route path="/quiz/attempt/adaptive" element={<AdaptiveExamRoom />} />
              <Route path="/quiz/attempt/:id" element={<AttemptRoom />} />
              <Route path="/quiz/secure-attempt/:id" element={<SecureExamRoom />} />
              <Route path="/quiz/:quizId/review/:attemptId" element={<AttemptReview />} />

              {/* [Metamorphic Mobile Engine] Phân hệ Mobile App độc lập đa ngành */}
              <Route path="/m" element={<MobileAppRootPage />} />
              <Route path="/m/:appVariant" element={<MobileAppRootPage />} />
            </Routes>
            <PwaInstallBanner />
          </Suspense>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
