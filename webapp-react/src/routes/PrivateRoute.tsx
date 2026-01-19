import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@store';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, user } = useStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/auths/login" state={{ from: location }} replace />;
  }

  // If user must change password, redirect to change password page
  if (user?.mustChangeDefaultPassword && location.pathname !== '/auths/change-default-password') {
    return <Navigate to="/auths/change-default-password" replace />;
  }

  return <>{children}</>;
}
