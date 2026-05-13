import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { enforceActiveSession } from '../utils/authSession';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const hasShownToast = useRef(false);

    useEffect(() => {
        const handleRedirect = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            const email = params.get('email');
            const fullName = params.get('fullName');
            const role = params.get('role');
            const error = params.get('error');

            if (token) {
                localStorage.setItem('token', token);

                const sessionResult = await enforceActiveSession();
                if (!sessionResult.allowed) {
                    if (!hasShownToast.current) {
                        toast.error('This account is suspended. Please contact support or an administrator.');
                        hasShownToast.current = true;
                    }
                    navigate('/login');
                    return;
                }

                if (!hasShownToast.current) {
                    toast.success(`Welcome back, ${fullName || email || 'User'}!`);
                    hasShownToast.current = true;
                }

                if (role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (role === 'INSTRUCTOR') {
                    navigate('/instructor/dashboard');
                } else {
                    navigate('/student/dashboard');
                }
            } else if (error) {
                if (!hasShownToast.current) {
                    toast.error(error || 'Authentication failed');
                    hasShownToast.current = true;
                }
                navigate('/login');
            } else {
                navigate('/login');
            }
        };

        handleRedirect();
    }, [navigate, location]);

    return (
        <div className="auth-container">
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 className="text-gradient">Authenticating...</h2>
                <p style={{ color: '#94a3b8' }}>Please wait while we log you in.</p>
            </div>
        </div>
    );
};

export default OAuth2RedirectHandler;
