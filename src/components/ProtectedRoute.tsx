import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole, UserRole } from '@/hooks/useRole';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/auth' 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        window.location.href = redirectTo;
        return;
      }

      if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        window.location.href = '/dashboard';
        return;
      }
    }
  }, [user, role, authLoading, roleLoading, allowedRoles, redirectTo]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;