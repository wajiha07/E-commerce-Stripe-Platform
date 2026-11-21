import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({
  children,
  staff = false,
}: {
  children: ReactNode;
  staff?: boolean;
}) {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container" style={{ padding: '4rem 0' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (staff && !isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}
