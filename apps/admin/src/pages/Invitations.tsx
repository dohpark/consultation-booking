import { useState } from 'react';
import { Mail, Copy, Check, Send } from 'lucide-react';
import { useToast } from '../shared/contexts/ToastContext';
import { createInvitation } from '../domains/invitations/services/invitationsService';
import type { InvitationResponse } from '../domains/invitations/types';

const Invitations = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<InvitationResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateInvitation = async () => {
    if (!email.trim()) {
      showToast('이메일을 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createInvitation({ email: email.trim() });
      setInvitation(result);
      showToast('이메일이 전송되었습니다.', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이메일 전송에 실패했습니다.';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!invitation?.link) return;

    try {
      await navigator.clipboard.writeText(invitation.link);
      setCopied(true);
      showToast('링크가 클립보드에 복사되었습니다.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('링크 복사에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">초대 링크 관리</h1>
        <p className="text-text-secondary text-sm mt-1">예약자에게 초대 링크를 이메일로 전송합니다</p>
      </div>

      {/* Email Sending Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">이메일 보내기</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
              이메일 주소
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="예약자 이메일을 입력하세요"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleCreateInvitation}
            disabled={isLoading || !email.trim()}
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>전송 중...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>이메일 보내기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sent Email Info Section */}
      {invitation && (
        <div className="card border-primary/20 bg-primary-light/5">
          <div className="flex items-center gap-3 mb-4">
            <Check className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-text-primary">이메일 전송 완료</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">초대 링크</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={invitation.link}
                  readOnly
                  className="flex-1 px-4 py-2 border border-border rounded-lg bg-bg-secondary text-text-primary font-mono text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="btn-outline flex items-center gap-2 whitespace-nowrap"
                  title="링크 복사"
                >
                  {copied ? (
                    <>
                      <Check size={18} className="text-success" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">이메일</label>
                <p className="text-text-primary">{invitation.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">만료일</label>
                <p className="text-text-primary">
                  {new Date(invitation.expiresAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="p-4 bg-bg-secondary rounded-lg">
              <p className="text-sm text-text-secondary">
                이메일이 전송되었습니다. 예약자가 이메일의 링크를 클릭하면 예약 페이지로 이동합니다. 필요시 위의 링크를
                복사하여 직접 전달할 수도 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invitations;
