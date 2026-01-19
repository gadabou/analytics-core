import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@store';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, user } = useStore();
  const location = useLocation();

  // Get the intended destination from state, or default to reports
  const from = (location.state as { from?: Location })?.from?.pathname || '/reports';

  if (isAuthenticated) {
    // If user must change password, allow access to change password page
    if (user?.mustChangeDefaultPassword && location.pathname === '/auths/change-default-password') {
      return <>{children}</>;
    }

    // Redirect authenticated users away from public routes
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
