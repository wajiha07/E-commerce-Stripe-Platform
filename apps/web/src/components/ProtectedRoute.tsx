import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({
  children,
  staff = false,
  seller = false,
}: {
  children: ReactNode;
  staff?: boolean;
  seller?: boolean;
}) {
  const { user, loading, isStaff, isSeller } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container" style={{ padding: '4rem 0' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (staff && !isStaff) return <Navigate to="/" replace />;
  if (seller && !isSeller) return <Navigate to="/sell" replace />;
  return <>{children}</>;
}
