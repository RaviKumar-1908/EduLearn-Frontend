import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAuthUser } from '../utils/auth';
import { enforceActiveSession } from '../utils/authSession';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = getAuthUser();
  const location = useLocation();
  const [status, setStatus] = useState(user ? 'checking' : 'unauthenticated');

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      if (!user) {
        if (mounted) setStatus('unauthenticated');
        return;
      }

      try {
        const result = await enforceActiveSession();
        if (!mounted) return;

        if (!result.allowed) {
          if (result.reason === 'suspended') {
            toast.error('Your account has been suspended. Please contact support or an administrator.');
          }
          setStatus('unauthenticated');
          return;
        }

        setStatus('authorized');
      } catch (error) {
        if (!mounted) return;
        if (import.meta.env.DEV) console.log(error);
        setStatus('authorized');
      }
    };

    validateSession();

    return () => {
      mounted = false;
    };
  }, [user?.token]);

  if (!user || status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === 'checking') {
    return (
      <div className="main-content centered-message" style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role?.toUpperCase();

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
