import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useValidateToken } from '../hooks/useValidateToken';

export default function Landing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { data, isError, isSuccess, error, isLoading } = useValidateToken(token);

  useEffect(() => {
    // token이 없으면 Error 화면으로 이동
    if (!token) {
      navigate('/error?reason=no-token', { replace: true });
      return;
    }

    // 토큰 검증 성공 시 Booking 화면으로 이동
    if (isSuccess && data) {
      navigate(`/booking?token=${encodeURIComponent(token)}`, { replace: true });
      return;
    }

    // 토큰 검증 실패 시 Error 화면으로 이동
    if (isError) {
      navigate('/error?reason=invalid-token', { replace: true });
      return;
    }
  }, [token, isSuccess, isError, data, error, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary mx-auto mb-4"></div>
        <p className="text-text-secondary">토큰을 검증하는 중...</p>
      </div>
    </div>
  );
}
