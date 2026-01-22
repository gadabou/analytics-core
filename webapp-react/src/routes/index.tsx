import { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SuspenseLoader } from '@components/loaders';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import * as Pages from './lazy';

export function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<SuspenseLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/reports" replace />} />

          {/* Auth routes (public) */}
          <Route
            path="/auths/login"
            element={
              <PublicRoute>
                <Pages.LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auths/change-default-password"
            element={
              <PrivateRoute>
                <Pages.ChangePasswordPage />
              </PrivateRoute>
            }
          />

          {/* Reports routes (private) */}
          <Route
            path="/reports/*"
            element={
              <PrivateRoute>
                <Pages.ReportsPage />
              </PrivateRoute>
            }
          />

          {/* Dashboard routes (private) */}
          <Route
            path="/dashboards/monthly/*"
            element={
              <PrivateRoute>
                <Pages.MonthlyDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboards/realtime/*"
            element={
              <PrivateRoute>
                <Pages.RealtimeDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboards"
            element={<Navigate to="/dashboards/monthly" replace />}
          />

          {/* Maps route (private) */}
          <Route
            path="/maps/*"
            element={
              <PrivateRoute>
                <Pages.MapsPage />
              </PrivateRoute>
            }
          />

          {/* Users routes (private) */}
          <Route
            path="/users/list"
            element={
              <PrivateRoute>
                <Pages.UsersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/users/roles"
            element={
              <PrivateRoute>
                <Pages.RolesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={<Navigate to="/users/list" replace />}
          />

          {/* Admin route (private) */}
          <Route
            path="/administration/*"
            element={
              <PrivateRoute>
                <Pages.AdminPage />
              </PrivateRoute>
            }
          />

          {/* Managements route (private) */}
          <Route
            path="/managements/*"
            element={
              <PrivateRoute>
                <Pages.ManagementsPage />
              </PrivateRoute>
            }
          />

          {/* Documentation route (public) */}
          <Route path="/documentations/*" element={<Pages.DocumentationPage />} />

          {/* Settings route (private) */}
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Pages.SettingsPage />
              </PrivateRoute>
            }
          />

          {/* Error pages */}
          <Route path="/errors/401" element={<Pages.UnauthorizedPage />} />
          <Route path="/errors/500" element={<Pages.ServerErrorPage />} />
          <Route path="/errors/404" element={<Pages.NotFoundPage />} />

          {/* Catch all - 404 */}
          <Route path="*" element={<Pages.NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
