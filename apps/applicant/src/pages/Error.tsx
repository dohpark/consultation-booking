import { useSearchParams } from 'react-router-dom';

export default function Error() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  const getErrorMessage = () => {
    switch (reason) {
      case 'no-token':
        return {
          title: '토큰이 필요합니다',
          message: '예약 페이지에 접근하려면 유효한 토큰이 필요합니다. 상담사로부터 받은 초대 링크를 사용해주세요.',
        };
      case 'invalid-token':
        return {
          title: '유효하지 않은 토큰입니다',
          message: '토큰이 만료되었거나 유효하지 않습니다. 상담사에게 새로운 초대 링크를 요청해주세요.',
        };
      default:
        return {
          title: '오류가 발생했습니다',
          message: '예약 페이지에 접근할 수 없습니다. 상담사에게 문의해주세요.',
        };
    }
  };

  const { title, message } = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary px-4">
      <div className="max-w-md w-full card text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-error"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-4">{title}</h1>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="text-sm text-text-tertiary">
          <p>문제가 지속되면 상담사에게 문의해주세요.</p>
        </div>
      </div>
    </div>
  );
}

