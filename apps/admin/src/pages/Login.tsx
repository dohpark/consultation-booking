import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../domains/auth/hooks/useAuth';
import { GoogleSignInButton } from '../domains/auth/components/GoogleSignInButton';
import { loginWithGoogle, fetchUserProfile } from '../domains/auth/services/authService';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = async (idToken: string) => {
    await loginWithGoogle(idToken);
    const userProfile = await fetchUserProfile();
    login(userProfile);
    navigate('/dashboard', { replace: true });
  };

  const handleLoginError = (error: Error) => {
    console.error('Login error:', error);
    alert(error.message || '로그인에 실패했습니다. 다시 시도해주세요.');
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">상담예약 시스템</h1>
          <p className="text-text-secondary">관리자 페이지에 로그인하세요</p>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton onSuccess={handleLoginSuccess} onError={handleLoginError} />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-text-tertiary">Authorized Access Only</span>
          </div>
        </div>

        <p className="text-center text-xs text-text-tertiary">
          Copyright &copy; 2025 Consultation Booking. All rights reserved.
        </p>
      </div>
    </div>
  );
}
