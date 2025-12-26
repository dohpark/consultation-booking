import { useEffect, useRef } from 'react';
import { GOOGLE_SCRIPT_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_SUFFIX } from '../constants';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => Promise<void>;
  onError: (error: Error) => void;
}

export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isClientIdEmpty = !GOOGLE_CLIENT_ID;
    if (isClientIdEmpty) {
      const error = new Error('Google Client ID가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      console.error('VITE_GOOGLE_CLIENT_ID is not set in .env file');
      onError(error);
      return;
    }

    const isClientIdFormatValid = GOOGLE_CLIENT_ID.includes(GOOGLE_CLIENT_ID_SUFFIX);
    if (!isClientIdFormatValid) {
      const error = new Error(
        `Client ID 형식이 올바르지 않습니다.\n현재 값: ${GOOGLE_CLIENT_ID}\n\n올바른 형식: xxxxx.apps.googleusercontent.com`,
      );
      console.error('❌ Client ID 형식이 올바르지 않습니다:', GOOGLE_CLIENT_ID);
      console.error('Client ID는 보통 xxxxx.apps.googleusercontent.com 형식이어야 합니다.');
      onError(error);
      return;
    }

    if (!buttonRef.current) return;

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(buttonRef.current!, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
        });
      }
    };

    script.onerror = () => {
      const error = new Error('Failed to load Google Identity Services script');
      console.error(error.message);
      onError(error);
    };

    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [onSuccess, onError]);

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      await onSuccess(response.credential);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  return <div ref={buttonRef} className="w-full flex justify-center" />;
}

