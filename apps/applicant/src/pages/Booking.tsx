import { useSearchParams } from 'react-router-dom';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="min-h-screen bg-bg-secondary px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold text-text-primary mb-4">예약 가능</h1>
          <p className="text-text-secondary mb-6">토큰이 유효합니다. 예약을 진행할 수 있습니다.</p>
          <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
            <p className="text-sm text-text-tertiary">Token: {token ? `${token.substring(0, 20)}...` : '없음'}</p>
          </div>
          <p className="text-sm text-text-tertiary mt-4">예약 기능은 다음 단계에서 구현됩니다.</p>
        </div>
      </div>
    </div>
  );
}

